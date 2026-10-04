"use client";

import dynamic from "next/dynamic";

export const WalletConnectButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);
