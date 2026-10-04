import { clusterApiUrl } from "@solana/web3.js";

// Todo se deriva de NEXT_PUBLIC_RPC_URL: localnet en la máquina, devnet en Vercel.
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? clusterApiUrl("devnet");

const isLocal = /localhost|127\.0\.0\.1/.test(RPC_URL);
const isMainnet = /mainnet/.test(RPC_URL);

export const CLUSTER_LABEL = isLocal ? "Localnet" : isMainnet ? "Mainnet" : "Devnet";

const query = isLocal
  ? `?cluster=custom&customUrl=${encodeURIComponent(RPC_URL)}`
  : isMainnet
    ? ""
    : "?cluster=devnet";

export const explorerAddress = (addr: string) => `https://explorer.solana.com/address/${addr}${query}`;
export const explorerTx = (sig: string) => `https://explorer.solana.com/tx/${sig}${query}`;
