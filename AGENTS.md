# AGENTS.md — Aura Fint

## Entorno
- Windows + Git Bash. La toolchain de Solana (solana CLI 4.3, cargo-build-sbf) vive en **WSL Ubuntu** como root.
- Llamar a WSL siempre con `MSYS_NO_PATHCONV=1 wsl -d Ubuntu -u root bash "<ruta /mnt/d/...>"`; quoting anidado con `bash -c` rompe por los espacios en la ruta.
- `pkill -f` dentro de `bash -c` se mata a sí mismo: usar los scripts de `scripts/`.
- Las keypairs están en `deploy-keys/` (gitignored). Deployer = admin = verifier del localnet.

## Comandos
- Typecheck Rust: `cargo check -p factoring`
- Build SBF: `MSYS_NO_PATHCONV=1 wsl -d Ubuntu -u root bash ".../scripts/build-sbf.sh"`
- Validator limpio + deploy: `.../scripts/restart-validator.sh` (WSL)
- Upgrade sin resetear: `.../scripts/localnet-deploy.sh` (WSL)
- Regenerar IDL después de cambiar el programa: `pnpm idl`
- Seed del demo: `pnpm seed` (escribe `app/.env.local`)
- Tests E2E: `pnpm test:e2e` (necesita el validator arriba; ensucia el marketplace → después correr restart-validator + seed)
- Typecheck SDK: `cd sdk && npx tsc -p tsconfig.json --noEmit`
- Build frontend: `pnpm --filter app build` (no correrlo con `next dev` abierto sobre el mismo `.next`)
- Dev: `cd app && pnpm dev`

## Convenciones
- Los códigos de error nuevos van al final de `FactoringError` (para que los códigos 6000+ sigan estables) y se espejan en `scripts/gen-idl.mjs`.
- El frontend solo consume `@aura-fint/sdk`; nunca arma transacciones a mano.
