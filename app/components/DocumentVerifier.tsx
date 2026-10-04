"use client";

import { useCallback, useState } from "react";
import { hashDocument, canonicalDocument, getDemoMeta } from "@aura-fint/sdk";

type Result = { match: boolean; computed: string; fileName: string };

const toHex = (b: Uint8Array | number[]) =>
  Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");

export function DocumentVerifier({
  onChainHash,
  invoiceId,
}: {
  onChainHash: number[];
  invoiceId: number;
}) {
  const [result, setResult] = useState<Result>();
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const expected = toHex(onChainHash);

  const verify = useCallback(
    async (data: Uint8Array | string, fileName: string) => {
      setBusy(true);
      const computed = toHex(await hashDocument(data));
      setResult({ match: computed === expected, computed, fileName });
      setBusy(false);
    },
    [expected]
  );

  const onFile = async (file: File) =>
    verify(new Uint8Array(await file.arrayBuffer()), file.name);

  const useCanonical = () =>
    verify(canonicalDocument(getDemoMeta(invoiceId)), "original-document.json");

  const useTampered = () => {
    const meta = getDemoMeta(invoiceId);
    const doc = canonicalDocument({ ...meta, amountUi: meta.amountUi + 1 });
    verify(doc, "tampered-document.json");
  };

  const downloadCanonical = () => {
    const blob = new Blob([canonicalDocument(getDemoMeta(invoiceId))], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `aura-fint-invoice-${invoiceId}.json`;
    a.click();
  };

  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
            Integrity proof
          </p>
          <h3 className="mt-1 text-xl font-semibold">Verify the tax document</h3>
          <p className="mt-1 text-sm text-slate-400">
            The PDF never touches the chain, only its SHA-256 hash. Anyone can check
            that the document wasn&apos;t altered, without seeing its contents.
          </p>
        </div>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
          dragging
            ? "border-emerald-400 bg-emerald-500/10"
            : "border-white/10 bg-black/20 hover:border-white/20"
        }`}
      >
        <input
          type="file"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <svg className="mb-3 h-8 w-8 text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm text-slate-300">
          {busy ? "Computing SHA-256…" : "Drop the invoice PDF / JSON here, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-slate-600">Processed 100% in your browser</p>
      </label>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <button onClick={useCanonical} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-slate-300 transition hover:border-emerald-500/40">
          Try the original document
        </button>
        <button onClick={useTampered} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-slate-300 transition hover:border-rose-500/40">
          Try a tampered one (+1 USDC)
        </button>
        <button onClick={downloadCanonical} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-slate-300 transition hover:border-white/20">
          ↓ Download document
        </button>
      </div>

      {result && (
        <div
          className={`animate-fade-in-up mt-5 rounded-2xl border p-4 ${
            result.match
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-rose-500/30 bg-rose-500/10"
          }`}
        >
          <div className="mb-3 flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                result.match ? "bg-emerald-500 text-slate-950" : "bg-rose-500 text-white"
              }`}
            >
              {result.match ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <p className={`font-semibold ${result.match ? "text-emerald-300" : "text-rose-300"}`}>
                {result.match ? "Document intact" : "Document tampered"}
              </p>
              <p className="text-xs text-slate-400">
                {result.match
                  ? "The hash matches the on-chain record exactly"
                  : "The hash does NOT match: the content differs from the original"}
              </p>
            </div>
          </div>
          <div className="space-y-2 font-mono text-[11px]">
            <div>
              <p className="text-slate-500">On-chain (document_hash)</p>
              <p className="break-all text-slate-300">{expected}</p>
            </div>
            <div>
              <p className="text-slate-500">Computed · {result.fileName}</p>
              <p className={`break-all ${result.match ? "text-emerald-300" : "text-rose-300"}`}>
                {result.computed}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
