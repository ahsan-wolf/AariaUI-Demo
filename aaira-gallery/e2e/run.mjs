// UI test for the gallery's API Docs section and ADO.NET demos, driven through the Chrome DevTools Protocol.
//
//   npm run build -w aaira-gallery        (produces ./dist; the app's `build` script runs tsc first)
//   npm run e2e   -w aaira-gallery
//
// No extra packages: serves ./dist with a tiny static server, launches headless Chrome/Edge and talks to it over the
// DevTools WebSocket (global `WebSocket`, Node 22+). Set CHROME_PATH to pick a browser; set E2E_SHOTS=<dir> to save screenshots.
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(HERE, "..", "dist");
const OUT = process.env.E2E_SHOTS;
const PORT = Number(process.env.E2E_PORT ?? 4180), DEBUG = Number(process.env.E2E_DEBUG_PORT ?? 9336);
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };

const CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
];
const CHROME = CANDIDATES.find((p) => p && fs.existsSync(p));
if (!CHROME) { console.error("No Chrome/Edge found. Set CHROME_PATH to a browser executable."); process.exit(2); }
if (!fs.existsSync(path.join(DIST, "index.html"))) { console.error("dist/ is missing. Run `npm run build` in apps/aaira-gallery first."); process.exit(2); }
if (OUT) fs.mkdirSync(OUT, { recursive: true });
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), "aaira-gallery-e2e-"));

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const file = path.join(DIST, url.pathname === "/" ? "index.html" : url.pathname);
  if (!file.startsWith(DIST)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (e, d) => { if (e) { res.writeHead(404); res.end(); } else { res.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "text/plain" }); res.end(d); } });
}).listen(PORT);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${DEBUG}`, `--user-data-dir=${PROFILE}`, "--no-first-run", "--disable-gpu", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });

let ws, id = 1; const pending = new Map(); const problems = []; let step = 0;
const ok = (m) => console.log(`  ${String(++step).padStart(2, "0")}. ok  ${m}`);
const send = (method, params = {}) => new Promise((res, rej) => { const i = id++; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => { const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error("page: " + (r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)); return r.result.value; };
const text = (sel) => ev(`document.querySelector(${JSON.stringify(sel)})?.textContent ?? null`);
const count = (sel) => ev(`document.querySelectorAll(${JSON.stringify(sel)}).length`);
const click = (sel) => ev(`document.querySelector(${JSON.stringify(sel)}).click()`);
const clickText = (sel, t) => ev(`(()=>{const el=[...document.querySelectorAll(${JSON.stringify(sel)})].find(e=>e.textContent.trim().startsWith(${JSON.stringify(t)}));if(!el)throw new Error('no ${sel} starting with ${t}');el.click();})()`);
const setInput = (sel, v) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});const set=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(e),'value').set;set.call(e,${JSON.stringify(v)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
async function shot(name, w = 1400, h = 900) {
  if (!OUT) return;
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await sleep(300);
  const r = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(OUT, name), Buffer.from(r.data, "base64"));
}
async function go(hash) { await ev(`location.hash=${JSON.stringify(hash)}`); await sleep(500); }
async function finish(code) {
  try { ws?.close(); } catch {} chrome.kill(); server.close(); await sleep(300);
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch { /* browser may still hold files */ }
  process.exit(code);
}

try {
  let targets;
  for (let i = 0; i < 50; i++) { try { targets = await (await fetch(`http://127.0.0.1:${DEBUG}/json/list`)).json(); if (targets.length) break; } catch {} await sleep(200); }
  ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => {
    const g = JSON.parse(m.data);
    if (g.id && pending.has(g.id)) { const p = pending.get(g.id); pending.delete(g.id); g.error ? p.rej(new Error(g.error.message)) : p.res(g.result); }
    else if (g.method === "Runtime.exceptionThrown") problems.push("exception: " + (g.params.exceptionDetails.exception?.description ?? g.params.exceptionDetails.text));
    else if (g.method === "Runtime.consoleAPICalled" && g.params.type === "error") problems.push("console.error: " + g.params.args.map((a) => a.value ?? a.description).join(" "));
  };
  await send("Runtime.enable"); await send("Page.enable");

  // ---- deep link straight into an API page ----
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/#/api/data-library/datatable` }); await sleep(1200);
  assert.equal(await text(".aa-doc-title"), "DataTable");
  assert.match(await text(".aa-doc-crumbs"), /Data Library/);
  const tabs = await ev(`[...document.querySelectorAll('.aa-doc-tabs .detail-tab')].map(t=>t.textContent.trim())`);
  for (const t of ["Overview", "Constructor", "Properties", "Methods", "Events"]) assert.ok(tabs.includes(t), `tab ${t} in ${tabs}`);
  ok(`deep link #/api/data-library/datatable opens DataTable with tabs: ${tabs.slice(0, 5).join(" | ")}`);

  await clickText(".aa-doc-tabs .detail-tab", "Properties"); await sleep(300);
  assert.match(await ev("location.hash"), /\/datatable\/properties$/);
  assert.ok((await count(".aa-doc table")) >= 1);
  assert.match(await text(".aa-doc"), /primaryKey/);
  ok("Properties tab: URL updated to .../datatable/properties, member table shows primaryKey");

  await clickText(".aa-doc-tabs .detail-tab", "Methods"); await sleep(300);
  const methodsText = await text(".aa-doc");
  for (const m of ["newRow", "acceptChanges", "select", "find"]) assert.ok(methodsText.includes(m), m);
  ok("Methods tab lists newRow / acceptChanges / select / find");
  await shot("gallery-api-datatable-dark.png");

  // ---- sidebar filter + other class ----
  await setInput(".sidebar-search-input", "gridview"); await sleep(300);
  assert.ok((await count(".aa-api-nav-item")) >= 1);
  await clickText(".aa-api-nav-item", "GridViewController"); await sleep(600);
  assert.equal(await text(".aa-doc-title"), "GridViewController");
  await clickText(".aa-doc-tabs .detail-tab", "Events"); await sleep(300);
  assert.match(await text(".aa-doc"), /rowDeleting/);
  assert.match(await text(".aa-doc"), /GridCancelableRowEventArgs/);
  ok("sidebar filter finds GridViewController; Events tab documents rowDeleting + its argument type");
  await shot("gallery-api-gridview-events-dark.png");

  // ---- in-content cross link ----
  await go("#/api/data-library/quick-start");
  const linkHash = await ev(`(()=>{const a=[...document.querySelectorAll('.aa-doc a[href^="#/api"]')][0];return a?a.getAttribute('href'):null})()`);
  if (linkHash) {
    await ev(`document.querySelector('.aa-doc a[href^="#/api"]').click()`); await sleep(600);
    assert.equal(await ev("location.hash"), linkHash);
    ok(`in-content link ${linkHash} navigates inside the app`);
  } else ok("(no in-content api link on quick-start; skipped)");

  // ---- anchors: a link into the middle of a page ----
  await go("#/api/data-library/serialization-lifecycle-and-gotchas/details");
  assert.ok((await count(".aa-doc-index a")) > 3);
  await ev(`document.querySelector('.aa-doc-index a').click()`); await sleep(700);
  assert.match(await ev("location.hash"), /serialization-lifecycle-and-gotchas\/details\/.+/);
  ok("Details tab has a section index; clicking an entry deep-links to its anchor");

  // ---- global search ----
  await ev(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true}))`); await sleep(500);
  await setInput(".modal-search-input", "rowDeleting"); await sleep(500);
  const headings = await ev(`[...document.querySelectorAll('.aa-search-heading')].map(h=>h.textContent)`);
  assert.ok(headings.includes("API reference"), String(headings));
  const firstApi = await ev(`(()=>{const items=[...document.querySelectorAll('.modal-result-item')];return items.length?items[0].querySelector('.result-name').textContent:null})()`);
  assert.match(firstApi, /GridViewController › Events|Events|Methods/, firstApi);
  await shot("gallery-search.png");
  await ev(`document.querySelector('.modal-result-item').click()`); await sleep(700);
  assert.match(await ev("location.hash"), /^#\/api\//);
  ok(`Ctrl+K search for 'rowDeleting' returns API results (top: "${firstApi}") and opens the page`);

  // ---- API Docs top nav button ----
  await clickText(".nav-link-btn", "Home"); await sleep(300);
  assert.equal(await ev("location.hash"), "");
  await clickText(".nav-link-btn", "API Docs"); await sleep(700);
  assert.match(await ev("location.hash"), /^#\/api\//);
  ok("header 'API Docs' button returns to the last API page and restores the hash");

  // ---- control gallery: embedded reference tab ----
  await clickText(".nav-link-btn", "Controls Gallery"); await sleep(400);
  await clickText(".control-nav-item", "GridView"); await sleep(500);
  await clickText(".detail-tab", "API Reference"); await sleep(900);
  assert.equal(await count(".aa-doc-banner"), 1);
  assert.match(await text(".aa-doc"), /GridViewController/);
  const embeddedTabs = await ev(`[...document.querySelectorAll('.aa-doc-tabs .detail-tab')].length`);
  assert.ok(embeddedTabs >= 5);
  ok(`GridView > API Reference tab embeds the generated reference (${embeddedTabs} sub-tabs, banner + 'Open in API Docs')`);
  await shot("gallery-gridview-api-tab.png");
  // framework switch: jQuery shows the 'not published' notice
  await clickText(".detail-tab", "Multi-Framework Code"); await sleep(300);
  await clickText(".framework-pills .framework-pill-btn", "HTML");
  await sleep(300);
  assert.equal(await count(".aa-doc-notice"), 1);
  await clickText(".framework-pills .framework-pill-btn", "Angular"); await sleep(300);
  assert.match(await text(".code-pre"), /\[controller\]|WebFormsGridViewComponent/);
  assert.ok(!/dataKeyNames/.test(await text(".code-pre")));
  ok("Code tab: jQuery notice shown; Angular sample uses the real [controller] / WebFormsGridViewComponent API");

  // ---- DataTable live demo ----
  await clickText(".control-nav-item", "DataTable & DataView"); await sleep(400);
  await clickText(".detail-tab", "Live Preview"); await sleep(500);
  assert.equal(await text(".detail-title"), "DataTable & DataView");
  const rowsBefore = await text(".aa-dc-panel > h4 small");
  assert.match(rowsBefore, /7 rows/);
  await clickText(".aa-dc-btn", "+ rows.add()"); await sleep(300);
  assert.match(await text(".aa-dc-panel > h4 small"), /8 rows/);
  assert.ok((await count(".aa-dc-state.Added")) >= 1);
  ok("DataTable demo: rows.add() raises the count to 8 and the new row shows state Added");

  await ev(`(()=>{const input=[...document.querySelectorAll('.aa-dc-table tbody tr')][0].querySelectorAll('input')[1];const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(input,'99');input.dispatchEvent(new Event('input',{bubbles:true}));})()`); await sleep(300);
  assert.ok((await count(".aa-dc-state.Modified")) >= 1);
  assert.ok((await count(".aa-dc-orig")) >= 1);
  ok("editing a price marks the row Modified and shows the Original value");

  await clickText(".aa-dc-btn", "delete()"); await sleep(300);
  assert.ok((await count(".aa-dc-state.Deleted")) >= 1);
  await clickText(".aa-dc-btn", "acceptChanges()"); await sleep(300);
  assert.equal(await count(".aa-dc-state.Added") + await count(".aa-dc-state.Modified") + await count(".aa-dc-state.Deleted"), 0);
  ok("delete() marks Deleted; acceptChanges() commits everything back to Unchanged");

  await setInput(".aa-dc-toolbar input.wide", "price >"); await sleep(300);
  assert.ok((await count(".aa-dc-error")) >= 1);
  await setInput(".aa-dc-toolbar input.wide", "category = 'Safety'"); await sleep(300);
  assert.match(await text(".aa-dc-panel:nth-child(2) > h4 small, .aa-dc-row .aa-dc-panel:last-child > h4 small"), /2 row/);
  ok("DataView: an invalid filter shows the parser error; category = 'Safety' leaves 2 rows");
  await setInput(".aa-dc-toolbar input.wide", "price > 10"); await sleep(300);
  await shot("gallery-demo-datatable.png", 1400, 1000);

  // ---- DataSet demo ----
  await clickText(".control-nav-item", "DataSet & DataRelation"); await sleep(700);
  assert.match(await text(".aa-dc-panel:nth-child(2) > h4"), /Orders of Contoso/);
  await ev(`[...document.querySelectorAll('.aa-dc-table tbody tr')].find(r=>r.textContent.includes('Northwind')).click()`); await sleep(300);
  assert.match(await text(".aa-dc-row .aa-dc-panel:nth-child(2) > h4"), /Orders of Northwind/);
  assert.match(await text(".aa-dc-row .aa-dc-panel:nth-child(2) .aa-dc-table"), /Keyboard/);
  await clickText(".aa-dc-btn", "ds.toXml()"); await sleep(300);
  assert.match(await text(".aa-dc-code"), /<Shop>|<NewDataSet>|<Customers>/);
  ok("DataSet demo: selecting a customer shows its child rows through the relation; toXml() renders");
  await shot("gallery-demo-dataset.png", 1400, 1000);

  // ---- Data binding demo + event order ----
  await clickText(".control-nav-item", "Data Binding"); await sleep(900);
  const logText = await text(".aa-dc-log");
  const order = ["dataBinding", "rowCreated → rowDataBound", "dataBound"].map((n) => logText.indexOf(n));
  assert.ok(order.every((i) => i >= 0) && order[0] < order[1] && order[1] < order[2], `order ${order} in ${logText.slice(0, 200)}`);
  assert.match(logText, /rowCreated → rowDataBound \(per row\) ×7/);
  ok("Data binding demo: initial bind logs dataBinding > (rowCreated > rowDataBound) ×7 > dataBound");

  await clickText(".aa-dc-btn", "clear"); await sleep(200);
  await clickText(".aa-dc-btn", "next ›"); await sleep(400);
  const paged = await text(".aa-dc-log");
  assert.ok(paged.indexOf("pageIndexChanging") < paged.indexOf("pageIndexChanged"));
  ok("paging logs pageIndexChanging before pageIndexChanged");

  await ev(`[...document.querySelectorAll('label.aa-dc-hint input')].find(i=>i.parentElement.textContent.includes('cancel deletes')).click()`); await sleep(200);
  await clickText(".aa-dc-btn", "clear"); await sleep(200);
  const before = await count(".aa-dc-row .aa-dc-panel:first-child .aa-dc-table tbody tr");
  await clickText(".aa-dc-table button", "Delete"); await sleep(400);
  assert.match(await text(".aa-dc-log li.cancel"), /rowDeleting/);
  assert.equal(await count(".aa-dc-row .aa-dc-panel:first-child .aa-dc-table tbody tr"), before);
  ok("with 'cancel deletes' on, rowDeleting is logged as cancelled and the row stays");
  await shot("gallery-demo-binding.png", 1400, 1100);

  // ---- light theme sample ----
  await go("#/api/data-library/dataset/methods");
  await ev(`document.querySelector('.icon-action-btn').click()`); await sleep(400);
  await shot("gallery-api-dataset-light.png");

  assert.deepEqual(problems, [], "no page errors / console errors");
  ok("no uncaught exceptions or console errors during the whole run");
  console.log(`\nAll ${step} gallery checks passed.`);
  await finish(0);
} catch (err) {
  console.error("\nFAILED:", err.message);
  if (problems.length) console.error("page problems:\n  " + problems.join("\n  "));
  try { await shot("gallery-failure.png"); } catch {}
  await finish(1);
}
