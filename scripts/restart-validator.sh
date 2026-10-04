#!/usr/bin/env bash
# Reinicia el validator local desde cero y redeploya el programa.
SOL=/root/.local/share/solana/install/active_release/bin
ROOT="/mnt/d/MARCELO ALVAREZ/Downloads/Hackaton-Colosseum/factoring-latam"

pkill -f "solana-test-validator" 2>/dev/null
sleep 2
cd /root
setsid "$SOL/solana-test-validator" --reset --quiet > /tmp/validator.log 2>&1 < /dev/null &

for i in $(seq 1 30); do
  "$SOL/solana" cluster-version --url http://localhost:8899 >/dev/null 2>&1 && break
  sleep 1
done
echo "validator up"

bash "$ROOT/scripts/localnet-deploy.sh" 2>&1 | grep -E "Program Id|Error" | grep -v "default signer"
