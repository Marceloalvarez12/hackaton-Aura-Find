#!/usr/bin/env bash
# Deploy del programa a devnet con el mismo program ID que localnet.
# Requisito: ~3 SOL de devnet en el deployer
#   (faucet.solana.com -> 4isZ1mVhHX2f7RDqcG7oYyZctQ9rdSatTzTrDB5udYr3)
# Uso (desde Windows):
#   MSYS_NO_PATHCONV=1 wsl -d Ubuntu -u root bash "/mnt/d/MARCELO ALVAREZ/Downloads/Hackaton-Colosseum/factoring-latam/scripts/devnet-deploy.sh"
set -euo pipefail

export PATH="/root/.local/share/solana/install/active_release/bin:$PATH"
ROOT="/mnt/d/MARCELO ALVAREZ/Downloads/Hackaton-Colosseum/factoring-latam"
DEPLOYER="$ROOT/deploy-keys/deployer.json"
PROGRAM="$ROOT/deploy-keys/program.json"
SO="$ROOT/target/deploy/factoring.so"

ADDR=$(solana-keygen pubkey "$DEPLOYER")
BAL=$(solana balance "$ADDR" --url devnet | awk '{print $1}')
echo "deployer $ADDR: $BAL SOL"
if (( $(echo "$BAL < 2.5" | bc -l) )); then
  echo "Aviso: $BAL SOL puede quedar corto (~2.5 SOL estimado). Si falla por fondos, el deploy retoma desde el buffer ya escrito — cargá SOL y re-corré este script."
fi

solana program deploy "$SO" \
  --program-id "$PROGRAM" \
  --keypair "$DEPLOYER" \
  --url devnet

echo "Listo: https://explorer.solana.com/address/$(solana-keygen pubkey "$PROGRAM")?cluster=devnet"
