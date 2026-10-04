// Suite E2E de Aura Fint contra un validator local con el programa deployado.
// Corre: pnpm test:e2e   (requiere solana-test-validator en localhost:8899)
//
// Cada escenario usa issuer/investor recién generados, así que la suite es
// idempotente y no interfiere con el estado del seed de la demo.
import { assert } from "chai";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
  CreateInvoiceParams,
  FactoringClient,
  createMockUsdc,
  findConfigPda,
  findEscrowPda,
  findInvoicePda,
  hashDocument,
  invoiceStatusLabel,
  InvoiceStatus,
  mintUsdcTo,
} from "../sdk/src/index";

const RPC_URL = process.env.RPC_URL ?? "http://localhost:8899";
const ROOT = join(__dirname, "..", "..");
const connection = new Connection(RPC_URL, "confirmed");

const USDC = 1_000_000n;
const now = () => Math.floor(Date.now() / 1000);

const verifier = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(readFileSync(join(ROOT, "deploy-keys/deployer.json"), "utf8")))
);

const walletFor = (kp: Keypair) => ({
  publicKey: kp.publicKey,
  payer: kp,
  signTransaction: async (tx: any) => (tx.partialSign(kp), tx),
  signAllTransactions: async (txs: any[]) => (txs.forEach((t) => t.partialSign(kp)), txs),
});

let usdcMint: PublicKey;
let usdcAuthority: Keypair;

const clientFor = (kp: Keypair) =>
  new FactoringClient(
    new AnchorProvider(connection, walletFor(kp) as any, { commitment: "confirmed" }),
    usdcMint
  );

async function airdrop(pk: PublicKey, sol = 5) {
  const sig = await connection.requestAirdrop(pk, sol * LAMPORTS_PER_SOL);
  const bh = await connection.getLatestBlockhash();
  await connection.confirmTransaction({ signature: sig, ...bh }, "confirmed");
}

async function usdcBalance(owner: PublicKey): Promise<bigint> {
  const ata = getAssociatedTokenAddressSync(usdcMint, owner, true);
  return (await getAccount(connection, ata)).amount;
}

async function parties() {
  const issuer = Keypair.generate();
  const investor = Keypair.generate();
  await Promise.all([airdrop(issuer.publicKey), airdrop(investor.publicKey)]);
  await mintUsdcTo(connection, usdcAuthority, usdcMint, issuer.publicKey, 100_000);
  await mintUsdcTo(connection, usdcAuthority, usdcMint, investor.publicKey, 100_000);
  return {
    issuer,
    investor,
    issuerClient: clientFor(issuer),
    investorClient: clientFor(investor),
    verifierClient: clientFor(verifier),
  };
}

async function createInvoice(c: FactoringClient, overrides: Partial<CreateInvoiceParams> = {}) {
  const res = await c.createInvoiceTx({
    invoiceId: 1,
    amount: 10_000n * USDC,
    dueDate: now() + 30 * 86_400,
    documentHash: await hashDocument(`factura-${Math.random()}`),
    metadataUri: "https://arweave.net/aura-fint/test.json",
    ...overrides,
  });
  await c.send(res);
  return res.invoice;
}

/** Espera que la tx falle con un error Anchor/runtime específico. */
async function expectError(p: Promise<unknown>, expected: string) {
  try {
    await p;
  } catch (e: any) {
    const logs: string[] = e?.transactionLogs ?? e?.logs ?? [];
    const haystack = [String(e?.message ?? e), ...logs].join("\n");
    assert.include(haystack, expected, `esperaba "${expected}", obtuve:\n${haystack}`);
    return;
  }
  assert.fail(`esperaba que la tx fallara con "${expected}", pero fue exitosa`);
}

const statusOf = async (c: FactoringClient, invoice: PublicKey) =>
  invoiceStatusLabel((await c.fetchInvoice(invoice)).status);

