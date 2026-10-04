"use client";

import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import type { FactoringClient, TimelineEvent } from "@aura-fint/sdk";

const EVENT_META: Record<string, { label: string; color: string; describe: (d: any) => string }> = {
  InvoiceCreated: {
    label: "Factura emitida",
    color: "bg-sky-400",
    describe: (d) => `RWA creado por ${usdc(d.amount)} USDC · hash del documento anclado`,
  },
  InvoiceVerified: {
    label: "Verificada por el oráculo",
    color: "bg-teal-400",
    describe: (d) => `Atestación firmada por ${short(d.verifier)}`,
  },
  InvoiceFunded: {
    label: "Fondeada",
    color: "bg-violet-400",
    describe: (d) => `${usdc(d.fundedAmount)} USDC al emisor · 1 RWA a ${short(d.investor)}`,
  },
  InvoiceRepaid: {
    label: "Repagada",
    color: "bg-emerald-400",
    describe: (d) => `${usdc(d.repaidAmount)} USDC depositados en el vault del escrow`,
  },
  RepaymentWithdrawn: {
    label: "Repago retirado",
    color: "bg-emerald-300",
    describe: (d) => `${usdc(d.amount)} USDC al inversor · vault cerrado, rent recuperado`,
  },
  InvoiceCancelled: {
    label: "Cancelada",
    color: "bg-slate-400",
    describe: () => "El emisor retiró la factura antes del fondeo",
  },
  InvoiceDefaulted: {
    label: "Default declarado",
    color: "bg-rose-400",
    describe: (d) => `Principal en riesgo: ${usdc(d.principal)} USDC · el RWA respalda el reclamo`,
  },
};

function usdc(v: unknown) {
  return (Number(String(v ?? 0)) / 1e6).toLocaleString("en-US");
}
function short(v: unknown) {
  const s = v instanceof PublicKey ? v.toBase58() : String(v ?? "");
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

const TX_URL = (sig: string) =>
  `https://explorer.solana.com/tx/${sig}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`;

export function Timeline({
  invoice,
  client,
  refreshKey,
}: {
  invoice: PublicKey;
  client: FactoringClient;
  refreshKey?: unknown;
}) {
  const [events, setEvents] = useState<TimelineEvent[]>();

  useEffect(() => {
    let alive = true;
    client
      .fetchInvoiceTimeline(invoice)
      .then((e) => alive && setEvents(e))
      .catch(() => alive && setEvents([]));
    return () => {
      alive = false;
    };
  }, [client, invoice, refreshKey]);

  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Auditoría on-chain
          </p>
          <h3 className="mt-1 text-xl font-semibold">Historia de la factura</h3>
          <p className="mt-1 text-sm text-slate-400">
            Reconstruida leyendo los eventos del programa directo de la cadena. Sin base de datos.
          </p>
        </div>
        {events && (
          <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-xs text-slate-400">
            {events.length} eventos
          </span>
        )}
      </div>

      {!events && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton h-3 w-3 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-3 w-64 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {events && events.length === 0 && (
        <p className="text-sm text-slate-500">No se encontraron eventos para esta cuenta.</p>
      )}

      {events && events.length > 0 && (
        <ol className="relative ml-1.5 border-l border-white/10">
          {events.map((ev, i) => {
            const meta = EVENT_META[ev.name] ?? {
              label: ev.name,
              color: "bg-slate-400",
              describe: () => "",
            };
            const isLast = i === events.length - 1;
            return (
              <li
                key={`${ev.signature}-${ev.name}`}
                className="animate-fade-in-up relative pb-6 pl-6 last:pb-0"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <span
                  className={`absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full ring-4 ring-[#0b1120] ${meta.color} ${
                    isLast ? "animate-pulse-ring" : ""
                  }`}
                />
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="font-semibold">{meta.label}</p>
                  <p className="text-xs text-slate-500">
                    {ev.blockTime
                      ? new Date(ev.blockTime * 1000).toLocaleString("es-AR")
                      : `slot ${ev.slot}`}
                  </p>
                </div>
                <p className="mt-0.5 text-sm text-slate-400">{meta.describe(ev.data)}</p>
                <a
                  href={TX_URL(ev.signature)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 transition hover:text-emerald-300"
                >
                  {ev.signature.slice(0, 10)}…{ev.signature.slice(-6)} · slot {ev.slot} ↗
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
