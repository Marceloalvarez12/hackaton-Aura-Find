#!/usr/bin/env bash
# Reintenta el airdrop de devnet hasta juntar ~5 SOL para el deploy.
export PATH="/root/.local/share/solana/install/active_release/bin:$PATH"
ADDR="4isZ1mVhHX2f7RDqcG7oYyZctQ9rdSatTzTrDB5udYr3"

for i in $(seq 1 60); do
  BAL=$(solana balance "$ADDR" --url devnet 2>/dev/null | awk '{print $1}' || echo 0)
  echo "[$(date +%H:%M:%S)] balance=${BAL}"
  if (( $(echo "$BAL >= 5" | bc -l) )); then
    echo "Listo: $BAL SOL"; exit 0
  fi
  solana airdrop 2 "$ADDR" --url devnet 2>&1 | tail -1
  sleep 120
done
echo "Timeout sin fondos"
