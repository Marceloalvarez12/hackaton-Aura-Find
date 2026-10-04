import {
  AnchorProvider,
  BN,
  EventParser,
  Idl,
  Program,
} from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getAssociatedTokenAddressSync,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import idlJson from "./idl/factoring.json";
import { findConfigPda, findEscrowPda, findInvoicePda } from "./pdas";
import { USDC_MINT_DEVNET } from "./constants";
import type {
  CreateInvoiceParams,
  EscrowAccount,
  InvoiceAccount,
  TimelineEvent,
  TxResult,
} from "./types";

const IDL = idlJson as Idl;

/**
 * SHA-256 del documento fiscal off-chain -> document_hash on-chain.
 * Funciona en Node 20+ y en browsers (crypto.subtle).
 */
export async function hashDocument(
  data: Uint8Array | string
): Promise<Uint8Array> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as BufferSource));
}

export class FactoringClient {
  readonly provider: AnchorProvider;
  readonly program: Program<Idl>;
  readonly usdcMint: PublicKey;

  constructor(provider: AnchorProvider, usdcMint: PublicKey = USDC_MINT_DEVNET) {
    this.provider = provider;
    this.usdcMint = usdcMint;
    this.program = new Program(IDL, provider);
  }

  get wallet(): PublicKey {
    return this.provider.wallet.publicKey;
  }

  // ---------------------------------------------------------------- reads

  async fetchInvoice(invoice: PublicKey): Promise<InvoiceAccount> {
    return (this.program.account as any).invoice.fetch(invoice);
  }

  async fetchEscrow(invoice: PublicKey): Promise<EscrowAccount> {
    const [escrow] = findEscrowPda(invoice, this.program.programId);
    return (this.program.account as any).escrow.fetch(escrow);
  }

  /** Todas las facturas — para el marketplace del frontend. */
  async fetchAllInvoices(): Promise<
    { publicKey: PublicKey; account: InvoiceAccount }[]
  > {
    return (this.program.account as any).invoice.all();
  }

  /**
   * Balance USDC del vault del escrow. `null` si el vault fue cerrado
   * (es decir, el inversor ya retiró el repago).
   */
  async fetchVaultBalance(invoice: PublicKey): Promise<number | null> {
    const [escrow] = findEscrowPda(invoice, this.program.programId);
    const vault = getAssociatedTokenAddressSync(this.usdcMint, escrow, true);
    const info = await this.provider.connection.getTokenAccountBalance(vault).catch(() => null);
    return info ? Number(info.value.amount) : null;
  }

  /**
   * Historia de la factura reconstruida 100% desde la cadena: firmas que
   * tocaron la cuenta + eventos Anchor emitidos en cada transacción.
   */
  async fetchInvoiceTimeline(invoice: PublicKey): Promise<TimelineEvent[]> {
    const conn = this.provider.connection;
    const sigs = (await conn.getSignaturesForAddress(invoice, { limit: 100 })).filter(
      (s) => !s.err
    );
    if (sigs.length === 0) return [];
    const txs = await conn.getTransactions(
      sigs.map((s) => s.signature),
      { commitment: "confirmed", maxSupportedTransactionVersion: 0 }
    );
    const parser = new EventParser(this.program.programId, this.program.coder);
    const out: TimelineEvent[] = [];
    txs.forEach((tx, i) => {
      for (const ev of parser.parseLogs(tx?.meta?.logMessages ?? [])) {
        out.push({
          // Anchor camelCasea los nombres; los devolvemos como el struct de Rust.
          name: ev.name.charAt(0).toUpperCase() + ev.name.slice(1),
          data: ev.data as Record<string, unknown>,
          signature: sigs[i].signature,
          slot: sigs[i].slot,
          blockTime: sigs[i].blockTime ?? null,
        });
      }
    });
    return out.sort((a, b) => a.slot - b.slot);
  }

  // --------------------------------------------------------------- writes

