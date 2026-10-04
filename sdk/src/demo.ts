import { CreateInvoiceParams } from "./types";
import { hashDocument } from "./client";

export type DebtorTier = 1 | 2 | 3;

export interface DemoInvoiceMeta {
  invoiceId: number;
  issuerName: string;
  debtorName: string;
  /** 1 = corporativo grado inversión, 2 = gran empresa regional, 3 = PyME */
  debtorTier: DebtorTier;
  amountUi: number;
  yieldBps: number;
  termDays: number;
  /** Fecha de emisión fija — forma parte del documento canónico. */
  issueDate: string;
  country: string;
  sector: string;
}

/**
 * Fixtures del pitch. Cada fila es una PyME latinoamericana real-ish
 * facturándole a un deudor corporativo reconocible.
 */
export const DEMO_INVOICES: DemoInvoiceMeta[] = [
  {
    invoiceId: 1,
    issuerName: "Logística Andina S.A.",
    debtorName: "Mercado Libre S.R.L.",
    debtorTier: 1,
    amountUi: 25_000,
    yieldBps: 500,
    termDays: 45,
    issueDate: "2026-09-15",
    country: "AR",
    sector: "Logistics",
  },
  {
    invoiceId: 2,
    issuerName: "Textil del Norte S.A.",
    debtorName: "Falabella Retail S.A.",
    debtorTier: 1,
    amountUi: 18_500,
    yieldBps: 650,
    termDays: 60,
    issueDate: "2026-09-20",
    country: "CL",
    sector: "Textiles",
  },
  {
    invoiceId: 3,
    issuerName: "AgroInsumos Pampa S.R.L.",
    debtorName: "Arcor S.A.I.C.",
    debtorTier: 1,
    amountUi: 42_000,
    yieldBps: 450,
    termDays: 30,
    issueDate: "2026-09-25",
    country: "AR",
    sector: "Agribusiness",
  },
  {
    invoiceId: 4,
    issuerName: "Metalúrgica Rosario S.A.",
    debtorName: "YPF S.A.",
    debtorTier: 1,
    amountUi: 67_000,
    yieldBps: 550,
    termDays: 60,
    issueDate: "2026-09-10",
    country: "AR",
    sector: "Manufacturing",
  },
  {
    invoiceId: 5,
    issuerName: "Café Serrano Ltda.",
    debtorName: "Grupo Éxito S.A.",
    debtorTier: 2,
    amountUi: 12_800,
    yieldBps: 800,
    termDays: 90,
    issueDate: "2026-08-30",
    country: "CO",
    sector: "Food & Beverage",
  },
  {
    invoiceId: 6,
    issuerName: "Servicios TI Montevideo S.A.S.",
    debtorName: "Globant S.A.",
    debtorTier: 2,
    amountUi: 31_000,
    yieldBps: 700,
    termDays: 75,
    issueDate: "2026-09-28",
    country: "UY",
    sector: "Software",
  },
];

export const DEMO_INVOICE = DEMO_INVOICES[0];

export function getDemoMeta(
  invoiceId: number | bigint | { toString(): string }
): DemoInvoiceMeta {
  const id = Number(invoiceId.toString());
  return (
    DEMO_INVOICES.find((m) => m.invoiceId === id) ?? {
      invoiceId: id,
      issuerName: `Issuer #${id}`,
      debtorName: "Unregistered debtor",
      debtorTier: 3,
      amountUi: 0,
      yieldBps: 0,
      termDays: 0,
      issueDate: "",
      country: "—",
      sector: "—",
    }
  );
}

/**
 * Documento fiscal canónico: JSON con claves ordenadas y sin whitespace.
 * Es exactamente lo que se hashea y se escribe on-chain como document_hash.
 * Determinista: cualquier parte puede regenerarlo y verificar integridad.
 */
export function canonicalDocument(meta: DemoInvoiceMeta): string {
  const doc = {
    amountUsdc: meta.amountUi,
    currency: "USDC",
    debtor: meta.debtorName,
    invoiceId: meta.invoiceId,
    issueDate: meta.issueDate,
    issuer: meta.issuerName,
    jurisdiction: meta.country,
    termDays: meta.termDays,
    type: "FACTURA_B2B",
  };
  return JSON.stringify(doc, Object.keys(doc).sort());
}

export async function demoInvoiceParams(
  meta: DemoInvoiceMeta = DEMO_INVOICE
): Promise<CreateInvoiceParams> {
  const dueDate = Math.floor(Date.now() / 1000) + meta.termDays * 86_400;
  return {
    invoiceId: meta.invoiceId,
    amount: BigInt(meta.amountUi) * 1_000_000n,
    dueDate,
    documentHash: await hashDocument(canonicalDocument(meta)),
    metadataUri: `https://arweave.net/aura-fint/invoice-${meta.invoiceId}.json`,
  };
}
