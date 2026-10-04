// Graba el pitch: video/pitch/index.html, una slide por segmento de narración.
// Uso (desde la raíz): node video/record-pitch.mjs  -> video/out/raw/pitch.webm + video/out/pitch-timings.json
import { chromium } from "playwright";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const OUT = "video/out";
const PAD = 0.7;
const script = JSON.parse(readFileSync("video/script.json", "utf8"));
const durations = JSON.parse(readFileSync(`${OUT}/audio/durations.json`, "utf8"));

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1536, height: 864 },
  recordVideo: { dir: `${OUT}/raw`, size: { width: 1536, height: 864 } },
});
const page = await context.newPage();
const t0 = Date.now();
const elapsed = () => (Date.now() - t0) / 1000;

await page.goto(pathToFileURL(resolve("video/pitch/index.html")).href, { waitUntil: "load" });
if ((await page.evaluate(() => window.slideCount)) !== script.pitch.length) throw new Error("slides != segmentos");
await page.waitForTimeout(600);

const timings = [];
for (const [i, seg] of script.pitch.entries()) {
  await page.evaluate((i) => window.show(i), i);
  const start = elapsed() + 0.3; // la narración entra cuando la transición ya arrancó
  console.log(`> ${seg.id} @ ${start.toFixed(2)}s`);
  while (elapsed() < start + durations[seg.id] + PAD) await page.waitForTimeout(50);
  timings.push({ id: seg.id, start, end: elapsed() });
}
await page.waitForTimeout(1500);
const end = elapsed();

const video = page.video();
await context.close();
await browser.close();
renameSync(await video.path(), `${OUT}/raw/pitch.webm`);
writeFileSync(`${OUT}/pitch-timings.json`, JSON.stringify({ timings, end }, null, 2));
console.log(`pitch: ${end.toFixed(1)} s`);
