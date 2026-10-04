import type { DemoInvoiceMeta } from "./demo";

export type RiskGrade = "AAA" | "AA" | "A" | "BBB" | "BB";

export interface RiskAssessment {
  grade: RiskGrade;
  /** 0-100, mayor = más seguro */
  score: number;
  factors: string[];
}

/**
 * Heurística de riesgo para el demo. En producción esto lo alimenta el
 * verifier con datos de buró de crédito, historial de pago del deudor
 * y validación fiscal (AFIP/SAT/DIAN).
 */
export function assessRisk(meta: DemoInvoiceMeta): RiskAssessment {
  const factors: string[] = [];
  let score = 100;

  const tierPenalty = { 1: 0, 2: 18, 3: 40 }[meta.debtorTier];
  score -= tierPenalty;
  factors.push(
    meta.debtorTier === 1
      ? "Deudor corporativo grado inversión"
      : meta.debtorTier === 2
        ? "Deudor gran empresa regional"
        : "Deudor PyME"
  );

  if (meta.termDays > 75) {
    score -= 12;
    factors.push(`Plazo largo (${meta.termDays}d)`);
  } else if (meta.termDays > 45) {
    score -= 5;
    factors.push(`Plazo medio (${meta.termDays}d)`);
  } else {
    factors.push(`Plazo corto (${meta.termDays}d)`);
  }

  if (meta.amountUi > 50_000) {
    score -= 4;
    factors.push("Ticket alto");
  }

  const grade: RiskGrade =
    score >= 92 ? "AAA" : score >= 84 ? "AA" : score >= 72 ? "A" : score >= 60 ? "BBB" : "BB";

  return { grade, score, factors };
}

/** APR anualizado implícito a partir del yield del plazo. */
export function impliedApr(yieldBps: number, termDays: number): number {
  if (termDays <= 0) return 0;
  return (yieldBps / 100) * (365 / termDays);
}
