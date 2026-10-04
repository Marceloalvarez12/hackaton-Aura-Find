// Repaga la factura demo con la keypair del issuer (deployer).
// Simula el pago de la empresa al vencimiento para la demo.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { AnchorProvider } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { FactoringClient, findInvoicePda } from "../src/index";

const here = dirname(process.argv[1]);
const ROOT = join(here, "..", "..");
const RPC_URL = process.env.RPC_URL ?? "http://localhost:8899";
const USDC_MINT = new PublicKey(process.env.USDC_MINT ??
  "Hs8XpYwhr7Rw98eVpLYg5h9Xjy9Fx1iwkWkZgoDw8Ves");

const kp = Keypair.fromSecretKey(
  Uint8Array.from(
    JSON.parse(readFileSync(join(ROOT, "deploy-keys/deployer.json"), "utf8"))
  )
);

const connection = new Connection(RPC_URL, "confirmed");
const wallet = {
  publicKey: kp.publicKey,
  payer: kp,
  signTransaction: async (tx: any) => (tx.partialSign(kp), tx),
  signAllTransactions: async (txs: any[]) => {
    txs.forEach((t) => t.partialSign(kp));
    return txs;
  },
};

async function main() {
  const client = new FactoringClient(
    new AnchorProvider(connection, wallet as any, { commitment: "confirmed" }),
    USDC_MINT
  );
  const [invoice] = findInvoicePda(kp.publicKey, 1);
  console.log("repaying invoice", invoice.toBase58());
  console.log("sig:", await client.send(await client.repayInvoiceTx(invoice)));
  console.log("Done — el investor ya puede hacer Withdraw en la UI");
}

main().catch((e) => {
  console.error("REPAY FAILED:", e);
  process.exit(1);
});
