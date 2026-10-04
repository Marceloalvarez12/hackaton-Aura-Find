"use client";

import { useState } from "react";
import type { RiskAssessment, RiskGrade } from "@aura-fint/sdk";

const GRADE_STYLE: Record<RiskGrade, string> = {
  AAA: "from-emerald-400 to-emerald-500 text-slate-950",
  AA: "from-emerald-500 to-teal-500 text-slate-950",
  A: "from-sky-400 to-sky-500 text-slate-950",
  BBB: "from-amber-400 to-amber-500 text-slate-950",
  BB: "from-orange-400 to-rose-500 text-slate-950",
};

export function RiskBadge({ risk }: { risk: RiskAssessment }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        className={`inline-flex cursor-help items-center gap-1.5 rounded-lg bg-gradient-to-r px-2.5 py-1 text-xs font-bold tracking-wide ${GRADE_STYLE[risk.grade]}`}
      >
        {risk.grade}
        <span className="text-[10px] font-semibold opacity-70">{risk.score}</span>
      </span>
      {open && (
        <div className="glass absolute right-0 top-full z-10 mt-2 w-60 rounded-xl p-3 text-xs shadow-2xl">
          <p className="mb-2 font-semibold text-slate-200">Evaluación de riesgo</p>
          <ul className="space-y-1 text-slate-400">
            {risk.factors.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-emerald-400">•</span>
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-2 border-t border-white/5 pt-2 text-[10px] text-slate-600">
            Heurístico demo. En producción: buró + historial + validación fiscal.
          </p>
        </div>
      )}
    </div>
  );
}
