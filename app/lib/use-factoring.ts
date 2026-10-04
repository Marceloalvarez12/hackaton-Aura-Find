"use client";

import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, type Wallet } from "@coral-xyz/anchor";
import { FactoringClient, USDC_MINT_DEVNET } from "@aura-fint/sdk";
import { Keypair, PublicKey } from "@solana/web3.js";

const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT
  ? new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT)
  : USDC_MINT_DEVNET;

const READ_ONLY_WALLET: Wallet = {
  publicKey: Keypair.generate().publicKey,
  payer: Keypair.generate(),
  signTransaction: async (tx) => tx,
  signAllTransactions: async (txs) => txs,
};

/**
 * Devuelve un FactoringClient listo para usar. Sin wallet conectada el
 * client funciona en modo read-only (fetchAllInvoices, etc.) y
 * `connected` = false para que la UI pida conectar antes de firmar.
 */
export function useFactoringClient() {
  const { connection } = useConnection();
  const wallet = useWallet();

  return useMemo(() => {
    const connected = !!wallet.publicKey;
    const w = connected ? (wallet as unknown as Wallet) : READ_ONLY_WALLET;
    const provider = new AnchorProvider(connection, w, {
      commitment: "confirmed",
    });
    return { client: new FactoringClient(provider, USDC_MINT), connected };
  }, [connection, wallet]);
}
