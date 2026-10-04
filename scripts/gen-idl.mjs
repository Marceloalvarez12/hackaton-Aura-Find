// Genera el IDL a mano desde el layout del programa (hasta que `anchor build`
// produzca el oficial en target/idl/factoring.json). Los discriminators se
// computan igual que Anchor: sha256("<prefix>:<name>")[0..8].
// Uso: node scripts/gen-idl.mjs
import { createHash } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const disc = (prefix, name) => [
  ...createHash("sha256").update(`${prefix}:${name}`).digest().subarray(0, 8),
];
const ixDisc = (n) => disc("global", n);
const accDisc = (n) => disc("account", n);
const evDisc = (n) => disc("event", n);
const seedConst = (s) => ({ kind: "const", value: [...Buffer.from(s)] });

const SYSTEM_PROGRAM = "11111111111111111111111111111111";
const ATA_PROGRAM = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";

const idl = {
  address: "716BXEQFnUrsyJkXtYXMa2YkEbYYPban2tj9WsLdfZzn",
  metadata: {
    name: "factoring",
    version: "0.1.0",
    spec: "0.1.0",
    description: "B2B tokenized invoice factoring for LatAm",
  },
  instructions: [
    {
      name: "initialize",
      discriminator: ixDisc("initialize"),
      accounts: [
        { name: "admin", writable: true, signer: true },
        {
          name: "config",
          writable: true,
          pda: { seeds: [seedConst("config")] },
        },
        { name: "verifier" },
        { name: "treasury_usdc_ata" },
        { name: "system_program", address: SYSTEM_PROGRAM },
      ],
      args: [{ name: "fee_bps", type: "u16" }],
    },
    {
      name: "create_invoice",
      discriminator: ixDisc("create_invoice"),
      accounts: [
        { name: "issuer", writable: true, signer: true },
        {
          name: "invoice",
          writable: true,
          pda: {
            seeds: [
              seedConst("invoice"),
              { kind: "account", path: "issuer" },
              { kind: "arg", path: "invoice_id" },
            ],
          },
        },
        { name: "rwa_mint" },
        { name: "system_program", address: SYSTEM_PROGRAM },
      ],
      args: [
        { name: "invoice_id", type: "u64" },
        { name: "amount", type: "u64" },
        { name: "due_date", type: "i64" },
        { name: "document_hash", type: { array: ["u8", 32] } },
        { name: "metadata_uri", type: "string" },
      ],
    },
    {
      name: "verify_invoice",
      discriminator: ixDisc("verify_invoice"),
      accounts: [
        { name: "verifier", signer: true },
        {
          name: "config",
          pda: { seeds: [seedConst("config")] },
        },
        {
          name: "invoice",
          writable: true,
          pda: {
            seeds: [
              seedConst("invoice"),
              { kind: "account", path: "invoice.issuer", optional: true },
            ],
          },
        },
      ],
      args: [],
    },
    {
      name: "fund_invoice",
      discriminator: ixDisc("fund_invoice"),
      accounts: [
        { name: "investor", writable: true, signer: true },
        {
          name: "invoice",
          writable: true,
          pda: {
            seeds: [
              seedConst("invoice"),
              { kind: "account", path: "invoice.issuer", optional: true },
            ],
          },
        },
        { name: "issuer" },
        {
          name: "escrow",
          writable: true,
          pda: {
            seeds: [seedConst("escrow"), { kind: "account", path: "invoice" }],
          },
        },
        { name: "usdc_token_program" },
        { name: "rwa_token_program" },
        { name: "associated_token_program", address: ATA_PROGRAM },
        { name: "system_program", address: SYSTEM_PROGRAM },
        { name: "usdc_mint" },
        { name: "rwa_mint", writable: true },
        { name: "investor_usdc_ata", writable: true },
        { name: "issuer_usdc_ata", writable: true },
        { name: "escrow_usdc_vault", writable: true },
        { name: "investor_rwa_ata", writable: true },
      ],
      args: [{ name: "yield_bps", type: "u16" }],
    },
    {
      name: "repay_invoice",
      discriminator: ixDisc("repay_invoice"),
      accounts: [
        { name: "invoice", writable: true },
        { name: "issuer", signer: true },
        { name: "escrow" },
        { name: "usdc_token_program" },
        { name: "usdc_mint" },
        { name: "issuer_usdc_ata", writable: true },
        { name: "escrow_usdc_vault", writable: true },
      ],
      args: [],
    },
    {
      name: "withdraw_repayment",
      discriminator: ixDisc("withdraw_repayment"),
      accounts: [
        { name: "investor", writable: true, signer: true },
        { name: "invoice" },
        { name: "escrow" },
        { name: "usdc_token_program" },
        { name: "associated_token_program", address: ATA_PROGRAM },
        { name: "system_program", address: SYSTEM_PROGRAM },
        { name: "usdc_mint" },
        { name: "investor_usdc_ata", writable: true },
        { name: "escrow_usdc_vault", writable: true },
      ],
      args: [],
    },
    {
      name: "cancel_invoice",
      discriminator: ixDisc("cancel_invoice"),
      accounts: [
        { name: "invoice", writable: true },
        { name: "issuer", signer: true },
      ],
      args: [],
    },
    {
      name: "mark_defaulted",
      discriminator: ixDisc("mark_defaulted"),
      accounts: [
        { name: "invoice", writable: true },
        { name: "escrow" },
        { name: "investor", signer: true },
      ],
      args: [],
    },
  ],
  accounts: [
    { name: "Config", discriminator: accDisc("Config") },
    { name: "Escrow", discriminator: accDisc("Escrow") },
    { name: "Invoice", discriminator: accDisc("Invoice") },
  ],
  types: [
    {
      name: "Config",
      type: {
        kind: "struct",
        fields: [
          { name: "admin", type: "pubkey" },
          { name: "verifier", type: "pubkey" },
          { name: "fee_bps", type: "u16" },
          { name: "treasury_usdc_ata", type: "pubkey" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "Escrow",
      type: {
        kind: "struct",
        fields: [
          { name: "invoice", type: "pubkey" },
          { name: "investor", type: "pubkey" },
          { name: "principal", type: "u64" },
          { name: "yield_bps", type: "u16" },
          { name: "funded_at", type: "i64" },
          { name: "repayment_deadline", type: "i64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "Invoice",
      type: {
        kind: "struct",
        fields: [
          { name: "issuer", type: "pubkey" },
          { name: "invoice_id", type: "u64" },
          { name: "mint", type: "pubkey" },
          { name: "amount", type: "u64" },
          { name: "document_hash", type: { array: ["u8", 32] } },
          { name: "metadata_uri", type: "string" },
          { name: "due_date", type: "i64" },
          { name: "status", type: { defined: { name: "InvoiceStatus" } } },
          { name: "investor", type: { option: "pubkey" } },
          { name: "is_verified", type: "bool" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "InvoiceStatus",
      type: {
        kind: "enum",
        variants: [
          { name: "Listed" },
          { name: "Funded" },
          { name: "Repaid" },
          { name: "Defaulted" },
          { name: "Cancelled" },
        ],
      },
    },
    { name: "InvoiceCreated", type: { kind: "struct", fields: [
      { name: "invoice", type: "pubkey" },
      { name: "issuer", type: "pubkey" },
      { name: "amount", type: "u64" },
      { name: "document_hash", type: { array: ["u8", 32] } },
    ]}},
    { name: "InvoiceFunded", type: { kind: "struct", fields: [
      { name: "invoice", type: "pubkey" },
      { name: "investor", type: "pubkey" },
      { name: "funded_amount", type: "u64" },
    ]}},
    { name: "InvoiceRepaid", type: { kind: "struct", fields: [
      { name: "invoice", type: "pubkey" },
      { name: "issuer", type: "pubkey" },
      { name: "repaid_amount", type: "u64" },
    ]}},
    { name: "RepaymentWithdrawn", type: { kind: "struct", fields: [
      { name: "invoice", type: "pubkey" },
      { name: "investor", type: "pubkey" },
      { name: "amount", type: "u64" },
    ]}},
    { name: "InvoiceVerified", type: { kind: "struct", fields: [
      { name: "invoice", type: "pubkey" },
      { name: "verifier", type: "pubkey" },
    ]}},
    { name: "InvoiceCancelled", type: { kind: "struct", fields: [
      { name: "invoice", type: "pubkey" },
      { name: "issuer", type: "pubkey" },
    ]}},
    { name: "InvoiceDefaulted", type: { kind: "struct", fields: [
      { name: "invoice", type: "pubkey" },
      { name: "investor", type: "pubkey" },
      { name: "principal", type: "u64" },
    ]}},
  ],
  events: [
    { name: "InvoiceCreated", discriminator: evDisc("InvoiceCreated") },
    { name: "InvoiceFunded", discriminator: evDisc("InvoiceFunded") },
    { name: "InvoiceRepaid", discriminator: evDisc("InvoiceRepaid") },
    { name: "RepaymentWithdrawn", discriminator: evDisc("RepaymentWithdrawn") },
    { name: "InvoiceVerified", discriminator: evDisc("InvoiceVerified") },
    { name: "InvoiceCancelled", discriminator: evDisc("InvoiceCancelled") },
    { name: "InvoiceDefaulted", discriminator: evDisc("InvoiceDefaulted") },
  ],
  errors: [
    { code: 6000, name: "MetadataUriTooLong", msg: "La URI de metadata excede el límite permitido." },
    { code: 6001, name: "InvoiceNotFundable", msg: "La factura no está en estado Listed para poder fondearse." },
    { code: 6002, name: "Unauthorized", msg: "No autorizado para realizar esta acción." },
    { code: 6003, name: "InvalidDueDate", msg: "La fecha de vencimiento debe ser mayor al tiempo actual." },
    { code: 6004, name: "InvalidYield", msg: "El yield debe estar entre 1 y 10_000 bps." },
    { code: 6005, name: "InvalidRwaMint", msg: "El mint del RWA debe tener 0 decimales y supply 0." },
    { code: 6006, name: "InvalidMintAuthority", msg: "La mint authority del RWA debe ser el escrow PDA." },
    { code: 6007, name: "InvoiceNotFunded", msg: "La factura no está en estado Funded para ser repagada." },
    { code: 6008, name: "InvoiceNotRepaid", msg: "La factura no está en estado Repaid para retirar fondos." },
    { code: 6009, name: "MathOverflow", msg: "Overflow en el cálculo del repago." },
    { code: 6010, name: "InvalidStatusTransition", msg: "Transición de estado inválida para esta factura." },
    { code: 6011, name: "InvoiceNotVerified", msg: "La factura no ha sido verificada por el oráculo de cumplimiento del protocolo." },
    { code: 6012, name: "InvalidFee", msg: "El fee de la plataforma no puede exceder 10_000 bps." },
    { code: 6013, name: "MaturityNotReached", msg: "Todavía no venció el plazo de repago más el período de gracia." },
  ],
};

const outDir = join(root, "sdk", "src", "idl");
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "factoring.json"),
  JSON.stringify(idl, null, 2) + "\n"
);
console.log("IDL escrito en sdk/src/idl/factoring.json");
