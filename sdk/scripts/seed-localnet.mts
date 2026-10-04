// Seed de localnet para la demo Aura Fint.
// Crea USDC mock, inicializa el protocolo, emite + verifica las 6 facturas
// del fixture, y deja el marketplace con estados mezclados:
//   #1, #2, #3 -> Listed (fondeables por el usuario)
//   #4        -> Funded por un inversor demo
//   #5        -> Repaid (fondeada + repagada, lista para withdraw del demo)
//   #6        -> Listed sin verificar (muestra el gate de compliance)
// Uso: esbuild bundle -> node sdk/dist/seed.cjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { AnchorProvider } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  FactoringClient,
  createMockUsdc,
  mintUsdcTo,
  demoInvoiceParams,
  findInvoicePda,
  DEMO_INVOICES,
} from "../src/index";

const here = dirname(process.argv[1]);
const ROOT = join(here, "..", "..");
const INVESTOR_WALLET =
  process.env.INVESTOR_WALLET ?? "GtJYcpZAAWeQ4nQB36B9wSShkXCPByRjCGRhUCTsNGTJ";
const RPC_URL = process.env.RPC_URL ?? "http://localhost:8899";

const loadOrCreate = (path: string) => {
  if (existsSync(path)) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path, "utf8"))));
  }
  const kp = Keypair.generate();
  writeFileSync(path, JSON.stringify(Array.from(kp.secretKey)));
  return kp;
};

const issuer = loadOrCreate(join(ROOT, "deploy-keys/deployer.json"));
const demoInvestor = loadOrCreate(join(ROOT, "deploy-keys/demo-investor.json"));

const connection = new Connection(RPC_URL, "confirmed");

const walletFor = (kp: Keypair) => ({
  publicKey: kp.publicKey,
  payer: kp,
  signTransaction: async (tx: any) => (tx.partialSign(kp), tx),
  signAllTransactions: async (txs: any[]) => (txs.forEach((t) => t.partialSign(kp)), txs),
});

const clientFor = (kp: Keypair, usdcMint: PublicKey) =>
  new FactoringClient(
    new AnchorProvider(connection, walletFor(kp) as any, { commitment: "confirmed" }),
    usdcMint
  );

async function main() {
  console.log("== 1. Mock USDC");
  const usdcMint = await createMockUsdc(connection, issuer);
  console.log("   USDC_MINT:", usdcMint.toBase58());

  const issuerClient = clientFor(issuer, usdcMint);
  const treasury = getAssociatedTokenAddressSync(usdcMint, issuer.publicKey);

  console.log("== 2. initialize (admin=verifier=issuer, fee=50bps)");
  await issuerClient.send(await issuerClient.initializeTx(50, issuer.publicKey, treasury));

  console.log("== 3. Fondos: SOL + USDC");
  await connection.requestAirdrop(demoInvestor.publicKey, 5_000_000_000);
  await connection.requestAirdrop(new PublicKey(INVESTOR_WALLET), 5_000_000_000);
  await new Promise((r) => setTimeout(r, 1500));
  await mintUsdcTo(connection, issuer, usdcMint, demoInvestor.publicKey, 200_000);
  await mintUsdcTo(connection, issuer, usdcMint, new PublicKey(INVESTOR_WALLET), 150_000);
  await mintUsdcTo(connection, issuer, usdcMint, issuer.publicKey, 500_000);
  console.log("   demo investor: 200k USDC | tu phantom: 150k USDC | issuer: 500k USDC");

  console.log("== 4. Emitir las 6 facturas");
  for (const meta of DEMO_INVOICES) {
    const res = await issuerClient.createInvoiceTx(await demoInvoiceParams(meta));
    await issuerClient.send(res);
    console.log(`   #${meta.invoiceId} ${meta.issuerName} -> ${meta.debtorName}: ${res.invoice.toBase58()}`);
  }

  console.log("== 5. Verificar #1..#5 (#6 queda sin verificar a propósito)");
  for (const meta of DEMO_INVOICES.slice(0, 5)) {
    const [invoice] = findInvoicePda(issuer.publicKey, meta.invoiceId);
    await issuerClient.send(await issuerClient.verifyInvoiceTx(invoice));
  }

  const investorClient = clientFor(demoInvestor, usdcMint);

  console.log("== 6. Inversor demo fondea #4 y #5");
  for (const id of [4, 5]) {
    const meta = DEMO_INVOICES[id - 1];
    const [invoice] = findInvoicePda(issuer.publicKey, id);
    await investorClient.send(await investorClient.fundInvoiceTx(invoice, meta.yieldBps));
    console.log(`   #${id} funded @ ${meta.yieldBps}bps`);
  }

  console.log("== 7. Issuer repaga #5");
  {
    const [invoice] = findInvoicePda(issuer.publicKey, 5);
    await issuerClient.send(await issuerClient.repayInvoiceTx(invoice));
    console.log("   #5 repaid — vault con principal + yield esperando withdraw");
  }

  mkdirSync(join(ROOT, "app"), { recursive: true });
  writeFileSync(
    join(ROOT, "app/.env.local"),
    [
      `NEXT_PUBLIC_RPC_URL=${RPC_URL}`,
      `NEXT_PUBLIC_USDC_MINT=${usdcMint.toBase58()}`,
      `NEXT_PUBLIC_DEMO_ISSUER=${issuer.publicKey.toBase58()}`,
      `NEXT_PUBLIC_DEMO_INVESTOR=${demoInvestor.publicKey.toBase58()}`,
      "",
    ].join("\n")
  );
  console.log("== app/.env.local escrito");
  console.log("\nEstado final: #1 #2 #3 Listed+verified | #4 Funded | #5 Repaid | #6 Listed sin verificar");
}

main().catch((e) => {
  console.error("SEED FAILED:", e);
  process.exit(1);
});
