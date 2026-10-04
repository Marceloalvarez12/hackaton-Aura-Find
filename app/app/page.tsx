import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

const STEPS = [
  {
    n: "01",
    title: "Emití el RWA",
    desc: "La PyME tokeniza su factura por cobrar. Hash SHA-256 del documento fiscal on-chain, metadata pública off-chain.",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    n: "02",
    title: "Fondeo vía escrow",
    desc: "El inversor envía USDC al escrow. El programa mintea el RWA (Token-2022) como garantía directo a su wallet.",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    n: "03",
    title: "Repago + retiro",
    desc: "La empresa repaga principal + yield al vault. El inversor retira — pull pattern, rent recuperado, vault cerrado.",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

const STATS = [
  { k: "45 días", v: "plazo típico de cobro" },
  { k: "5% APR", v: "yield del demo en vivo" },
  { k: "~400ms", v: "liquidez instantánea" },
  { k: "100%", v: "verificación on-chain" },
];

const TRUST = [
  {
    title: "Compliance on-chain",
    desc: "Un verifier autorizado atestigua cada factura antes de habilitarla. Sin verificación, el fondeo es imposible por diseño.",
  },
  {
    title: "Custodia sin confianza",
    desc: "Los USDC viven en vaults controlados por PDAs del programa. Nadie — ni nosotros — puede mover fondos fuera de las reglas.",
  },
  {
    title: "Privacidad del deudor",
    desc: "Solo el hash del documento fiscal toca la cadena. Los datos sensibles quedan cifrados off-chain, verificables por integridad.",
  },
];

export default function Home() {
  return (
    <>
      <Nav />
      <main className="relative overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="animate-orb pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div
          className="animate-orb pointer-events-none absolute -right-40 top-60 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl"
          style={{ animationDelay: "-9s" }}
        />

        <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:pt-28">
          <div>
            <p className="animate-fade-in-up mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Real World Assets · Solana · LatAm
            </p>
            <h1
              className="animate-fade-in-up mb-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl"
              style={{ animationDelay: "0.1s" }}
            >
              Liquidez inmediata para{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-violet-400 bg-clip-text text-transparent">
                facturas por cobrar
              </span>
            </h1>
            <p
              className="animate-fade-in-up mb-10 max-w-xl text-lg leading-relaxed text-slate-400"
              style={{ animationDelay: "0.2s" }}
            >
              Una PyME emite un RWA que representa su factura. Un inversor la
              financia con USDC vía escrow y recibe el RWA como garantía.
              Sin bancos, sin esperar 90 días.
            </p>
            <div
              className="animate-fade-in-up flex flex-wrap gap-3"
              style={{ animationDelay: "0.3s" }}
            >
              <Link
                href="/marketplace"
                className="animate-pulse-ring rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-7 py-3.5 font-semibold text-slate-950 transition hover:from-emerald-400 hover:to-emerald-300"
              >
                Explorar el marketplace →
              </Link>
              <a
                href="#how"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-7 py-3.5 font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                Cómo funciona
              </a>
            </div>
          </div>

          <div
            className="animate-fade-in-up relative hidden lg:block"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="animate-float glass rounded-3xl p-6 shadow-2xl shadow-emerald-500/10">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Factura #1 · RWA
                  </p>
                  <p className="mt-1 font-semibold">Logística Andina S.A.</p>
                  <p className="text-xs text-slate-500">→ Mercado Libre S.R.L.</p>
                </div>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                  ✓ Verificada
                </span>
              </div>
              <div className="mb-5 rounded-2xl border border-white/5 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Monto
                </p>
                <p className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-4xl font-bold text-transparent">
                  25,000{" "}
                  <span className="text-lg text-slate-400">USDC</span>
                </p>
                <div className="mt-3 flex justify-between text-xs text-slate-400">
                  <span>Yield 5.00%</span>
                  <span>45 días</span>
                  <span className="text-emerald-300">+1,250 USDC</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {["Listed", "Funded", "Repaid"].map((s, i) => (
                  <div key={s} className="flex flex-1 items-center gap-2">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
                        i === 0
                          ? "animate-pulse-ring bg-emerald-500 text-slate-950"
                          : "border border-white/10 text-slate-600"
                      }`}
                    >
                      {i === 0 ? "✓" : i + 1}
                    </div>
                    {i < 2 && <div className="h-px flex-1 bg-white/10" />}
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 glass rounded-2xl px-4 py-3 text-xs">
              <p className="text-slate-500">Escrow PDA</p>
              <p className="font-mono text-emerald-300">7xK2…9fQa</p>
            </div>
            <div className="absolute -right-4 -top-4 glass rounded-2xl px-4 py-3 text-xs">
              <p className="text-slate-500">Confirmación</p>
              <p className="font-semibold text-white">~400 ms</p>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl px-6 pb-24">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {STATS.map((s, i) => (
              <div
                key={s.k}
                className="animate-fade-in-up glass glass-hover rounded-2xl p-5"
                style={{ animationDelay: `${0.5 + i * 0.08}s` }}
              >
                <p className="text-3xl font-bold tracking-tight text-white">
                  {s.k}
                </p>
                <p className="mt-1 text-xs text-slate-500">{s.v}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="relative mx-auto max-w-6xl px-6 pb-24">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
              Cómo funciona
            </p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Tres pasos. Una transacción cada uno.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="animate-fade-in-up glass glass-hover group relative rounded-3xl p-7"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-violet-500/20 text-emerald-300">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                    </svg>
                  </div>
                  <span className="font-mono text-sm text-slate-600">{s.n}</span>
                </div>
                <h3 className="text-xl font-semibold">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl px-6 pb-28">
          <div className="glass overflow-hidden rounded-3xl">
            <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
              <div className="border-b border-white/5 p-10 lg:border-b-0 lg:border-r">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">
                  Diseñado para auditarse
                </p>
                <h2 className="text-3xl font-bold tracking-tight">
                  Seguridad que un fondo puede leer en el código
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                  Aritmética segura en u128, PDAs como únicas autoridades de
                  los vaults, máquina de estados estricta y cierre de cuentas
                  para evitar doble gasto.
                </p>
              </div>
              <div className="grid gap-px bg-white/5 sm:grid-cols-3 lg:grid-cols-1">
                {TRUST.map((t) => (
                  <div key={t.title} className="bg-[#070b14] p-7">
                    <h3 className="mb-2 font-semibold text-emerald-300">
                      {t.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-400">
                      {t.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="glass rounded-3xl p-7 md:col-span-1">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
                ¿Por qué tokenizar?
              </p>
              <h2 className="text-2xl font-bold tracking-tight">El crédito se vuelve líquido</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                El RWA es un token transferible. Si el inversor necesita su capital antes del
                vencimiento, vende el token y el derecho de cobro viaja con él. Un contrato de
                factoring tradicional no puede hacer eso.
              </p>
            </div>
            <div className="glass grid gap-px overflow-hidden rounded-3xl bg-white/5 sm:grid-cols-3 md:col-span-2">
              {[
                { k: "US$ 1.4T", v: "mercado global de factoring" },
                { k: "60–120 días", v: "plazo de cobro típico de una PyME en LatAm" },
                { k: "24–40%", v: "costo anual del descuento bancario informal" },
              ].map((s) => (
                <div key={s.v} className="flex flex-col justify-center bg-[#070b14] p-7">
                  <p className="text-3xl font-bold tracking-tight text-white">{s.k}</p>
                  <p className="mt-2 text-sm text-slate-500">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-right text-[11px] text-slate-600">
            Cifras de referencia de la industria; ilustrativas para el pitch.
          </p>
        </section>

        <section className="relative mx-auto max-w-6xl px-6 pb-28">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">
              Roadmap
            </p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">De hackathon a infraestructura</h2>
          </div>
          <div className="relative grid gap-5 md:grid-cols-4">
            <div className="pointer-events-none absolute left-0 right-0 top-[22px] hidden h-px bg-gradient-to-r from-emerald-500/60 via-violet-500/40 to-transparent md:block" />
            {[
              {
                when: "Hoy",
                title: "Protocolo core",
                items: ["8 instrucciones Anchor", "19 tests E2E de seguridad", "Prueba de integridad off-chain"],
                done: true,
              },
              {
                when: "Q1 2027",
                title: "Compliance nativo",
                items: ["Transfer Hook (Token-2022) con KYC", "Verifier conectado a AFIP / SAT / DIAN", "Mainnet beta"],
              },
              {
                when: "Q2 2027",
                title: "Escala de capital",
                items: ["Pools fraccionados por factura", "Tramos senior / junior", "Integración con wallets institucionales"],
              },
              {
                when: "Q3 2027",
                title: "Mercado secundario",
                items: ["Order book de RWAs", "Pricing por riesgo en vivo", "Rating on-chain de deudores"],
              },
            ].map((m) => (
              <div key={m.title} className="relative">
                <div
                  className={`relative z-10 mb-5 flex h-11 w-11 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    m.done
                      ? "animate-pulse-ring border-emerald-400 bg-emerald-500 text-slate-950"
                      : "border-white/15 bg-[#070b14] text-slate-500"
                  }`}
                >
                  {m.done ? "✓" : "•"}
                </div>
                <div className="glass glass-hover rounded-3xl p-6">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${m.done ? "text-emerald-400" : "text-slate-500"}`}>
                    {m.when}
                  </p>
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
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
