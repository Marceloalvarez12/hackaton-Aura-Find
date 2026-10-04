#!/usr/bin/env bash
set -euo pipefail

SOL=/root/.local/share/solana/install/active_release/bin
ROOT="/mnt/d/MARCELO ALVAREZ/Downloads/Hackaton-Colosseum/factoring-latam"

$SOL/solana --version
mkdir -p "$ROOT/deploy-keys"

$SOL/solana-keygen new -o "$ROOT/deploy-keys/deployer.json" --no-passphrase --force | tail -2
$SOL/solana-keygen new -o "$ROOT/deploy-keys/program.json" --no-passphrase --force | tail -2

echo "PROGRAM_ID=$($SOL/solana-keygen pubkey "$ROOT/deploy-keys/program.json")"
echo "DEPLOYER=$($SOL/solana-keygen pubkey "$ROOT/deploy-keys/deployer.json")"
