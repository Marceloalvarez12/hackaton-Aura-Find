"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = ["Listed", "Funded", "Repaid"];

const PHASES = [
  { step: 0, title: "Verified by the oracle", detail: "On-chain compliance ✓", dot: "bg-teal-400" },
  { step: 1, title: "Funded", detail: "25,000 USDC → Logística Andina", dot: "bg-violet-400" },
  { step: 2, title: "Repaid", detail: "+1,250 USDC to the investor", dot: "bg-emerald-400" },
];

const STATUS_STYLE = [
  "border-sky-500/30 bg-sky-500/10 text-sky-300",
  "border-violet-500/30 bg-violet-500/10 text-violet-300",
  "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
];

/** Factura "viva" del hero: se inclina en 3D con el mouse y recorre el ciclo de estados. */
export function HeroCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPhase((p) => (p + 1) % PHASES.length), 2800);
    return () => clearInterval(id);
  }, []);

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setRot({ x: -py * 12, y: px * 14 });
  };

  const { step, title, detail, dot } = PHASES[phase];

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setRot({ x: 0, y: 0 })}
      className="relative [perspective:1200px]"
    >
      <div
        className="relative transition-transform duration-300 ease-out [transform-style:preserve-3d]"
        style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}
      >
        <div className="animate-float">
          <div className="glass glow-border relative overflow-hidden rounded-3xl bg-[#0b1120]/60 p-6 shadow-2xl shadow-emerald-500/10">
            <div className="shine-sweep pointer-events-none absolute inset-0" />
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">🇦🇷 Invoice #1 · RWA</p>
                <p className="mt-1 font-semibold">Logística Andina S.A.</p>
                <p className="text-xs text-slate-500">→ Mercado Libre S.R.L.</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="rounded-lg bg-gradient-to-r from-emerald-400 to-emerald-500 px-2.5 py-1 text-xs font-bold text-slate-950">
                  AAA
                </span>
                <span
                  key={step}
                  className={`animate-pop rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${STATUS_STYLE[step]}`}
                >
                  {STEPS[step].toLowerCase()}
                </span>
              </div>
            </div>

            <div className="mb-5 rounded-2xl border border-white/5 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Amount</p>
              <p className="text-shimmer text-4xl font-bold">
                25,000 <span className="text-lg text-slate-400 [-webkit-text-fill-color:currentColor]">USDC</span>
              </p>
              <div className="mt-3 flex justify-between text-xs text-slate-400">
                <span>Yield 5.00%</span>
                <span>APR 40.6%</span>
                <span className="text-emerald-300">+1,250 USDC</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-2.5 right-2.5 top-2.5 h-px bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-violet-400 transition-all duration-700 ease-out"
                  style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
                />
              </div>
              <div className="relative flex justify-between">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex flex-col items-center">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition-all duration-500 ${
                        i === step
                          ? "animate-pulse-ring scale-110 bg-emerald-500 text-slate-950"
                          : i < step
                            ? "bg-emerald-500/80 text-slate-950"
                            : "border border-white/15 bg-[#0b1120] text-slate-600"
                      }`}
                    >
                      {i <= step ? "✓" : i + 1}
                    </div>
                    <span className={`mt-1.5 text-[10px] uppercase tracking-wide ${i <= step ? "text-emerald-400" : "text-slate-600"}`}>
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="glass absolute -bottom-7 -left-8 rounded-2xl bg-[#0b1120]/80 px-4 py-3 text-xs shadow-xl"
          style={{ transform: "translateZ(60px)" }}
        >
          <p className="text-slate-500">Escrow PDA</p>
          <p className="font-mono text-emerald-300">7xK2…9fQa</p>
        </div>

        <div
          className="glass absolute -top-11 right-14 rounded-2xl bg-[#0b1120]/80 px-4 py-3 text-xs shadow-xl"
          style={{ transform: "translateZ(80px)" }}
        >
          <p className="text-slate-500">Confirmation</p>
          <p className="font-semibold text-white">~400 ms</p>
        </div>

        <div
          key={phase}
          className="animate-toast glass absolute -bottom-[4.5rem] left-28 flex w-72 items-center gap-3 rounded-2xl bg-[#0b1120]/85 px-4 py-3 shadow-2xl"
          style={{ transform: "translateZ(100px)" }}
        >
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot} animate-pulse-ring`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="truncate text-xs text-slate-400">{detail}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