  /** Admin: crea el Config global del protocolo. */
  async initializeTx(
    feeBps: number,
    verifier: PublicKey,
    treasuryUsdcAta: PublicKey
  ): Promise<TxResult> {
    const [config] = findConfigPda(this.program.programId);
    const ix = await this.program.methods
      .initialize(feeBps)
      .accounts({
        admin: this.wallet,
        config,
        verifier,
        treasuryUsdcAta,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
    return { tx: new Transaction().add(ix), signers: [] };
  }

  /**
   * Issuer: crea la factura + el mint RWA (Token-2022) en una sola tx.
   * El mint nace con mintAuthority = escrow PDA, decimals = 0, supply 0 —
   * exactamente lo que fund_invoice exige.
   */
  async createInvoiceTx(
    params: CreateInvoiceParams
  ): Promise<TxResult & { invoice: PublicKey; rwaMint: PublicKey }> {
    const issuer = this.wallet;
    const [invoice] = findInvoicePda(
      issuer,
      params.invoiceId,
      this.program.programId
    );
    const [escrow] = findEscrowPda(invoice, this.program.programId);

    const rwaMint = Keypair.generate();
    const lamports = await this.provider.connection.getMinimumBalanceForRentExemption(
      getMintLen([])
    );

    const ix = await this.program.methods
      .createInvoice(
        new BN(params.invoiceId.toString()),
        new BN(params.amount.toString()),
        new BN(params.dueDate),
        Array.from(params.documentHash),
        params.metadataUri
      )
      .accounts({
        issuer,
        invoice,
        rwaMint: rwaMint.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: issuer,
        newAccountPubkey: rwaMint.publicKey,
        space: getMintLen([]),
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        rwaMint.publicKey,
        0,
        escrow,
        null,
        TOKEN_2022_PROGRAM_ID
      ),
      ix
    );

    return { tx, signers: [rwaMint], invoice, rwaMint: rwaMint.publicKey };
  }

  /** Verifier (backend): atestigua que la factura off-chain es legítima. */
  async verifyInvoiceTx(invoice: PublicKey): Promise<TxResult> {
    const [config] = findConfigPda(this.program.programId);
    const ix = await this.program.methods
      .verifyInvoice()
      .accounts({
        verifier: this.wallet,
        config,
        invoice,
      })
      .instruction();
    return { tx: new Transaction().add(ix), signers: [] };
  }

  /**
   * Investor: fondea la factura. USDC -> issuer, RWA (1 token) -> investor,
   * se crea el Escrow + su vault USDC.
   */
  async fundInvoiceTx(
    invoice: PublicKey,
    yieldBps: number
  ): Promise<TxResult> {
    const investor = this.wallet;
    const inv = await this.fetchInvoice(invoice);
    const [escrow] = findEscrowPda(invoice, this.program.programId);

    const ix = await this.program.methods
      .fundInvoice(yieldBps)
      .accounts({
        investor,
        invoice,
        issuer: inv.issuer,
        escrow,
        usdcTokenProgram: TOKEN_PROGRAM_ID,
        rwaTokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        usdcMint: this.usdcMint,
        rwaMint: inv.mint,
        investorUsdcAta: getAssociatedTokenAddressSync(this.usdcMint, investor),
        issuerUsdcAta: getAssociatedTokenAddressSync(this.usdcMint, inv.issuer, true),
        escrowUsdcVault: getAssociatedTokenAddressSync(this.usdcMint, escrow, true),
        investorRwaAta: getAssociatedTokenAddressSync(
          inv.mint,
          investor,
          false,
          TOKEN_2022_PROGRAM_ID
        ),
      })
      .instruction();
    return { tx: new Transaction().add(ix), signers: [] };
  }

  /** Issuer: deposita principal + yield en el vault del escrow. */
  async repayInvoiceTx(invoice: PublicKey): Promise<TxResult> {
    const issuer = this.wallet;
    const [escrow] = findEscrowPda(invoice, this.program.programId);

    const ix = await this.program.methods
      .repayInvoice()
      .accounts({
        invoice,
        issuer,
        escrow,
        usdcTokenProgram: TOKEN_PROGRAM_ID,
        usdcMint: this.usdcMint,
        issuerUsdcAta: getAssociatedTokenAddressSync(this.usdcMint, issuer),
        escrowUsdcVault: getAssociatedTokenAddressSync(this.usdcMint, escrow, true),
      })
      .instruction();
    return { tx: new Transaction().add(ix), signers: [] };
  }

  /** Investor: retira el repago del vault y recupera el rent. */
  async withdrawRepaymentTx(invoice: PublicKey): Promise<TxResult> {
    const investor = this.wallet;
    const [escrow] = findEscrowPda(invoice, this.program.programId);

    const ix = await this.program.methods
      .withdrawRepayment()
      .accounts({
        investor,
        invoice,
        escrow,
        usdcTokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        usdcMint: this.usdcMint,
        investorUsdcAta: getAssociatedTokenAddressSync(this.usdcMint, investor),
        escrowUsdcVault: getAssociatedTokenAddressSync(this.usdcMint, escrow, true),
      })
      .instruction();
    return { tx: new Transaction().add(ix), signers: [] };
  }

  /** Issuer: retira una factura Listed que todavía no fue fondeada. */
  async cancelInvoiceTx(invoice: PublicKey): Promise<TxResult> {
    const ix = await this.program.methods
      .cancelInvoice()
      .accounts({ invoice, issuer: this.wallet })
      .instruction();
    return { tx: new Transaction().add(ix), signers: [] };
  }

  /** Investor: declara default pasado el vencimiento + período de gracia. */
  async markDefaultedTx(invoice: PublicKey): Promise<TxResult> {
    const [escrow] = findEscrowPda(invoice, this.program.programId);
    const ix = await this.program.methods
      .markDefaulted()
      .accounts({ invoice, escrow, investor: this.wallet })
      .instruction();
    return { tx: new Transaction().add(ix), signers: [] };
  }

  /** Helper: firma y envía una TxResult con los signers extra (ej: rwaMint). */
  async send({ tx, signers }: TxResult): Promise<string> {
    return this.provider.sendAndConfirm(tx, signers);
  }
}
