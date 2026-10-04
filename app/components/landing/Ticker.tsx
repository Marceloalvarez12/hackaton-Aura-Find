import { DEMO_INVOICES, assessRisk, impliedApr } from "@aura-fint/sdk";

const FLAG: Record<string, string> = { AR: "🇦🇷", CL: "🇨🇱", CO: "🇨🇴", UY: "🇺🇾", MX: "🇲🇽", BR: "🇧🇷" };

/** Cinta infinita con las facturas del marketplace demo. */
export function Ticker() {
  const items = DEMO_INVOICES.map((m) => ({ ...m, grade: assessRisk(m).grade, apr: impliedApr(m.yieldBps, m.termDays) }));

  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-white/[0.015] py-4 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
      <div className="marquee gap-4">
        {[...items, ...items].map((m, i) => (
          <div
            key={i}
            className="flex shrink-0 items-center gap-3 rounded-full border border-white/5 bg-[#0b1120]/80 px-4 py-2 text-sm"
          >
            <span>{FLAG[m.country] ?? "🌎"}</span>
            <span className="font-medium text-slate-200">{m.issuerName}</span>
            <span className="text-slate-600">→</span>
            <span className="text-slate-400">{m.debtorName}</span>
            <span className="font-semibold text-emerald-300">{m.amountUi.toLocaleString("en-US")} USDC</span>
            <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-bold text-emerald-300">{m.grade}</span>
            <span className="text-xs text-slate-500">APR {m.apr.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
