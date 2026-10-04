import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const src = readFileSync("video/record-demo.mjs", "utf8");
const secret = JSON.parse(readFileSync("deploy-keys/demo-ui-wallet.json", "utf8"));
const { Keypair } = await import("@solana/web3.js");
const pub58 = Keypair.fromSecretKey(Uint8Array.from(secret)).publicKey.toBase58();
const tpl = src.slice(src.indexOf("const initScript = `") + 20, src.indexOf("})();`;") + 5);
const initScript = new Function("secret", "pub58", "return `" + tpl + "`")(secret, pub58);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 } });
await ctx.addInitScript(initScript);
const page = await ctx.newPage();
page.on("console", (m) => console.log("[console]", m.type(), m.text().slice(0, 200)));
page.on("pageerror", (e) => console.log("[pageerror]", e.message.slice(0, 300)));
await page.goto("http://localhost:3000/marketplace");
await page.waitForTimeout(5000);
console.log(await page.evaluate(() => ({
  phantom: !!window.phantom?.solana?.isPhantom,
  connected: window.phantom?.solana?.isConnected,
  walletName: localStorage.getItem("walletName"),
  buttons: [...document.querySelectorAll("button")].map((b) => b.className + " | " + b.textContent).slice(0, 4),
})));
await page.screenshot({ path: "video/out/debug.png" });
await browser.close();
