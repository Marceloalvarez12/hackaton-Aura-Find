"use client";

import { useState } from "react";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  demoInvoiceParams,
  FactoringClient,
  findInvoicePda,
  USDC_MINT_DEVNET,
  DEMO_INVOICE,
} from "@aura-fint/sdk";

/**
 * Panel de seed para la demo: inicializa el protocolo, emite la factura de
 * Logística Andina y la marca como verificada (asumiendo que el wallet
 * conectado es admin + verifier, configurado así en initializeTx).
 */
export function SeedPanel({
  client,
  onDone,
}: {
  client: FactoringClient;
  onDone?: () => void;
}) {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const push = (m: string) => setLog((l) => [...l, m]);

  async function run(label: string, fn: () => Promise<string>) {
    setBusy(true);
    try {
      const sig = await fn();
      push(`✓ ${label} — ${sig.slice(0, 12)}…`);
    } catch (e) {
      push(`✗ ${label} — ${e instanceof Error ? e.message.slice(0, 80) : "error"}`);
    } finally {
      setBusy(false);
    }
  }

  const initialize = () =>
    run("initialize", async () => {
      const treasury = getAssociatedTokenAddressSync(
        USDC_MINT_DEVNET,
        client.wallet,
        false
      );
      return client.send(await client.initializeTx(50, client.wallet, treasury));
    });

  const createDemo = () =>
    run("create_invoice demo", async () => {
      const res = await client.createInvoiceTx(await demoInvoiceParams(DEMO_INVOICE));
      return client.send(res);
    });

  const verifyDemo = () =>
    run("verify_invoice", async () => {
      const [invoice] = findInvoicePda(client.wallet, 1);
      return client.send(await client.verifyInvoiceTx(invoice));
    });

  return (
    <details className="glass rounded-2xl border-dashed p-5">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-300">
        <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
          Demo
        </span>
        Herramientas de issuer — {DEMO_INVOICE.issuerName} → {DEMO_INVOICE.debtorName}
      </summary>
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          ["1. Inicializar protocolo", initialize],
          ["2. Emitir factura demo", createDemo],
          ["3. Verificar (oráculo)", verifyDemo],
        ].map(([label, fn]) => (
          <button
            key={label as string}
            onClick={fn as () => void}
            disabled={busy}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-500/50 hover:bg-white/[0.06] disabled:opacity-50"
          >
            {label as string}
          </button>
        ))}
      </div>
      {log.length > 0 && (
        <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-black/30 p-3 font-mono text-xs text-slate-400">
          {log.join("\n")}
        </pre>
      )}
    </details>
  );
}
