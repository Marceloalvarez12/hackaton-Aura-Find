// Graba el demo del producto con Playwright sobre la app real (localnet).
// Inyecta un provider compatible con Phantom que firma con deploy-keys/demo-ui-wallet.json,
// dibuja un cursor visible y sincroniza cada escena con la duración de su narración.
// Uso (desde la raíz): node video/record-demo.mjs
import { chromium } from "playwright";
import { execFile } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { promisify } from "node:util";
import { Keypair } from "@solana/web3.js";

const run = promisify(execFile);
const BASE = "http://localhost:3000";
const W = 1536;
const H = 864;
const PAD = 0.9; // segundos de aire después de cada narración
const OUT = "video/out";

const durations = JSON.parse(readFileSync(`${OUT}/audio/durations.json`, "utf8"));
const secret = JSON.parse(readFileSync("deploy-keys/demo-ui-wallet.json", "utf8"));
const pub58 = Keypair.fromSecretKey(Uint8Array.from(secret)).publicKey.toBase58();

const initScript = `(() => {
  const SECRET = new Uint8Array(${JSON.stringify(secret)});
  const PUB = SECRET.slice(32);
  const pk = { toBytes: () => PUB, toBuffer: () => PUB, toBase58: () => "${pub58}", toString: () => "${pub58}" };
  const ls = {};
  const emit = (e, ...a) => (ls[e] || []).forEach((f) => f(...a));
  const sign = (tx) => { tx.partialSign({ publicKey: tx.feePayer, secretKey: SECRET }); return tx; };
  const provider = {
    isPhantom: true, publicKey: null, isConnected: false,
    async connect() { this.publicKey = pk; this.isConnected = true; emit("connect", pk); return { publicKey: pk }; },
    async disconnect() { this.publicKey = null; this.isConnected = false; emit("disconnect"); },
    async signTransaction(tx) { return sign(tx); },
    async signAllTransactions(txs) { return txs.map(sign); },
    on(e, f) { (ls[e] ||= []).push(f); },
    off(e, f) { ls[e] = (ls[e] || []).filter((x) => x !== f); },
    removeListener(e, f) { this.off(e, f); },
  };
  Object.defineProperty(window, "phantom", { value: { solana: provider }, configurable: true });
  window.solana = provider;
  window.isPhantomInstalled = true;
  try { localStorage.setItem("walletName", JSON.stringify("Phantom")); } catch {}

  const mount = () => {
    if (document.getElementById("__cursor")) return;
    const style = document.createElement("style");
    style.textContent = \`
      #__cursor{position:fixed;left:0;top:0;width:26px;height:26px;z-index:2147483647;pointer-events:none;
        transform:translate(var(--x,768px),var(--y,432px));filter:drop-shadow(0 2px 6px rgba(0,0,0,.6))}
      .__ripple{position:fixed;z-index:2147483646;pointer-events:none;width:44px;height:44px;margin:-22px 0 0 -22px;
        border-radius:50%;border:2px solid rgba(110,231,183,.95);animation:__rip .55s ease-out forwards}
      @keyframes __rip{from{transform:scale(.3);opacity:1}to{transform:scale(1.4);opacity:0}}
      nextjs-portal{display:none!important}\`;
    document.documentElement.appendChild(style);
    const c = document.createElement("div");
    c.id = "__cursor";
    c.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2l15 9.5-6.6 1.3 3.9 7.4-2.9 1.5-3.9-7.5L4 19z" fill="#fff" stroke="#0b1120" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    document.documentElement.appendChild(c);
    const last = window.__lastMouse || { x: 768, y: 432 };
    c.style.setProperty("--x", last.x + "px"); c.style.setProperty("--y", last.y + "px");
    document.addEventListener("mousemove", (e) => {
      window.__lastMouse = { x: e.clientX, y: e.clientY };
      c.style.setProperty("--x", e.clientX + "px"); c.style.setProperty("--y", e.clientY + "px");
    }, true);
    document.addEventListener("mousedown", (e) => {
      const r = document.createElement("div");
      r.className = "__ripple"; r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px";
      document.documentElement.appendChild(r); setTimeout(() => r.remove(), 600);
    }, true);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();`;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: W, height: H },
  recordVideo: { dir: `${OUT}/raw`, size: { width: W, height: H } },
  colorScheme: "dark",
});
await context.addInitScript(initScript);
const page = await context.newPage();
const t0 = Date.now();
const elapsed = () => (Date.now() - t0) / 1000;
const sleep = (ms) => page.waitForTimeout(ms);

