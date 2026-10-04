"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import {
  InvoiceAccount,
  invoiceStatusLabel,
  InvoiceStatus,
  getDemoMeta,
  assessRisk,
  impliedApr,
} from "@aura-fint/sdk";
import { useFactoringClient } from "@/lib/use-factoring";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { InvoiceCard } from "@/components/InvoiceCard";
import { RiskBadge } from "@/components/RiskBadge";

type Listed = { publicKey: PublicKey; account: InvoiceAccount };

export default function Portfolio() {
  const { client, connected } = useFactoringClient();
  const [all, setAll] = useState<Listed[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setAll(await client.fetchAllInvoices()); } finally { setLoading(false); }
  }, [client]);

  useEffect(() => { refresh(); }, [refresh]);

  const mine = useMemo(
    () => connected ? all.filter((i) => i.account.investor?.equals(client.wallet)) : [],
    [all, connected, client.wallet]
  );

  const stats = useMemo(() => {
    let deployed = 0, expected = 0, realized = 0, aprSum = 0;
    for (const { account } of mine) {
      const meta = getDemoMeta(account.invoiceId);
      const amt = Number(account.amount.toString()) / 1e6;
      const y = amt * (meta.yieldBps / 10_000);
      const st = invoiceStatusLabel(account.status);
      if (st === InvoiceStatus.Funded) { deployed += amt; expected += y; }
      if (st === InvoiceStatus.Repaid) { realized += y; }
      aprSum += impliedApr(meta.yieldBps, meta.termDays);
    }
    return {
      deployed, expected, realized,
      avgApr: mine.length ? aprSum / mine.length : 0,
      active: mine.filter((i) => invoiceStatusLabel(i.account.status) === InvoiceStatus.Funded).length,
    };
  }, [mine]);

  const upcoming = useMemo(
    () =>
      mine
        .filter((i) => invoiceStatusLabel(i.account.status) === InvoiceStatus.Funded)
        .sort((a, b) => Number(a.account.dueDate.toString()) - Number(b.account.dueDate.toString())),
    [mine]
  );

  return (
    <>
      <Nav />
      <main className="relative mx-auto min-h-screen max-w-6xl px-6 pb-20">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-emerald-500/8 blur-3xl" />

        <section className="relative pb-8 pt-12">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">Portfolio</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Mis posiciones</h1>
          <p className="mt-3 max-w-xl text-slate-400">
            Cada RWA en tu wallet es un derecho de cobro verificado. Acá ves el capital
            desplegado, el rendimiento esperado y los próximos vencimientos.
          </p>
        </section>

        {!connected && (
          <div className="glass rounded-3xl p-16 text-center">
            <p className="text-lg font-medium text-slate-300">Conectá tu wallet para ver tu portfolio</p>
            <p className="mt-1 text-sm text-slate-500">Las posiciones se leen directo de la cadena.</p>
          </div>
        )}

        {connected && (
          <>
            <section className="relative mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { k: `${stats.deployed.toLocaleString("en-US")}`, v: "USDC desplegados", sub: `${stats.active} activas` },
                { k: `+${stats.expected.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, v: "USDC por cobrar", accent: true },
                { k: `+${stats.realized.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, v: "USDC realizados" },
                { k: `${stats.avgApr.toFixed(1)}%`, v: "APR promedio" },
              ].map((s) => (
                <div key={s.v} className="glass rounded-2xl p-5">
                  <p className={`text-3xl font-bold tracking-tight ${s.accent ? "text-emerald-300" : "text-white"}`}>
                    {loading ? <span className="skeleton inline-block h-8 w-20 rounded" /> : s.k}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{s.v}</p>
                  {s.sub && <p className="text-xs text-slate-600">{s.sub}</p>}
                </div>
              ))}
            </section>

            {upcoming.length > 0 && (
              <section className="glass relative mb-8 rounded-3xl p-6">
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Próximos vencimientos
                </p>
                <div className="space-y-2">
                  {upcoming.map(({ publicKey, account }) => {
                    const meta = getDemoMeta(account.invoiceId);
                    const dueTs = Number(account.dueDate.toString());
                    const days = Math.max(0, Math.ceil((dueTs * 1000 - Date.now()) / 86_400_000));
                    const amt = Number(account.amount.toString()) / 1e6;
                    const pct = Math.min(100, Math.max(4, 100 - (days / meta.termDays) * 100));
                    return (
                      <Link
                        key={publicKey.toBase58()}
                        href={`/invoice/${publicKey.toBase58()}`}
                        className="flex items-center gap-4 rounded-2xl border border-white/5 bg-black/20 p-4 transition hover:border-emerald-500/30"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate font-medium">{meta.debtorName}</p>
                            <p className="shrink-0 text-sm text-slate-400">
                              <span className="font-semibold text-white">{days}d</span> · {amt.toLocaleString("en-US")} USDC
                            </p>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-violet-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <RiskBadge risk={assessRisk(meta)} />
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {!loading && mine.length === 0 && (
              <div className="glass rounded-3xl p-16 text-center">
                <p className="text-lg font-medium text-slate-300">Todavía no tenés posiciones</p>
                <p className="mt-1 text-sm text-slate-500">Fondeá una factura en el marketplace para empezar.</p>
                <Link href="/marketplace" className="mt-5 inline-block rounded-xl bg-emerald-500 px-6 py-2.5 font-semibold text-slate-950 transition hover:bg-emerald-400">
                  Ir al marketplace →
                </Link>
              </div>
            )}

            {mine.length > 0 && (
              <section className="relative">
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Mis RWAs ({mine.length})
                </p>
                <div className="grid gap-5 md:grid-cols-2">
                  {mine.map(({ publicKey, account }, i) => (
                    <div key={publicKey.toBase58()} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                      <InvoiceCard invoicePubkey={publicKey} invoice={account} client={client} connected={connected} onFunded={refresh} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
