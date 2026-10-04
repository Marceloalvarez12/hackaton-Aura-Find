"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import {
  InvoiceAccount,
  invoiceStatusLabel,
  InvoiceStatus,
} from "@aura-fint/sdk";
import { useFactoringClient } from "@/lib/use-factoring";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { InvoiceCard } from "@/components/InvoiceCard";
import { SeedPanel } from "@/components/SeedPanel";

type Listed = { publicKey: PublicKey; account: InvoiceAccount };
type Filter = "all" | InvoiceStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: InvoiceStatus.Listed, label: "Listed" },
  { key: InvoiceStatus.Funded, label: "Funded" },
  { key: InvoiceStatus.Repaid, label: "Repaid" },
];

function SkeletonCard() {
  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-4 flex justify-between">
        <div className="space-y-2">
          <div className="skeleton h-5 w-28 rounded" />
          <div className="skeleton h-3 w-44 rounded" />
        </div>
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
      <div className="skeleton mb-5 h-24 rounded-2xl" />
      <div className="skeleton h-10 rounded-xl" />
    </div>
  );
}

export default function Marketplace() {
  const { client, connected } = useFactoringClient();
  const [invoices, setInvoices] = useState<Listed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [filter, setFilter] = useState<Filter>("all");

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setInvoices(await client.fetchAllInvoices());
      setError(undefined);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message.slice(0, 120)
          : "Couldn't load invoices"
      );
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    const total = invoices.reduce(
      (acc, { account }) => acc + Number(account.amount.toString()) / 1e6,
      0
    );
    const verified = invoices.filter((i) => i.account.isVerified).length;
    const fundable = invoices.filter(
      (i) =>
        invoiceStatusLabel(i.account.status) === InvoiceStatus.Listed &&
        i.account.isVerified
    ).length;
    return { total, verified, fundable };
  }, [invoices]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? invoices
        : invoices.filter((i) => invoiceStatusLabel(i.account.status) === filter),
    [invoices, filter]
  );

  return (
    <>
      <Nav />
      <main className="relative mx-auto min-h-screen max-w-6xl px-6 pb-20">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-emerald-500/8 blur-3xl" />

        <section className="relative pb-8 pt-12">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
            Marketplace
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Invoices ready to fund
          </h1>
          <p className="mt-3 max-w-xl text-slate-400">
            Every invoice is verified by the protocol before it&apos;s listed. Pick the
            yield, sign, and receive the RWA as collateral in the same transaction.
          </p>
        </section>

        <section className="relative mb-8 grid grid-cols-3 gap-4">
          {[
            { k: stats.fundable, v: "fundable", accent: true },
            { k: `${stats.verified}/${invoices.length}`, v: "verified" },
            { k: stats.total.toLocaleString("en-US"), v: "USDC listed" },
          ].map((s) => (
            <div key={s.v} className="glass rounded-2xl p-5">
              <p
                className={`text-3xl font-bold tracking-tight ${
                  s.accent ? "text-emerald-300" : "text-white"
                }`}
              >
                {loading ? <span className="skeleton inline-block h-8 w-16 rounded" /> : s.k}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                {s.v}
              </p>
            </div>
          ))}
        </section>

        {connected && process.env.NEXT_PUBLIC_DEMO_TOOLS !== "0" && (
          <div className="mb-8">
            <SeedPanel client={client} onDone={() => refresh(true)} />
          </div>
        )}

        <section className="relative">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                    filter === f.key
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => refresh()}
              disabled={loading}
              className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white disabled:opacity-50"
            >
              <svg
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-300">
              <p className="font-semibold">Couldn&apos;t reach the program</p>
              <p className="mt-1 text-rose-300/70">{error}</p>
            </div>
          )}

          {loading && (
            <div className="grid gap-5 md:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {!loading && !error && visible.length === 0 && (
            <div className="glass rounded-3xl p-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                <svg
                  className="h-7 w-7 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="font-medium text-slate-300">
                {filter === "all"
                  ? "No invoices on-chain yet"
                  : `No ${filter} invoices`}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {filter === "all"
                  ? "Use the demo panel to issue the first one."
                  : "Try another filter."}
              </p>
            </div>
          )}

          {!loading && visible.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              {visible.map(({ publicKey, account }, i) => (
                <div
                  key={publicKey.toBase58()}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <InvoiceCard
                    invoicePubkey={publicKey}
                    invoice={account}
                    client={client}
                    connected={connected}
                    onFunded={() => refresh(true)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
