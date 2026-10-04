import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } });
page.on("console", (m) => m.type() === "error" && console.log("[console]", m.text().slice(0, 300)));
page.on("pageerror", (e) => console.log("[pageerror]", e.message.slice(0, 300)));
await page.goto("http://localhost:3000/invoice/7JrnE6SFWp6uJ2T4dDp42WDc1aQ4AAEips87nB2CYAVt");
await page.getByText("Invoice history").waitFor();
await page.waitForTimeout(3000);
await page.getByRole("button", { name: /original document/ }).click();
await page.waitForTimeout(3000);
const box = page.getByText("Verify the tax document").locator("xpath=ancestor::div[contains(@class,'glass')][1]");
console.log((await box.innerText()).slice(0, 1200));
await page.screenshot({ path: "video/out/qa/verifier.png", fullPage: true });
await browser.close();
