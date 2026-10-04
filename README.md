# Aura Fint

**Tokenized B2B invoice factoring for Latin America, on Solana.**

A small business tokenizes an unpaid invoice as a real-world asset (RWA). An investor funds it with USDC through a program-controlled escrow and gets the RWA as a transferable claim on the receivable. The business gets paid right away instead of waiting 60–120 days. The investor earns yield backed by a verified corporate debtor.

```
 PyME (issuer)            Verifier (oracle)          Investor                 Escrow PDA
      │ create_invoice          │                        │                        │
      │ ── RWA mint (supply 0) ─┼────────────────────────┼──── mint authority ───►│
      │                         │ verify_invoice         │                        │
      │                         │ ── compliance gate ──► │                        │
      │◄──────────── USDC (liquidity) ────────────────── │ fund_invoice           │
      │                         │                        │◄── 1 RWA (claim) ──────│
      │ repay_invoice ── principal + yield ─────────────────────────────────────► │ vault
      │                         │                        │ withdraw_repayment ◄───│ (closed, rent back)
```

## Why it matters

- **SMEs in LatAm** often wait 60–120 days to get paid and lose a large share of the invoice to informal discounting.
- **The RWA is transferable.** If the investor needs liquidity before maturity, they sell the token and the claim goes with it. A traditional factoring contract can't do that.
- **Compliance is enforced by the program.** An invoice can't be funded until the protocol's verifier signs off on it.

## On-chain program (Anchor 0.31)

Program ID: `716BXEQFnUrsyJkXtYXMa2YkEbYYPban2tj9WsLdfZzn`

### Accounts

| Account | Seeds | Purpose |
|---|---|---|
| `Config` | `["config"]` | admin, verifier, fee bps, treasury |
| `Invoice` | `["invoice", issuer, invoice_id]` | amount, due date, `document_hash`, metadata URI, status, investor |
| `Escrow` | `["escrow", invoice]` | investor, principal, yield bps, deadline; **mint authority of the RWA** and owner of the USDC vault |

### Instructions

| Instruction | Signer | Effect |
|---|---|---|
| `initialize` | admin | Creates the global `Config` |
| `create_invoice` | issuer | Registers the invoice and binds the Token-2022 RWA mint (decimals 0, supply 0, authority = escrow PDA) |
| `verify_invoice` | verifier | Compliance attestation; required before funding |
| `fund_invoice` | investor | USDC → issuer, mints exactly 1 RWA → investor, opens escrow + vault |
| `repay_invoice` | issuer | Deposits `principal × (1 + yield)` into the vault (late repayment after default is accepted) |
| `withdraw_repayment` | investor | Pulls the vault balance and **closes the vault** (rent reclaimed, double-withdraw impossible) |
| `cancel_invoice` | issuer | Withdraws an unfunded `Listed` invoice |
| `mark_defaulted` | investor | After due date + 3-day grace period; the RWA backs the off-chain claim |

### State machine

```
Listed ──verify──► Listed✓ ──fund──► Funded ──repay──► Repaid ──withdraw──► (vault closed)
  │                                     │                ▲
  └──cancel──► Cancelled                └──default──► Defaulted ──late repay──┘
```

### Security properties

- **Checked math** in `u128` for repayment, with typed `MathOverflow` errors.
- **PDAs as the only authorities.** The vault and the RWA mint are controlled by the escrow PDA, so no keypair can move funds or mint extra claims.
- **Mint validation.** `fund_invoice` rejects any RWA mint whose authority isn't the escrow PDA or whose supply isn't 0.
- **`has_one` / `address` constraints** on every privileged path (issuer, investor, verifier).
- **Pull-based payouts** plus closing the vault makes double withdrawal fail at account validation.
- **Typed events** for every state transition, so the full history of an invoice can be rebuilt from the chain alone.

## Off-chain metadata, verifiable on-chain

Only the **SHA-256 of a canonical invoice document** (JSON with sorted keys) goes on-chain as `document_hash`. Sensitive data such as the debtor, tax IDs and the PDF stays off-chain. Anyone can check that a document hasn't been altered by re-hashing it.

The app includes a **drag-and-drop integrity verifier** (`/invoice/[id]`). It hashes the file in the browser and compares it with the on-chain value. Click *"Probar con uno alterado"* to see a one-USDC change break the match.

## Test suite

19 end-to-end tests run against a local validator with the deployed program:

- **Happy path:** full lifecycle with exact balance checks (issuer liquidity, investor +yield, 1 RWA minted, vault closed), plus a timeline rebuilt from events.
- **Issuance:** past due date, metadata URI too long, duplicate `invoice_id`.
- **Compliance:** funding an unverified invoice; verification by someone other than the verifier.
- **Funding:** issuer funding their own invoice, out-of-range yield, double funding, a rogue mint authority.
- **Repayment and withdrawal:** repayment by someone other than the issuer, withdrawal before repayment, withdrawal by an attacker, double withdrawal.
- **Cancellation and default:** cancel only by the issuer and only while Listed; default only after maturity plus grace.

```bash
pnpm test:e2e
```

## Repository layout

```
programs/factoring/     Anchor program (state/, instructions/, errors.rs, events.rs)
sdk/                    TypeScript client: PDAs, transaction builders, event timeline, risk heuristics, demo fixtures
  scripts/              Localnet seed (6 LatAm invoices in mixed states)
app/                    Next.js 15 dApp: landing, marketplace, invoice detail, investor portfolio
tests/                  E2E suite (mocha + chai)
scripts/                Build / deploy helpers (WSL), IDL generator
```

The frontend never builds transactions directly. It only calls the SDK (`fundInvoiceTx`, `repayInvoiceTx`, …), so program changes stay out of the UI.

## Running locally

On Windows the Solana toolchain runs inside WSL (Ubuntu). From the repo root:

```bash
# 1. Build the program (WSL)
wsl -d Ubuntu -u root bash scripts/build-sbf.sh

# 2. Start a fresh validator and deploy (WSL)
wsl -d Ubuntu -u root bash scripts/restart-validator.sh

# 3. Seed the demo state: mock USDC, protocol config, 6 invoices
pnpm install
pnpm seed

# 4. Run the dApp, then point Phantom at Localhost (http://localhost:8899)
pnpm --filter app dev
```

On Git Bash, prefix the `wsl` commands with `MSYS_NO_PATHCONV=1`.

## Roadmap

- **Q1 2027:** Token-2022 Transfer Hook for KYC-gated RWAs; verifier connected to tax authorities (AFIP / SAT / DIAN); mainnet beta.
- **Q2 2027:** fractional invoice pools and senior/junior tranches.
- **Q3 2027:** secondary-market order book for RWAs; on-chain debtor ratings.

## Notes

- The IDL in `sdk/src/idl/factoring.json` is generated by `scripts/gen-idl.mjs`. It computes Anchor discriminators with sha256 so the client works without the Anchor CLI. Running `anchor build` produces the official IDL as a drop-in replacement.
- The risk grades in the UI come from a documented heuristic (`sdk/src/risk.ts`). In production, credit bureau data and the debtor's payment history would feed them.
- Built for the Colosseum hackathon.