let mouse = { x: W / 2, y: H / 2 };
async function moveTo(locator, { steps = 28, dx = 0, dy = 0 } = {}) {
  const b = await locator.boundingBox();
  if (!b) throw new Error("elemento sin bounding box");
  const x = b.x + b.width / 2 + dx;
  const y = b.y + b.height / 2 + dy;
  await page.mouse.move(x, y, { steps });
  mouse = { x, y };
}
async function click(locator, opts) {
  await moveTo(locator, opts);
  await sleep(220);
  // Playwright verifica que el elemento sea clickeable y hace el click real en su centro.
  await locator.click({ delay: 90 });
}
async function scrollTo(target, ms = 1400) {
  const to =
    typeof target === "number"
      ? target
      : await target.evaluate((el) => el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.18);
  await page.evaluate(
    ({ to, ms }) =>
      new Promise((resolve) => {
        const from = window.scrollY;
        const start = performance.now();
        const step = (t) => {
          const p = Math.min(1, (t - start) / ms);
          const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          window.scrollTo(0, from + (Math.max(0, to) - from) * e);
          p < 1 ? requestAnimationFrame(step) : resolve();
        };
        requestAnimationFrame(step);
      }),
    { to, ms }
  );
  await page.mouse.move(mouse.x, mouse.y);
}

const timings = [];
async function scene(id, fn) {
  const start = elapsed();
  console.log(`> ${id} @ ${start.toFixed(2)}s`);
  await fn();
  const target = start + durations[id] + PAD;
  while (elapsed() < target) await sleep(50);
  timings.push({ id, start, end: elapsed() });
}

const card = (text) => page.locator("div.glass-hover", { hasText: text }).first();

// ---------------------------------------------------------------- escenas
await page.goto(`${BASE}/`, { waitUntil: "load" });
await page.mouse.move(mouse.x, mouse.y);
await sleep(400);

await scene("d01-landing", async () => {
  await sleep(1200);
  await moveTo(page.getByText("Logística Andina S.A.").first(), { steps: 40 });
  await sleep(1400);
  await scrollTo(560, 1800);
  await sleep(900);
  await scrollTo(0, 1300);
  await moveTo(page.getByRole("link", { name: /Explore the marketplace/ }).first(), { steps: 30 });
});

await scene("d02-marketplace", async () => {
  await click(page.getByRole("link", { name: /Explore the marketplace/ }).first());
  await page.waitForURL("**/marketplace");
  await page.getByText("AgroInsumos Pampa").first().waitFor();
  await page.locator(".wallet-adapter-button-trigger", { hasText: pub58.slice(0, 4) }).waitFor({ timeout: 15000 });
  await sleep(700);
  await moveTo(page.locator(".wallet-adapter-button-trigger"), { steps: 25 });
  await sleep(900);
  await moveTo(page.getByText("USDC listed"), { steps: 30 });
  await sleep(900);
  await scrollTo(card("Logística Andina"), 1400);
  await moveTo(card("Logística Andina").locator("span.cursor-help"), { steps: 30 });
  await sleep(2400);
  await moveTo(card("Logística Andina").getByText("Implied APR"), { steps: 25 });
});

await scene("d03-compliance", async () => {
  await scrollTo(card("Servicios TI Montevideo"), 1600);
  await sleep(400);
  await moveTo(card("Servicios TI Montevideo").getByText("Pending verification"), { steps: 30 });
  await sleep(1600);
  await moveTo(card("Servicios TI Montevideo").getByText(/blocks funding/), { steps: 25 });
});

await scene("d04-fund", async () => {
  const c = card("AgroInsumos Pampa");
  await scrollTo(c, 1500);
  await moveTo(c.getByText(/You earn/), { steps: 30 });
  await sleep(1300);
  await click(c.getByRole("button", { name: /Fund 42,000 USDC/ }));
  await c.getByText(/Confirmed/).waitFor({ timeout: 30000 });
  await sleep(500);
  await moveTo(c.getByText(/Confirmed/), { steps: 25 });
  await sleep(1200);
  await moveTo(c.getByText("Funded").first(), { steps: 25 });
});

await scene("d05-timeline", async () => {
  await click(card("AgroInsumos Pampa").locator('a[href^="/invoice/"]'));
  await page.getByText("Invoice history").waitFor();
  await page.getByText("3 events").waitFor({ timeout: 20000 });
  await sleep(600);
  for (const label of ["Invoice issued", "Verified by the oracle", "Funded"]) {
    await moveTo(page.locator("ol li", { hasText: label }).first(), { steps: 22, dx: -80 });
    await sleep(1100);
  }
});

