import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const dir = path.dirname(fileURLToPath(import.meta.url));
const imgs = [1,2,3,4,5,6,7].map(n => `out/screenshot-0${n}.png`);
const html = `<!doctype html><html><head><meta charset=utf-8></head><body style="margin:0">
<div id=row style="display:inline-flex;gap:22px;padding:28px;background:#2e2e30;">
${imgs.map(s=>`<img src="${s}" style="height:620px;display:block;border-radius:16px;">`).join("")}
</div></body></html>`;
fs.writeFileSync(path.join(dir, "_gallery.html"), html);
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 3200, height: 900, deviceScaleFactor: 1 });
await page.goto("file://" + path.join(dir, "_gallery.html"), { waitUntil: "networkidle0" });
await page.evaluate(async () => { await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))); });
const row = await page.$("#row");
await row.screenshot({ path: path.join(dir, "out/_gallery.png") });
await browser.close();
console.log("ok", fs.statSync(path.join(dir,"out/_gallery.png")).size, "bytes");
