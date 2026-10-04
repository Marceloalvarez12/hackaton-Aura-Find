// Verifica que los links del header naveguen y saca screenshots de la landing.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
mkdirSync("video/out/qa", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (e) => console.log("[pageerror]", e.message.slice(0, 200)));

const header = () => page.locator("header nav").first();
const check = (name, ok) => console.log(`${ok ? "OK  " : "FAIL"} ${name}`);

await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: "video/out/qa/hero.png" });

await header().getByText("How it works").click();
await page.waitForTimeout(1500);
check("Cómo funciona (desde /) hace scroll", (await page.evaluate(() => window.scrollY)) > 400);
await page.waitForTimeout(1200);
await page.screenshot({ path: "video/out/qa/how.png" });

await header().getByText("Portfolio").click();
await page.waitForURL("**/portfolio", { timeout: 15000 }).catch(() => {});
check("Portfolio navega", page.url().endsWith("/portfolio"));

await header().getByText("Marketplace").click();
await page.waitForURL("**/marketplace", { timeout: 15000 }).catch(() => {});
check("Marketplace navega", page.url().endsWith("/marketplace"));

await header().getByText("How it works").click();
await page.waitForURL((u) => u.pathname === "/", { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1500);
check("Cómo funciona (desde /marketplace) vuelve y scrollea", page.url().endsWith("/#how") && (await page.evaluate(() => window.scrollY)) > 400);

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45));
await page.waitForTimeout(1800);
await page.screenshot({ path: "video/out/qa/mid.png" });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1800);
await page.screenshot({ path: "video/out/qa/bottom.png" });
await browser.close();