let repayJob;
await scene("d06-verifier", async () => {
  repayJob = run("node", ["video/dist/chain.cjs", "repay", "3"]);
  await scrollTo(page.getByText("Verify the tax document"), 1500);
  await click(page.getByRole("button", { name: /original document/ }));
  await page.getByText("Document intact").waitFor();
  await sleep(3400);
  await click(page.getByRole("button", { name: /tampered one/ }));
  await page.getByText("Document tampered").waitFor();
  await sleep(900);
  await moveTo(page.getByText("Document tampered"), { steps: 25 });
});
await repayJob;

await scene("d07-repay", async () => {
  await scrollTo(0, 1100);
  await page.reload({ waitUntil: "load" });
  await page.getByText("4 events").waitFor({ timeout: 20000 });
  await sleep(500);
  await moveTo(page.locator("ol li", { hasText: "Repaid" }).first(), { steps: 30, dx: -80 });
  await sleep(1300);
  await click(page.getByRole("button", { name: /Withdraw repayment/ }));
  await page.getByText("5 events").waitFor({ timeout: 30000 });
  await sleep(500);
  await moveTo(page.locator("ol li", { hasText: "Repayment withdrawn" }).first(), { steps: 25, dx: -80 });
  await sleep(1200);
  await scrollTo(page.getByText("Closed · rent reclaimed"), 1400);
  await moveTo(page.getByText("Closed · rent reclaimed"), { steps: 25 });
});

await scene("d08-portfolio", async () => {
  await scrollTo(0, 1000);
  await click(page.locator("header").getByRole("link", { name: "Portfolio" }));
  await page.getByText(/My RWAs/).waitFor({ timeout: 20000 });
  await sleep(600);
  await moveTo(page.getByText("USDC realized", { exact: true }), { steps: 30 });
  await sleep(1100);
  await moveTo(page.getByText("Upcoming maturities", { exact: true }), { steps: 25 });
  await sleep(500);
  await moveTo(page.locator('a[href^="/invoice/"]', { hasText: "Falabella" }).first(), { steps: 25 });
});

await scene("d09-close", async () => {
  await click(page.locator("header a").first());
  await page.waitForURL(`${BASE}/`);
  await sleep(500);
  await scrollTo(page.getByText("From hackathon to infrastructure"), 2200);
  await moveTo(page.getByText("Core protocol", { exact: true }), { steps: 35 });
  await sleep(1500);
});
await sleep(600);
const end = elapsed();

const videoPath = await page.video().path();
await context.close();
mkdirSync(OUT, { recursive: true });
renameSync(videoPath, `${OUT}/raw/demo.webm`);
writeFileSync(`${OUT}/demo-timings.json`, JSON.stringify({ timings, end }, null, 2));
console.log("video:", `${OUT}/raw/demo.webm`, "duración", end.toFixed(1), "s");

// ---------------------------------------------------------------- screenshots para el pitch
const shotCtx = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 2, colorScheme: "dark" });
await shotCtx.addInitScript(initScript);
await shotCtx.addInitScript(() => {
  const s = document.createElement("style");
  s.textContent = "#__cursor{display:none!important}";
  document.addEventListener("DOMContentLoaded", () => document.documentElement.appendChild(s));
});
const sp = await shotCtx.newPage();
mkdirSync(`${OUT}/shots`, { recursive: true });
await sp.goto(`${BASE}/marketplace`, { waitUntil: "load" });
await sp.getByText("AgroInsumos Pampa").first().waitFor();
await sp.locator(".wallet-adapter-button-trigger", { hasText: pub58.slice(0, 4) }).waitFor({ timeout: 15000 });
await sp.waitForTimeout(1500);
await sp.evaluate(() => window.scrollTo(0, 300));
await sp.waitForTimeout(800);
await sp.screenshot({ path: `${OUT}/shots/marketplace.png` });

await sp.locator("div.glass-hover", { hasText: "AgroInsumos Pampa" }).first().locator('a[href^="/invoice/"]').click();
await sp.getByText("5 events").waitFor({ timeout: 20000 });
await sp.getByRole("button", { name: /original document/ }).click();
await sp.getByText("Document intact").waitFor();
await sp.waitForTimeout(900);
await sp.evaluate(() => window.scrollTo(0, 170));
await sp.waitForTimeout(600);
await sp.screenshot({ path: `${OUT}/shots/detail.png` });
await sp.getByText("Verify the tax document").evaluate((el) =>
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 140)
);
await sp.waitForTimeout(600);
await sp.screenshot({ path: `${OUT}/shots/verifier.png` });
await shotCtx.close();
await browser.close();
console.log("screenshots listos");
