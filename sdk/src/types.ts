import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export enum InvoiceStatus {
  Listed = "listed",
  Funded = "funded",
  Repaid = "repaid",
  Defaulted = "defaulted",
  Cancelled = "cancelled",
}

export interface InvoiceAccount {
  issuer: PublicKey;
  invoiceId: BN;
  mint: PublicKey;
  amount: BN;
  documentHash: number[];
  metadataUri: string;
  dueDate: BN;
  status: Record<InvoiceStatus, object> | Record<string, object>;
  investor: PublicKey | null;
  isVerified: boolean;
  bump: number;
}

export interface EscrowAccount {
  invoice: PublicKey;
  investor: PublicKey;
  principal: BN;
  yieldBps: number;
  fundedAt: BN;
  repaymentDeadline: BN;
  bump: number;
}

export interface CreateInvoiceParams {
  invoiceId: bigint | number;
  /** Monto en unidades base de USDC (6 decimales). */
  amount: bigint | number;
  /** Unix timestamp (segundos). */
  dueDate: number;
  /** SHA-256 del documento fiscal off-chain (32 bytes). */
  documentHash: Uint8Array;
  metadataUri: string;
}

export interface TxResult {
  tx: import("@solana/web3.js").Transaction;
  /** Keypairs extra que deben firmar además del wallet del provider. */
  signers: import("@solana/web3.js").Keypair[];
}

export interface TimelineEvent {
  /** Nombre del evento Anchor: InvoiceCreated, InvoiceFunded, ... */
  name: string;
  data: Record<string, unknown>;
  signature: string;
  slot: number;
  blockTime: number | null;
}

/** Segundos de gracia post-vencimiento antes de poder declarar default (espejo de GRACE_PERIOD_SECS). */
export const GRACE_PERIOD_SECS = 3 * 24 * 60 * 60;

export function invoiceStatusLabel(
  status: InvoiceAccount["status"]
): InvoiceStatus {
  const key = Object.keys(status)[0];
  return key as InvoiceStatus;
}
