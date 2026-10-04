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
- Deploy devnet: `scripts/devnet-deploy.sh` (WSL; si falta SOL el deploy retoma desde el buffer)
- Seed en devnet: `RPC_URL=https://api.devnet.solana.com pnpm seed` — mismo mint/PDAs que localnet (keypairs deterministas)

## Entorno actual
- **Devnet es el entorno canónico para el público**: programa `716BXEQFnUrsyJkXtYXMa2YkEbYYPban2tj9WsLdfZzn` deployado y se seedearon las 6 facturas. `app/.env.local` apunta a devnet.
- USDC de devnet: mint mock `EAm8az1fRMrtRE75nKmph9pWP3Gs8oTf4FdURhi95DG3` (authority = deployer; NO es el USDC real de Circle `4zMMC...`).
- El Phantom del usuario tiene USDC pero 0 SOL en devnet (el transfer se salteó por falta de fondos del issuer) → para firmar tx necesita ~0.02 SOL del faucet.
- Vercel: Root Dir `app`, vars en `app/.env.example`.

## Convenciones
- Los códigos de error nuevos van al final de `FactoringError` (para que los códigos 6000+ sigan estables) y se espejan en `scripts/gen-idl.mjs`.
- El frontend solo consume `@aura-fint/sdk`; nunca arma transacciones a mano.
