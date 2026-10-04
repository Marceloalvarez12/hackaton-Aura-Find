"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import {
  InvoiceAccount,
  EscrowAccount,
  invoiceStatusLabel,
  InvoiceStatus,
  getDemoMeta,
  assessRisk,
  impliedApr,
  findEscrowPda,
} from "@aura-fint/sdk";
import { useFactoringClient } from "@/lib/use-factoring";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { InvoiceCard, StatusStepper } from "@/components/InvoiceCard";
import { DocumentVerifier } from "@/components/DocumentVerifier";
import { RiskBadge } from "@/components/RiskBadge";
import { Timeline } from "@/components/Timeline";

const EXPLORER = (addr: string) =>
  `https://explorer.solana.com/address/${addr}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`;

function Row({ label, value, mono = false, href }: { label: string; value: string; mono?: boolean; href?: string }) {
  const inner = (
    <span className={`${mono ? "font-mono text-xs" : "text-sm"} text-slate-200 ${href ? "hover:text-emerald-300" : ""} break-all`}>
      {value}
    </span>
  );
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 py-2.5 last:border-0">
      <span className="shrink-0 text-xs uppercase tracking-wider text-slate-500">{label}</span>
      {href ? <a href={href} target="_blank" rel="noreferrer">{inner}</a> : inner}
    </div>
  );
}

export default function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { client, connected } = useFactoringClient();
  const [invoice, setInvoice] = useState<InvoiceAccount>();
  const [escrow, setEscrow] = useState<EscrowAccount | null>(null);
  const [vault, setVault] = useState<number | null>(null);
  const [error, setError] = useState<string>();
  const [refreshKey, setRefreshKey] = useState(0);

  const pubkey = useMemo(() => {
    try { return new PublicKey(id); } catch { return undefined; }
  }, [id]);

  const load = useCallback(async () => {
    if (!pubkey) return;
    try {
      const inv = await client.fetchInvoice(pubkey);
      setInvoice(inv);
      const st = invoiceStatusLabel(inv.status);
      if (st !== InvoiceStatus.Listed && st !== InvoiceStatus.Cancelled) {
        setEscrow(await client.fetchEscrow(pubkey).catch(() => null));
        setVault(await client.fetchVaultBalance(pubkey));
      }
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se encontró la factura");
    }
  }, [client, pubkey]);

  useEffect(() => { load(); }, [load]);

  if (!pubkey) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-3xl px-6 py-20 text-center text-slate-400">Dirección inválida.</main>
      </>
    );
  }

  const meta = invoice ? getDemoMeta(invoice.invoiceId) : undefined;
  const risk = meta ? assessRisk(meta) : undefined;
  const status = invoice ? invoiceStatusLabel(invoice.status) : undefined;
  const [escrowPda] = findEscrowPda(pubkey);

  return (
    <>
      <Nav />
      <main className="relative mx-auto min-h-screen max-w-6xl px-6 pb-20">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-violet-500/8 blur-3xl" />

        <div className="relative pt-10">
          <Link href="/marketplace" className="text-sm text-slate-500 transition hover:text-white">
            ← Marketplace
          </Link>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-300">{error}</div>
        )}

        {invoice && meta && risk && status && (
          <>
            <section className="relative mt-6 flex flex-wrap items-end justify-between gap-6 pb-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
                  Factura #{meta.invoiceId} · {meta.sector} · {meta.country}
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">{meta.issuerName}</h1>
                <p className="mt-2 text-lg text-slate-400">
                  Deudor: <span className="text-white">{meta.debtorName}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <RiskBadge risk={risk} />
                <div className="w-48">
                  <StatusStepper status={status} compact />
                </div>
              </div>
            </section>

            <div className="relative grid gap-6 lg:grid-cols-[1fr_1.3fr]">
              <div className="space-y-6">
                <InvoiceCard
                  invoicePubkey={pubkey}
                  invoice={invoice}
                  client={client}
                  connected={connected}
                  onFunded={load}
                />

                <div className="glass rounded-3xl p-6">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Términos
                  </p>
                  <Row label="Emisión" value={meta.issueDate} />
                  <Row label="Plazo" value={`${meta.termDays} días`} />
                  <Row label="Yield" value={`${(meta.yieldBps / 100).toFixed(2)}% · APR ${impliedApr(meta.yieldBps, meta.termDays).toFixed(1)}%`} />
                  <Row label="Jurisdicción" value={meta.country} />
                  <Row label="Metadata" value={invoice.metadataUri} mono />
                </div>
              </div>

              <div className="space-y-6">
                <Timeline invoice={pubkey} client={client} refreshKey={refreshKey} />

                <DocumentVerifier onChainHash={invoice.documentHash} invoiceId={meta.invoiceId} />

                <div className="glass rounded-3xl p-6">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    On-chain
                  </p>
                  <Row label="Invoice PDA" value={pubkey.toBase58()} mono href={EXPLORER(pubkey.toBase58())} />
                  <Row label="RWA Mint" value={invoice.mint.toBase58()} mono href={EXPLORER(invoice.mint.toBase58())} />
                  <Row label="Issuer" value={invoice.issuer.toBase58()} mono href={EXPLORER(invoice.issuer.toBase58())} />
                  <Row label="Escrow PDA" value={escrowPda.toBase58()} mono href={EXPLORER(escrowPda.toBase58())} />
                  {invoice.investor && (
                    <Row label="Investor" value={invoice.investor.toBase58()} mono href={EXPLORER(invoice.investor.toBase58())} />
                  )}
                  {escrow && (
                    <>
                      <Row label="Principal" value={`${(Number(escrow.principal.toString()) / 1e6).toLocaleString("en-US")} USDC`} />
                      <Row label="Fondeada" value={new Date(Number(escrow.fundedAt.toString()) * 1000).toLocaleString("es-AR")} />
                    </>
                  )}
                  {vault !== null && (
                    <Row label="Vault USDC" value={`${(vault / 1e6).toLocaleString("en-US")} USDC`} />
                  )}
                  {status === InvoiceStatus.Repaid && vault === null && (
                    <Row label="Vault" value="Cerrado · rent recuperado" />
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {!invoice && !error && (
          <div className="mt-20 flex items-center justify-center gap-3 text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
            Cargando factura…
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
