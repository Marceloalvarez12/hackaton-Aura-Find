import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row">
        <Logo size="sm" />
        <p>Built on Solana · Colosseum Hackathon 2026</p>
        <div className="flex gap-4">
          <span className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-1 font-mono text-xs">
            Anchor 0.31
          </span>
          <span className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-1 font-mono text-xs">
            Token-2022
          </span>
        </div>
      </div>
    </footer>
  );
}
