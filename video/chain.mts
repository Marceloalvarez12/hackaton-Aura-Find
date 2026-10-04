// Helpers on-chain para la grabación del demo.
//   node video/dist/chain.cjs prepare     -> crea/fondea la wallet del UI y le hace fondear la #2
//   node video/dist/chain.cjs repay <id>  -> el issuer repaga la factura <id>
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { AnchorProvider } from "@coral-xyz/anchor";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { FactoringClient, findInvoicePda, mintUsdcTo, DEMO_INVOICES } from "../sdk/src/index";

const ROOT = join(dirname(process.argv[1]), "..", "..");
const env = Object.fromEntries(
  readFileSync(join(ROOT, "app/.env.local"), "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => l.split("=") as [string, string])
);
const connection = new Connection(env.NEXT_PUBLIC_RPC_URL, "confirmed");
const usdcMint = new PublicKey(env.NEXT_PUBLIC_USDC_MINT);

const load = (p: string) => Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(p, "utf8"))));
const issuer = load(join(ROOT, "deploy-keys/deployer.json"));
const uiPath = join(ROOT, "deploy-keys/demo-ui-wallet.json");
if (!existsSync(uiPath)) writeFileSync(uiPath, JSON.stringify(Array.from(Keypair.generate().secretKey)));
const ui = load(uiPath);

const clientFor = (kp: Keypair) =>
  new FactoringClient(
    new AnchorProvider(
      connection,
      {
        publicKey: kp.publicKey,
        payer: kp,
        signTransaction: async (tx: any) => (tx.partialSign(kp), tx),
        signAllTransactions: async (txs: any[]) => (txs.forEach((t) => t.partialSign(kp)), txs),
      } as any,
      { commitment: "confirmed" }
    ),
    usdcMint
  );

async function prepare() {
  const sig = await connection.requestAirdrop(ui.publicKey, 5 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction({ signature: sig, ...(await connection.getLatestBlockhash()) });
  await mintUsdcTo(connection, issuer, usdcMint, ui.publicKey, 150_000);
  const c = clientFor(ui);
  const [inv2] = findInvoicePda(issuer.publicKey, 2);
  await c.send(await c.fundInvoiceTx(inv2, DEMO_INVOICES[1].yieldBps));
  console.log("UI wallet", ui.publicKey.toBase58(), "lista: 5 SOL, 150k USDC, posición en #2");
}

async function repay(id: number) {
  const c = clientFor(issuer);
  const [inv] = findInvoicePda(issuer.publicKey, id);
  console.log("repay", id, await c.send(await c.repayInvoiceTx(inv)));
}

const [cmd, arg] = process.argv.slice(2);
(cmd === "prepare" ? prepare() : repay(Number(arg))).catch((e) => {
  console.error(e);
  process.exit(1);
});
