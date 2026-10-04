#!/usr/bin/env bash
set -euo pipefail

export PATH="/root/.cargo/bin:/root/.local/share/solana/install/active_release/bin:$PATH"
ROOT="/mnt/d/MARCELO ALVAREZ/Downloads/Hackaton-Colosseum/factoring-latam"
DEPLOYER="$ROOT/deploy-keys/deployer.json"
PROGRAM="$ROOT/deploy-keys/program.json"
SO="$ROOT/target/deploy/factoring.so"
URL="http://localhost:8899"

# Esperar a que el validator responda
for i in $(seq 1 30); do
  if solana cluster-version --url "$URL" >/dev/null 2>&1; then break; fi
  sleep 2
done
solana cluster-version --url "$URL"

ADDR=$(solana-keygen pubkey "$DEPLOYER")
solana airdrop 10 "$ADDR" --url "$URL"
solana balance "$ADDR" --url "$URL"

solana program deploy "$SO" \
  --program-id "$PROGRAM" \
  --keypair "$DEPLOYER" \
  --url "$URL"

solana program show "$(solana-keygen pubkey "$PROGRAM")" --url "$URL" | head -8