describe("Aura Fint — protocolo de factoring tokenizado", function () {
  this.timeout(120_000);

  before(async () => {
    usdcAuthority = Keypair.generate();
    await Promise.all([airdrop(usdcAuthority.publicKey, 20), airdrop(verifier.publicKey, 5)]);
    usdcMint = await createMockUsdc(connection, usdcAuthority);

    const [config] = findConfigPda();
    if (!(await connection.getAccountInfo(config))) {
      const vc = clientFor(verifier);
      const treasury = getAssociatedTokenAddressSync(usdcMint, verifier.publicKey);
      await vc.send(await vc.initializeTx(50, verifier.publicKey, treasury));
    }
  });

  describe("Happy path: emitir → verificar → fondear → repagar → retirar", () => {
    it("liquida el ciclo completo con los balances exactos", async () => {
      const { issuer, investor, issuerClient, investorClient, verifierClient } = await parties();
      const amount = 10_000n * USDC;
      const yieldBps = 500;
      const repayment = (amount * BigInt(10_000 + yieldBps)) / 10_000n;

      // 1. Emitir
      const invoice = await createInvoice(issuerClient, { amount });
      const created = await issuerClient.fetchInvoice(invoice);
      const [escrowPda] = findEscrowPda(invoice);
      assert.equal(invoiceStatusLabel(created.status), InvoiceStatus.Listed);
      assert.isFalse(created.isVerified);
      const mintBefore = await getMint(connection, created.mint, "confirmed", TOKEN_2022_PROGRAM_ID);
      assert.equal(mintBefore.supply, 0n, "el RWA nace con supply 0");
      assert.equal(mintBefore.decimals, 0);
      assert.isTrue(mintBefore.mintAuthority!.equals(escrowPda), "solo el escrow PDA puede mintear");

      // 2. Verificar
      await verifierClient.send(await verifierClient.verifyInvoiceTx(invoice));
      assert.isTrue((await issuerClient.fetchInvoice(invoice)).isVerified);

      // 3. Fondear
      const issuerBefore = await usdcBalance(issuer.publicKey);
      const investorBefore = await usdcBalance(investor.publicKey);
      await investorClient.send(await investorClient.fundInvoiceTx(invoice, yieldBps));

      assert.equal(await statusOf(issuerClient, invoice), InvoiceStatus.Funded);
      assert.equal(await usdcBalance(issuer.publicKey), issuerBefore + amount, "el issuer recibe liquidez");
      assert.equal(await usdcBalance(investor.publicKey), investorBefore - amount);

      const rwaAta = getAssociatedTokenAddressSync(created.mint, investor.publicKey, false, TOKEN_2022_PROGRAM_ID);
      const rwa = await getAccount(connection, rwaAta, "confirmed", TOKEN_2022_PROGRAM_ID);
      assert.equal(rwa.amount, 1n, "el inversor recibe exactamente 1 RWA");
      const mintAfter = await getMint(connection, created.mint, "confirmed", TOKEN_2022_PROGRAM_ID);
      assert.equal(mintAfter.supply, 1n);

      const escrow = await investorClient.fetchEscrow(invoice);
      assert.isTrue(escrow.investor.equals(investor.publicKey));
      assert.equal(escrow.principal.toString(), amount.toString());
      assert.equal(escrow.yieldBps, yieldBps);

      // 4. Repagar
      await issuerClient.send(await issuerClient.repayInvoiceTx(invoice));
      assert.equal(await statusOf(issuerClient, invoice), InvoiceStatus.Repaid);
      assert.equal(BigInt((await issuerClient.fetchVaultBalance(invoice))!), repayment, "vault = principal + yield");

      // 5. Retirar
      await investorClient.send(await investorClient.withdrawRepaymentTx(invoice));
      assert.equal(
        await usdcBalance(investor.publicKey),
        investorBefore - amount + repayment,
        "el inversor termina con +yield neto"
      );
      const vault = getAssociatedTokenAddressSync(usdcMint, escrowPda, true);
      assert.isNull(await connection.getAccountInfo(vault), "el vault se cierra y devuelve el rent");
    });

    it("reconstruye el timeline completo desde los eventos on-chain", async () => {
      const { issuerClient, investorClient, verifierClient } = await parties();
      const invoice = await createInvoice(issuerClient);
      await verifierClient.send(await verifierClient.verifyInvoiceTx(invoice));
      await investorClient.send(await investorClient.fundInvoiceTx(invoice, 500));
      await issuerClient.send(await issuerClient.repayInvoiceTx(invoice));
      await investorClient.send(await investorClient.withdrawRepaymentTx(invoice));

      const names = (await issuerClient.fetchInvoiceTimeline(invoice)).map((e) => e.name);
      assert.deepEqual(names, [
        "InvoiceCreated",
        "InvoiceVerified",
        "InvoiceFunded",
        "InvoiceRepaid",
        "RepaymentWithdrawn",
      ]);
    });
  });

  describe("Emisión", () => {
    it("rechaza una fecha de vencimiento en el pasado", async () => {
      const { issuerClient } = await parties();
      await expectError(createInvoice(issuerClient, { dueDate: now() - 60 }), "InvalidDueDate");
    });

    it("rechaza una metadata URI de más de 120 caracteres", async () => {
      const { issuerClient } = await parties();
      await expectError(
        createInvoice(issuerClient, { metadataUri: `https://arweave.net/${"x".repeat(110)}` }),
        "MetadataUriTooLong"
      );
    });

    it("no permite emitir dos veces el mismo invoice_id", async () => {
      const { issuerClient } = await parties();
      await createInvoice(issuerClient, { invoiceId: 7 });
      await expectError(createInvoice(issuerClient, { invoiceId: 7 }), "already in use");
    });
  });

  describe("Compliance", () => {
    it("bloquea el fondeo de facturas no verificadas", async () => {
      const { issuerClient, investorClient } = await parties();
      const invoice = await createInvoice(issuerClient);
      await expectError(investorClient.send(await investorClient.fundInvoiceTx(invoice, 500)), "InvoiceNotVerified");
    });

    it("solo el verifier del Config puede verificar", async () => {
      const { issuerClient } = await parties();
      const invoice = await createInvoice(issuerClient);
      await expectError(issuerClient.send(await issuerClient.verifyInvoiceTx(invoice)), "Unauthorized");
    });
  });

  describe("Fondeo", () => {
    async function verified() {
      const p = await parties();
      const invoice = await createInvoice(p.issuerClient);
      await p.verifierClient.send(await p.verifierClient.verifyInvoiceTx(invoice));
      return { ...p, invoice };
    }

    it("el issuer no puede fondear su propia factura", async () => {
      const { issuerClient, invoice } = await verified();
      await expectError(issuerClient.send(await issuerClient.fundInvoiceTx(invoice, 500)), "Unauthorized");
    });

    it("rechaza yield fuera de rango (0 bps)", async () => {
      const { investorClient, invoice } = await verified();
      await expectError(investorClient.send(await investorClient.fundInvoiceTx(invoice, 0)), "InvalidYield");
    });

    it("una factura no puede fondearse dos veces", async () => {
      const { investorClient, invoice } = await verified();
      await investorClient.send(await investorClient.fundInvoiceTx(invoice, 500));
      const other = Keypair.generate();
      await airdrop(other.publicKey);
      await mintUsdcTo(connection, usdcAuthority, usdcMint, other.publicKey, 100_000);
      const oc = clientFor(other);
      await expectError(oc.send(await oc.fundInvoiceTx(invoice, 500)), "already in use");
    });

    it("rechaza un mint RWA cuya authority no es el escrow PDA", async () => {
      const { issuer, issuerClient, investorClient, verifierClient } = await parties();
      const [invoice] = findInvoicePda(issuer.publicKey, 1);
      const rogueMint = Keypair.generate();
      const space = getMintLen([]);
      const ix = await issuerClient.program.methods
        .createInvoice(
          new BN(1),
          new BN((10_000n * USDC).toString()),
          new BN(now() + 30 * 86_400),
          Array.from(await hashDocument("rogue")),
          "https://arweave.net/rogue.json"
        )
        .accounts({
          issuer: issuer.publicKey,
          invoice,
          rwaMint: rogueMint.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      const tx = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: issuer.publicKey,
          newAccountPubkey: rogueMint.publicKey,
          space,
          lamports: await connection.getMinimumBalanceForRentExemption(space),
          programId: TOKEN_2022_PROGRAM_ID,
        }),
        // authority = issuer: podría mintear RWAs extra por fuera del protocolo
        createInitializeMintInstruction(rogueMint.publicKey, 0, issuer.publicKey, null, TOKEN_2022_PROGRAM_ID),
        ix
      );
      await issuerClient.send({ tx, signers: [rogueMint] });
      await verifierClient.send(await verifierClient.verifyInvoiceTx(invoice));
      await expectError(investorClient.send(await investorClient.fundInvoiceTx(invoice, 500)), "InvalidMintAuthority");
    });
  });

  describe("Repago y retiro", () => {
    async function funded() {
      const p = await parties();
      const invoice = await createInvoice(p.issuerClient);
      await p.verifierClient.send(await p.verifierClient.verifyInvoiceTx(invoice));
      await p.investorClient.send(await p.investorClient.fundInvoiceTx(invoice, 500));
      return { ...p, invoice };
    }

    it("solo el issuer puede repagar", async () => {
      const { investorClient, invoice } = await funded();
      await expectError(investorClient.send(await investorClient.repayInvoiceTx(invoice)), "Unauthorized");
    });

    it("no se puede retirar antes del repago", async () => {
      const { investorClient, invoice } = await funded();
      await expectError(investorClient.send(await investorClient.withdrawRepaymentTx(invoice)), "InvoiceNotRepaid");
    });

    it("solo el inversor del escrow puede retirar", async () => {
      const { issuerClient, invoice } = await funded();
      await issuerClient.send(await issuerClient.repayInvoiceTx(invoice));
      const attacker = Keypair.generate();
      await airdrop(attacker.publicKey);
      const ac = clientFor(attacker);
      await expectError(ac.send(await ac.withdrawRepaymentTx(invoice)), "Unauthorized");
    });

    it("rechaza el doble retiro (vault cerrado)", async () => {
      const { issuerClient, investorClient, invoice } = await funded();
      await issuerClient.send(await issuerClient.repayInvoiceTx(invoice));
      await investorClient.send(await investorClient.withdrawRepaymentTx(invoice));
      await expectError(
        investorClient.send(await investorClient.withdrawRepaymentTx(invoice)),
        "AccountNotInitialized"
      );
    });
  });

  describe("Cancelación y default", () => {
    it("el issuer cancela una factura Listed y queda bloqueada", async () => {
      const { issuerClient, investorClient, verifierClient } = await parties();
      const invoice = await createInvoice(issuerClient);
      await issuerClient.send(await issuerClient.cancelInvoiceTx(invoice));
      assert.equal(await statusOf(issuerClient, invoice), InvoiceStatus.Cancelled);
      await expectError(verifierClient.send(await verifierClient.verifyInvoiceTx(invoice)), "InvalidStatusTransition");
      await expectError(investorClient.send(await investorClient.fundInvoiceTx(invoice, 500)), "InvoiceNotFundable");
    });

    it("nadie más que el issuer puede cancelar", async () => {
      const { issuerClient, investorClient } = await parties();
      const invoice = await createInvoice(issuerClient);
      await expectError(investorClient.send(await investorClient.cancelInvoiceTx(invoice)), "Unauthorized");
    });

    it("no se puede cancelar una factura ya fondeada", async () => {
      const { issuerClient, investorClient, verifierClient } = await parties();
      const invoice = await createInvoice(issuerClient);
      await verifierClient.send(await verifierClient.verifyInvoiceTx(invoice));
      await investorClient.send(await investorClient.fundInvoiceTx(invoice, 500));
      await expectError(issuerClient.send(await issuerClient.cancelInvoiceTx(invoice)), "InvalidStatusTransition");
    });

    it("no se puede declarar default antes del vencimiento + gracia", async () => {
      const { issuerClient, investorClient, verifierClient } = await parties();
      const invoice = await createInvoice(issuerClient);
      await verifierClient.send(await verifierClient.verifyInvoiceTx(invoice));
      await investorClient.send(await investorClient.fundInvoiceTx(invoice, 500));
      await expectError(investorClient.send(await investorClient.markDefaultedTx(invoice)), "MaturityNotReached");
    });
  });
});
