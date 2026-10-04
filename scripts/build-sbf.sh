#!/usr/bin/env bash
set -euo pipefail

export PATH="/root/.cargo/bin:/root/.local/share/solana/install/active_release/bin:$PATH"
ROOT="/mnt/d/MARCELO ALVAREZ/Downloads/Hackaton-Colosseum/factoring-latam"

cd "$ROOT"
cargo build-sbf --manifest-path programs/factoring/Cargo.toml 2>&1 | tail -25
