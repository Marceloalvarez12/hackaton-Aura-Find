import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/landing/Reveal";
import { CountUp } from "@/components/landing/CountUp";
import { Spotlight } from "@/components/landing/Spotlight";
import { HeroCard } from "@/components/landing/HeroCard";
import { FlowDiagram } from "@/components/landing/FlowDiagram";
import { Ticker } from "@/components/landing/Ticker";

const STEPS = [
  {
    n: "01",
    title: "Issue the RWA",
    desc: "The SME tokenizes its receivable. The SHA-256 hash of the tax document goes on-chain; public metadata stays off-chain.",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    n: "02",
    title: "Fund through escrow",
    desc: "The investor sends USDC through the escrow. The program mints the Token-2022 RWA straight to their wallet as collateral.",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    n: "03",
    title: "Repay + withdraw",
    desc: "The company repays principal + yield into the vault. The investor withdraws: pull pattern, rent reclaimed, vault closed.",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

const STATS = [
  { to: 45, suffix: " days", v: "typical collection wait we remove" },
  { to: 40.6, suffix: "%", decimals: 1, v: "implied APR of the demo invoice" },
  { to: 400, prefix: "~", suffix: " ms", v: "for the SME to receive USDC" },
  { to: 19, suffix: " tests", v: "security tests on the program" },
];

const TRUST = [
  {
    title: "On-chain compliance",
    desc: "An authorized verifier attests every invoice before it opens. Without verification, funding is impossible by design.",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    title: "Trustless custody",
    desc: "USDC lives in vaults controlled by program PDAs. Nobody, not even us, can move funds outside the rules.",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
  {
    title: "Debtor privacy",
    desc: "Only the hash of the tax document touches the chain. Sensitive data stays off-chain and remains verifiable by integrity.",
    icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  },
];

const ROADMAP = [
  { when: "Today", title: "Core protocol", items: ["8 Anchor instructions", "19 E2E security tests", "Off-chain integrity proof"], done: true },
  { when: "Q1 2027", title: "Native compliance", items: ["KYC via Token-2022 Transfer Hook", "Verifier wired to AFIP / SAT / DIAN", "Mainnet beta"] },
  { when: "Q2 2027", title: "Capital at scale", items: ["Fractional invoice pools", "Senior / junior tranches", "Institutional wallets"] },
  { when: "Q3 2027", title: "Secondary market", items: ["RWA order book", "Live risk-based pricing", "On-chain debtor ratings"] },
];

function Icon({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function SectionTitle({ eyebrow, title, color = "text-emerald-400" }: { eyebrow: string; title: string; color?: string }) {
  return (
    <Reveal className="mb-12 text-center">
      <p className={`mb-3 text-sm font-semibold uppercase tracking-[0.3em] ${color}`}>{eyebrow}</p>
      <h2 className="text-3xl font-bold tracking-tight md:text-5xl">{title}</h2>
    </Reveal>
  );
}

export default function Home() {
  return (
    <>
      <Nav />
      <main className="relative overflow-hidden">
        {/* ------------------------------------------------------------ hero */}
        <section className="relative">
          <div className="bg-grid pointer-events-none absolute inset-0" />
          <div className="animate-orb pointer-events-none absolute -left-40 top-10 h-[28rem] w-[28rem] rounded-full bg-emerald-500/12 blur-3xl" />
          <div
            className="animate-orb pointer-events-none absolute -right-40 top-40 h-[28rem] w-[28rem] rounded-full bg-violet-500/12 blur-3xl"
            style={{ animationDelay: "-9s" }}
          />
          <Spotlight />

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:pt-28">
            <div>
              <p className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Real World Assets · Solana · LatAm
              </p>
              <h1
                className="animate-fade-in-up mb-6 text-5xl font-bold leading-[1.04] tracking-tight md:text-6xl lg:text-7xl"
                style={{ animationDelay: "0.1s" }}
              >
                Instant liquidity for <span className="text-shimmer">unpaid invoices</span>
              </h1>
              <p
                className="animate-fade-in-up mb-10 max-w-xl text-lg leading-relaxed text-slate-400"
                style={{ animationDelay: "0.2s" }}
              >
                An SME issues an RWA that represents its invoice. An investor funds it with USDC
                through an escrow and receives the RWA as collateral. No banks, no 90-day wait.
              </p>
              <div className="animate-fade-in-up flex flex-wrap gap-3" style={{ animationDelay: "0.3s" }}>
                <Link
                  href="/marketplace"
                  className="btn-shine animate-pulse-ring rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-7 py-3.5 font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:from-emerald-400 hover:to-emerald-300"
                >
                  Explore the marketplace →
                </Link>
                <a
                  href="#how"
                  className="group rounded-xl border border-white/10 bg-white/[0.03] px-7 py-3.5 font-semibold text-slate-200 backdrop-blur transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
                >
                  How it works <span className="inline-block transition group-hover:translate-y-0.5">↓</span>
                </a>
              </div>
              <div
                className="animate-fade-in-up mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500"
                style={{ animationDelay: "0.4s" }}
              >
                <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> On-chain escrow</span>
                <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Token-2022 RWA</span>
                <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Compliance verification</span>
              </div>
            </div>

            <div className="animate-fade-in-up relative hidden lg:block" style={{ animationDelay: "0.35s" }}>
              <HeroCard />
            </div>
          </div>
        </section>

        <Reveal>
          <Ticker />
        </Reveal>

        {/* ----------------------------------------------------------- stats */}
        <section className="relative mx-auto max-w-6xl px-6 py-24">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.v} delay={i * 90}>
                <div className="glass glass-hover h-full rounded-2xl p-6">
                  <p className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                    <CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} />
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{s.v}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------- cómo funciona */}
        <section id="how" className="relative mx-auto max-w-6xl px-6 pb-28">
          <SectionTitle eyebrow="How it works" title="Three steps. One transaction each." />
          <Reveal delay={100} className="mb-8">
            <FlowDiagram />
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 130}>
                <div className="glass glass-hover group relative h-full overflow-hidden rounded-3xl p-7">
                  <div className="pointer-events-none absolute -bottom-8 -right-3 font-mono text-[7rem] font-bold leading-none text-white/[0.03] transition group-hover:text-emerald-400/[0.07]">
                    {s.n}
                  </div>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/25 to-violet-500/25 text-emerald-300 transition duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <Icon d={s.icon} />
                  </div>
                  <h3 className="text-xl font-semibold">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* -------------------------------------------------------- seguridad */}
        <section className="relative mx-auto max-w-6xl px-6 pb-28">
          <Reveal>
            <div className="glass glow-border overflow-hidden rounded-3xl">
              <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
                <div className="relative border-b border-white/5 p-10 lg:border-b-0 lg:border-r">
                  <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
                  <p className="relative mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">
                    Built to be audited
                  </p>
                  <h2 className="relative text-3xl font-bold tracking-tight">Security a fund can read in the code</h2>
                  <p className="relative mt-4 text-sm leading-relaxed text-slate-400">
                    Checked u128 math, PDAs as the only vault authorities, a strict state machine and
                    account closing to prevent double spending.
                  </p>
                  <div className="relative mt-6 flex flex-wrap gap-2">
                    {["has_one", "checked_mul", "PDA signer", "close_account"].map((t) => (
                      <span key={t} className="rounded-md border border-white/10 bg-black/30 px-2 py-1 font-mono text-[11px] text-slate-400">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid gap-px bg-white/5 sm:grid-cols-3 lg:grid-cols-1">
                  {TRUST.map((t, i) => (
                    <Reveal key={t.title} delay={150 + i * 120}>
                      <div className="group flex h-full gap-4 bg-[#070b14] p-7 transition hover:bg-[#0b1120]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 transition group-hover:scale-110">
                          <Icon d={t.icon} />
                        </div>
                        <div>
                          <h3 className="mb-1.5 font-semibold text-emerald-300">{t.title}</h3>
                          <p className="text-sm leading-relaxed text-slate-400">{t.desc}</p>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* -------------------------------------------------- por qué tokenizar */}
        <section className="relative mx-auto max-w-6xl px-6 pb-28">
          <div className="grid gap-5 md:grid-cols-3">
            <Reveal className="md:col-span-1">
              <div className="glass h-full rounded-3xl p-7">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">Why tokenize?</p>
                <h2 className="text-2xl font-bold tracking-tight">Credit becomes liquid</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  The RWA is a transferable token. If the investor needs their capital before
                  maturity, they sell the token and the claim travels with it. A traditional
                  factoring contract can&apos;t do that.
                </p>
              </div>
            </Reveal>
            <div className="glass grid gap-px overflow-hidden rounded-3xl bg-white/5 sm:grid-cols-3 md:col-span-2">
              {[
                { node: <CountUp to={1.4} decimals={1} prefix="US$ " suffix="T" />, v: "global factoring market" },
                { node: <><CountUp to={60} />–<CountUp to={120} /> days</>, v: "typical collection time for a LatAm SME" },
                { node: <><CountUp to={24} />–<CountUp to={40} />%</>, v: "annual cost of informal discounting" },
              ].map((s, i) => (
                <Reveal key={s.v} delay={i * 110} className="h-full">
                  <div className="flex h-full flex-col justify-center bg-[#070b14] p-7">
                    <p className="text-3xl font-bold tracking-tight text-white">{s.node}</p>
                    <p className="mt-2 text-sm text-slate-500">{s.v}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
          <p className="mt-3 text-right text-[11px] text-slate-600">Industry reference figures, illustrative for the pitch.</p>
        </section>

        {/* ---------------------------------------------------------- roadmap */}
        <section className="relative mx-auto max-w-6xl px-6 pb-28">
          <SectionTitle eyebrow="Roadmap" title="From hackathon to infrastructure" color="text-violet-400" />
          <div className="relative grid gap-5 md:grid-cols-4">
            <div className="pointer-events-none absolute left-0 right-0 top-[22px] hidden h-px bg-gradient-to-r from-emerald-500/60 via-violet-500/40 to-transparent md:block" />
            {ROADMAP.map((m, i) => (
              <Reveal key={m.title} delay={i * 140}>
                <div className="relative">
                  <div
                    className={`relative z-10 mb-5 flex h-11 w-11 items-center justify-center rounded-full border-2 text-xs font-bold ${
                      m.done ? "animate-pulse-ring border-emerald-400 bg-emerald-500 text-slate-950" : "border-white/15 bg-[#070b14] text-slate-500"
                    }`}
                  >
                    {m.done ? "✓" : i}
                  </div>
                  <div className="glass glass-hover rounded-3xl p-6">
                    <p className={`text-xs font-semibold uppercase tracking-wider ${m.done ? "text-emerald-400" : "text-slate-500"}`}>{m.when}</p>
                    <h3 className="mt-1 text-lg font-semibold">{m.title}</h3>
                    <ul className="mt-3 space-y-1.5 text-sm text-slate-400">
                      {m.items.map((it) => (
                        <li key={it} className="flex gap-2">
                          <span className={m.done ? "text-emerald-400" : "text-slate-600"}>›</span>
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* -------------------------------------------------------------- CTA */}
        <section className="relative mx-auto max-w-6xl px-6 pb-28">
          <Reveal>
            <div className="glow-border relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/15 via-[#0b1120] to-violet-500/15 px-8 py-16 text-center">
              <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
              <div className="animate-orb pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl" />
              <h2 className="relative text-3xl font-bold tracking-tight md:text-5xl">
                Fund your first invoice <span className="text-shimmer">in seconds</span>
              </h2>
              <p className="relative mx-auto mt-4 max-w-xl text-slate-400">
                Verified invoices from suppliers to large Latin American companies, with annualized
                yield and tokenized collateral.
              </p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/marketplace"
                  className="btn-shine rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-8 py-3.5 font-semibold text-slate-950 transition hover:-translate-y-0.5"
                >
                  Go to marketplace →
                </Link>
                <Link
                  href="/portfolio"
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-8 py-3.5 font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:border-white/20"
                >
                  View my portfolio
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
