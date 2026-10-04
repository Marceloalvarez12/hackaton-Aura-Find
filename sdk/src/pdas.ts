import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";

export const CONFIG_SEED = Buffer.from("config");
export const INVOICE_SEED = Buffer.from("invoice");
export const ESCROW_SEED = Buffer.from("escrow");

export function findConfigPda(
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([CONFIG_SEED], programId);
}

export function findInvoicePda(
  issuer: PublicKey,
  invoiceId: bigint | number,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64LE(BigInt(invoiceId));
  return PublicKey.findProgramAddressSync(
    [INVOICE_SEED, issuer.toBuffer(), idBuf],
    programId
  );
}

export function findEscrowPda(
  invoice: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [ESCROW_SEED, invoice.toBuffer()],
    programId
  );
}
