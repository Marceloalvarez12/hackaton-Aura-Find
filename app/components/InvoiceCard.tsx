"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import {
  FactoringClient,
  InvoiceAccount,
  invoiceStatusLabel,
  InvoiceStatus,
  getDemoMeta,
  assessRisk,
  impliedApr,
  GRACE_PERIOD_SECS,
} from "@aura-fint/sdk";
import { RiskBadge } from "./RiskBadge";

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  [InvoiceStatus.Listed]: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  [InvoiceStatus.Funded]: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  [InvoiceStatus.Repaid]: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  [InvoiceStatus.Defaulted]: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  [InvoiceStatus.Cancelled]: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const FLAG: Record<string, string> = {
  AR: "🇦🇷", CL: "🇨🇱", CO: "🇨🇴", UY: "🇺🇾", MX: "🇲🇽", BR: "🇧🇷", PE: "🇵🇪",
};

const PIPELINE = [InvoiceStatus.Listed, InvoiceStatus.Funded, InvoiceStatus.Repaid];

export function StatusStepper({ status, compact = false }: { status: InvoiceStatus; compact?: boolean }) {
  const current = PIPELINE.indexOf(status);
  const isTerminal = status === InvoiceStatus.Defaulted || status === InvoiceStatus.Cancelled;

  return (
    <div className={`flex items-center ${compact ? "" : "mb-5"}`}>
      {PIPELINE.map((step, i) => {
        const reached = !isTerminal && i <= current;
        const isCurrent = !isTerminal && i === current;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center rounded-full border-2 font-bold transition ${
                  compact ? "h-5 w-5 text-[9px]" : "h-6 w-6 text-[10px]"
                } ${
                  isCurrent
                    ? "animate-pulse-ring border-emerald-400 bg-emerald-500/20 text-emerald-300"
                    : reached
                      ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-black/20 text-slate-600"
                }`}
              >
                {reached ? "✓" : i + 1}
              </div>
              {!compact && (
                <span
                  className={`mt-1 text-[10px] font-medium uppercase tracking-wide ${
                    reached ? "text-emerald-400" : "text-slate-600"
                  }`}
                >
                  {step}
                </span>
              )}
            </div>
            {i < PIPELINE.length - 1 && (
              <div
                className={`mx-1 h-px flex-1 ${compact ? "" : "mb-4"} ${
                  !isTerminal && i < current ? "bg-emerald-500/60" : "bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function shortKey(k: PublicKey) {
  const s = k.toBase58();
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

export function InvoiceCard({
  invoicePubkey,
  invoice,
  client,
  connected,
  onFunded,
}: {
  invoicePubkey: PublicKey;
  invoice: InvoiceAccount;
  client: FactoringClient;
  connected: boolean;
  onFunded?: (sig: string) => void;
}) {
  const meta = getDemoMeta(invoice.invoiceId);
  const risk = assessRisk(meta);
  const [yieldBps, setYieldBps] = useState(meta.yieldBps || 500);
  const [pending, setPending] = useState(false);
  const [sig, setSig] = useState<string>();
  const [error, setError] = useState<string>();

  const status = invoiceStatusLabel(invoice.status);
  const amountUi = Number(invoice.amount.toString()) / 1_000_000;
  const dueTs = Number(invoice.dueDate.toString());
  const due = new Date(dueTs * 1000);
  const daysLeft = Math.max(0, Math.ceil((dueTs * 1000 - Date.now()) / 86_400_000));
  const expectedReturn = amountUi * (yieldBps / 10_000);
  const apr = impliedApr(yieldBps, daysLeft || meta.termDays);

  const fundable = status === InvoiceStatus.Listed && invoice.isVerified;
  const awaitingVerification = status === InvoiceStatus.Listed && !invoice.isVerified;
  const isIssuer = connected && client.wallet.equals(invoice.issuer);
  const isInvestor = connected && !!invoice.investor && client.wallet.equals(invoice.investor);
  const canRepay = isIssuer && (status === InvoiceStatus.Funded || status === InvoiceStatus.Defaulted);
  const canWithdraw = isInvestor && status === InvoiceStatus.Repaid;
  const canCancel = isIssuer && status === InvoiceStatus.Listed;
  const canDefault = isInvestor && status === InvoiceStatus.Funded &&
    Date.now() / 1000 > dueTs + GRACE_PERIOD_SECS;

  async function runTx(build: () => Promise<Parameters<typeof client.send>[0]>) {
    setPending(true);
    setError(undefined);
    try {
      const signature = await client.send(await build());
      setSig(signature);
      onFunded?.(signature);
    } catch (e) {
      setError(e instanceof Error ? e.message.slice(0, 140) : "Error en la tx");
    } finally {
      setPending(false);
    }
  }

  const handleFund = () => runTx(() => client.fundInvoiceTx(invoicePubkey, yieldBps));
  const handleRepay = () => runTx(() => client.repayInvoiceTx(invoicePubkey));
  const handleWithdraw = () => runTx(() => client.withdrawRepaymentTx(invoicePubkey));
  const handleCancel = () => runTx(() => client.cancelInvoiceTx(invoicePubkey));
  const handleDefault = () => runTx(() => client.markDefaultedTx(invoicePubkey));

  return (
    <div className="glass glass-hover flex h-full flex-col rounded-3xl p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <span>{FLAG[meta.country] ?? "🌎"}</span>
            <span>#{invoice.invoiceId.toString()}</span>
            <span>·</span>
            <span>{meta.sector}</span>
          </div>
          <h3 className="mt-0.5 truncate text-lg font-semibold">{meta.issuerName}</h3>
          <p className="truncate text-sm text-slate-400">
            Deudor: <span className="text-slate-200">{meta.debtorName}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <RiskBadge risk={risk} />
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[status]}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/5 bg-white/5">
        <div className="bg-black/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Monto</p>
          <p className="mt-0.5 bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-xl font-bold text-transparent">
            {amountUi.toLocaleString("en-US")}
          </p>
          <p className="text-[10px] text-slate-500">USDC</p>
        </div>
        <div className="bg-black/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">APR impl.</p>
          <p className="mt-0.5 text-xl font-bold text-white">{apr.toFixed(1)}%</p>
          <p className="text-[10px] text-slate-500">{(yieldBps / 100).toFixed(2)}% / plazo</p>
        </div>
        <div className="bg-black/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Vence</p>
          <p className="mt-0.5 text-xl font-bold text-white">{daysLeft}d</p>
          <p className="text-[10px] text-slate-500">{due.toLocaleDateString("es-AR")}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between text-[11px]">
        {invoice.isVerified ? (
          <span className="inline-flex items-center gap-1 text-emerald-300">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verificada por el oráculo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-300">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pendiente de verificación
          </span>
        )}
        <Link
          href={`/invoice/${invoicePubkey.toBase58()}`}
          className="font-mono text-slate-500 transition hover:text-emerald-300"
        >
          {shortKey(invoicePubkey)} →
        </Link>
      </div>

      <StatusStepper status={status} />

      <div className="mt-auto">
        {fundable && connected && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400">
                Yield
                <input
                  type="number"
                  value={yieldBps}
                  onChange={(e) => setYieldBps(Number(e.target.value))}
                  className="w-20 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-right text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                />
                bps
              </label>
              <p className="text-slate-400">
                Ganás{" "}
                <span className="font-semibold text-emerald-300">
                  +{expectedReturn.toLocaleString("en-US", { maximumFractionDigits: 0 })} USDC
                </span>
              </p>
            </div>
            <button
              onClick={handleFund}
              disabled={pending}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:from-emerald-400 hover:to-emerald-300 disabled:opacity-50"
            >
              {pending ? "Firmando…" : `Fondear ${amountUi.toLocaleString("en-US")} USDC`}
            </button>
          </div>
        )}

        {fundable && !connected && (
          <p className="rounded-xl border border-dashed border-white/10 py-3 text-center text-sm text-slate-500">
            Conectá tu wallet para fondear
          </p>
        )}

        {awaitingVerification && (
          <p className="rounded-xl border border-dashed border-amber-500/20 bg-amber-500/5 py-3 text-center text-sm text-amber-300/80">
            El protocolo bloquea el fondeo hasta la verificación
          </p>
        )}

        {status === InvoiceStatus.Funded && !canRepay && !canDefault && (
          <p className="rounded-xl border border-violet-500/20 bg-violet-500/5 py-3 text-center text-sm text-violet-300/80">
            Fondeada · esperando repago del emisor
          </p>
        )}

        {status === InvoiceStatus.Repaid && !canWithdraw && (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 py-3 text-center text-sm text-emerald-300/80">
            Repagada · ciclo completado
          </p>
        )}

        {status === InvoiceStatus.Cancelled && (
          <p className="rounded-xl border border-white/10 bg-white/[0.02] py-3 text-center text-sm text-slate-400">
            Cancelada por el emisor antes del fondeo
          </p>
        )}

        {status === InvoiceStatus.Defaulted && !canRepay && (
          <p className="rounded-xl border border-rose-500/20 bg-rose-500/5 py-3 text-center text-sm text-rose-300/80">
            En default · el RWA respalda el reclamo del inversor
          </p>
        )}

        {canDefault && (
          <button
            onClick={handleDefault}
            disabled={pending}
            className="w-full rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
          >
            {pending ? "Firmando…" : "Declarar default"}
          </button>
        )}

        {canRepay && (
          <button
            onClick={handleRepay}
            disabled={pending}
            className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-violet-400 disabled:opacity-50"
          >
            {pending ? "Firmando…" : "Repagar (emisor)"}
          </button>
        )}

        {canWithdraw && (
          <button
            onClick={handleWithdraw}
            disabled={pending}
            className="w-full animate-pulse-ring rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {pending ? "Firmando…" : "Retirar repago"}
          </button>
        )}

        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={pending}
            className="mt-2 w-full rounded-xl px-4 py-2 text-sm text-slate-500 transition hover:bg-white/[0.03] hover:text-rose-300 disabled:opacity-50"
          >
            Cancelar factura (emisor)
          </button>
        )}

        {sig && (
          <a
            href={`https://explorer.solana.com/tx/${sig}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-center text-sm text-emerald-300 transition hover:bg-emerald-500/20"
          >
            ✓ Confirmada — ver en explorer
          </a>
        )}
        {error && (
          <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
