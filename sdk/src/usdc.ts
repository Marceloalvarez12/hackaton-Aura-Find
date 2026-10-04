import { Connection, Keypair, PublicKey, Signer } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { USDC_DECIMALS } from "./constants";

/**
 * Crea un mint "USDC" de prueba (6 decimales, Token program clásico)
 * para localnet o para controlar saldos en demos sin depender del
 * faucet de Circle. mintAuthority = payer.
 */
export async function createMockUsdc(
  connection: Connection,
  payer: Signer,
  mintKeypair: Keypair = Keypair.generate()
): Promise<PublicKey> {
  return createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    USDC_DECIMALS,
    mintKeypair,
    undefined,
    TOKEN_PROGRAM_ID
  );
}

/**
 * Mintea USDC de prueba a la ATA de `owner` (la crea si no existe).
 * `amountUi` es en unidades enteras de USDC (ej: 1000 -> 1000 USDC).
 */
export async function mintUsdcTo(
  connection: Connection,
  payer: Signer,
  usdcMint: PublicKey,
  owner: PublicKey,
  amountUi: number
): Promise<PublicKey> {
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    usdcMint,
    owner
  );
  await mintTo(
    connection,
    payer,
    usdcMint,
    ata.address,
    payer,
    BigInt(amountUi) * 10n ** BigInt(USDC_DECIMALS)
  );
  return ata.address;
}
