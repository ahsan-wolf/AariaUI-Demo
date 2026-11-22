#!/usr/bin/env node
// Generates the gallery's API documentation data from the verified Markdown reference in /docs.
//
//   npm run gen:docs -w aaira-gallery
//
// Output (committed, so the app builds without running this):
//   src/data/apiDocs/manifest.ts   areas -> entries -> tabs (titles only), lightweight, loaded with the app
//   src/data/apiDocs/areas/*.ts    rendered HTML per area, lazy-loaded when an area is opened
//   src/data/apiDocs/search.ts     search index (lazy-loaded by the search modal)
//
// Model: every `##` section of a source file becomes an ENTRY (usually one class); every `###` inside it becomes a TAB
// (Constructor, Properties, Methods, Events, ...). Sections with many `###` blocks (the Examples sections) collapse into a
// single tab with an index at the top.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRenderer, decodeEntities, slugger, stripInline } from "../../../docs/lib/markdown.mjs";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(APP, "..", "..");
const DOCS = path.join(ROOT, "docs");
const OUT = path.join(APP, "src", "data", "apiDocs");
const REPO_URL = "https://github.com/ahsan-wolf/webforms-ts-controls/blob/main";

/** Reading order of the sidebar. `file` is relative to /docs. Missing optional files are skipped with a warning. */
const AREAS = [
  { id: "data-library", title: "Data Library (ADO.NET)", icon: "database", files: [{ file: "v1.0.0/api/data-library.md" }] },
  { id: "data-binding", title: "Data Binding", icon: "link", files: [{ file: "v1.0.0/data-binding.md", optional: true }] },
  { id: "data-controls", title: "Data Controls", icon: "grid", files: [{ file: "v1.0.0/api/data-controls.md" }] },
  { id: "data-sources", title: "Data Sources", icon: "database", files: [{ file: "v1.0.0/api/data-sources.md" }] },
  { id: "validation", title: "Validation", icon: "check", files: [{ file: "v1.0.0/api/validation.md" }] },
  { id: "navigation", title: "Navigation", icon: "tree", files: [{ file: "v1.0.0/api/navigation.md" }] },
  { id: "security", title: "Login & Security", icon: "shield", files: [{ file: "v1.0.0/api/security.md" }] },
  { id: "specialized", title: "Specialized Controls", icon: "calendar", files: [{ file: "v1.0.0/api/specialized-controls.md" }] },
  { id: "behaviors", title: "Behaviors", icon: "zap", files: [{ file: "v1.0.0/api/behaviors.md" }] },
  {
    id: "adapters", title: "UI Adapters", icon: "layers",
    files: [
      { file: "v1.0.0/api/react-adapters.md", prefix: "react-", titlePrefix: "React · " },
      { file: "v1.0.0/api/angular-adapters.md", prefix: "angular-", titlePrefix: "Angular · " }
    ]
  },
  {
    id: "architecture", title: "Design & Architecture", icon: "layers",
    files: [
      { file: "design-architecture/chapters/00-preface.md", prefix: "a00-" },
      { file: "design-architecture/chapters/01-big-picture.md", prefix: "a01-" },
      { file: "design-architecture/chapters/02-technology-stack.md", prefix: "a02-" },
      { file: "design-architecture/chapters/03-design-components.md", prefix: "a03-" },
      { file: "design-architecture/chapters/04-classes-polymorphism.md", prefix: "a04-" },
      { file: "design-architecture/chapters/05-design-patterns.md", prefix: "a05-" },
      { file: "design-architecture/chapters/06-shared-code.md", prefix: "a06-" },
      { file: "design-architecture/chapters/07-writing-controllers.md", prefix: "a07-" },
      { file: "design-architecture/chapters/08-events-methods-parameters.md", prefix: "a08-" },
      { file: "design-architecture/chapters/09-adapters.md", prefix: "a09-" },
      { file: "design-architecture/chapters/10-css-management.md", prefix: "a10-" },
      { file: "design-architecture/chapters/11-javascript-build.md", prefix: "a11-" },
      { file: "design-architecture/chapters/12-workflows.md", prefix: "a12-" },
      { file: "design-architecture/chapters/13-optimization.md", prefix: "a13-" },
      { file: "design-architecture/chapters/A-glossary-and-checklists.md", prefix: "aa-" },
      { file: "design-architecture/chapters/B-file-map.md", prefix: "ab-" },
      { file: "design-architecture/chapters/C-code-map.md", prefix: "ac-" }
    ]
  },
  {
    id: "guides", title: "Guides & Notes", icon: "book",
    files: [
      { file: "v1.0.0/USER-GUIDE.md", prefix: "guide-" },
      { file: "v1.0.0/rest-and-server-paging.md", prefix: "rest-", titlePrefix: "REST & paging · " },
      { file: "v1.0.0/angular-guide.md", prefix: "ngguide-", titlePrefix: "Angular guide · " },
      { file: "v1.0.0/javascript-html-guide.md", prefix: "jsguide-", titlePrefix: "JavaScript guide · " },
      { file: "v1.0.0/books-and-examples.md", prefix: "books-", titlePrefix: "Books & examples · " },
      { file: "v1.0.0/KNOWN-ISSUES.md", prefix: "issues-", titlePrefix: "Known issues · " }
    ]
  }
];

const SKIP_SECTION = /^(table of contents|contents|verification notes)$/i;

// ---------------------------------------------------------------------------------------------------------------------
const clean = (t) =>
  decodeEntities(stripInline(t))
    .replace(/^\d+(?:\.\d+)*\.?\s+/, "") // "4. DataColumn" / "5.1 Options" -> "DataColumn" / "Options"
    .trim();
const slug = (t) => clean(t).toLowerCase().replace(/<[^>]*>/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "section";
const plain = (html) => decodeEntities(html.replace(/<(?:pre|div class="code-block")[\s\S]*?<\/(?:pre|div)>/g, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

/** Split rendered HTML at tags like `<h2 id="x">` (never appears inside code: code is escaped). */
function splitAt(html, level) {
  const parts = html.split(new RegExp(`(?=<h${level} id=")`));
  const head = parts[0].startsWith(`<h${level} id=`) ? "" : parts.shift();
  return { head, parts };
}

function headingOf(part, level) {
  const m = new RegExp(`^<h${level} id="([^"]+)">([\\s\\S]*?)<a class="anchor"`).exec(part);
  return m ? { id: m[1], title: clean(m[2].replace(/<[^>]+>/g, "")), hasCode: m[2].includes("<code>") } : undefined;
}

function used(map, base) {
  let id = base, n = 2;
  while (map.has(id)) id = `${base}-${n++}`;
  map.add(id);
  return id;
}

// ---------------------------------------------------------------------------------------------------------------------
// Pass 1: parse every source file into areas/entries/tabs with identity link rewriting, collecting an anchor map.
// ---------------------------------------------------------------------------------------------------------------------
function readRepoFile(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8").replace(/\r\n?/g, "\n").replace(/\n+$/, "");
}

const MEMBER_TAB = /^(constructor|properties|methods|events|commands)/i;
const stripHeading = (part) => part.replace(/^<h[2-4] id="[^"]+">[\s\S]*?<\/h[2-4]>\n?/, "");
const SECTIONS_WITH_MANY = /examples?|recipes|patterns|checklist|inconsistencies|gotchas|limitations|troubleshooting/i;

/** Turn "overview html + sub-section parts" into tabs. Sections like Examples collapse into one tab with an index. */
function makeTabs(title, overview, subs, level) {
  const tabs = [];
  const tabIds = new Set();
  const headingLevel = level;
  if (subs.length > 0 && (SECTIONS_WITH_MANY.test(title) || subs.length > 14)) {
    const index = subs
      .map((p) => headingOf(p, headingLevel))
      .filter(Boolean)
      .map((h) => "<li><a href=\"#/api/@AREA@/@ENTRY@/@TAB@/" + h.id + "\">" + h.title + "</a></li>")
      .join("");
    const tabTitle = /examples?|recipes|patterns/i.test(title) ? "Examples" : "Details";
    tabs.push({ id: used(tabIds, slug(tabTitle)), title: tabTitle, html: overview + "<ul class=\"aa-doc-index\">" + index + "</ul>" + subs.join("") });
    return tabs;
  }
  if (overview.trim()) tabs.push({ id: used(tabIds, "overview"), title: "Overview", html: overview });
  for (const p of subs) {
    const h = headingOf(p, headingLevel);
    if (!h) continue;
    tabs.push({ id: used(tabIds, slug(h.title)), title: h.title, html: p });
  }
  if (tabs.length === 0) tabs.push({ id: "overview", title: "Overview", html: overview });
  return tabs;
}

const summaryOf = (html) => plain(/<p>([\s\S]*?)<\/p>/.exec(html)?.[1] ?? "").slice(0, 200);
const looksLikeClass = (hasCode, tabs) => hasCode || tabs.some((t) => MEMBER_TAB.test(t.title));

function parseFile(fileCfg, rewriteHref) {
  const md = fs.readFileSync(path.join(DOCS, fileCfg.file), "utf8");
  const { body } = createRenderer({ rewriteHref, readFile: readRepoFile }).render(md);
  const { parts } = splitAt(body, 2);
  const entries = [];
  const entryIds = new Set();
  const push = (title, hasCode, overview, tabs) => {
    const id = used(entryIds, fileCfg.prefix ? fileCfg.prefix + slug(title) : slug(title));
    entries.push({ id, title: (fileCfg.titlePrefix ?? "") + title, rawTitle: title, summary: summaryOf(overview), kind: looksLikeClass(hasCode, tabs) ? "class" : "topic", tabs });
  };

  for (const part of parts) {
    const h2 = headingOf(part, 2);
    if (!h2 || SKIP_SECTION.test(h2.title)) continue;
    const afterH2 = stripHeading(part);
    const { head: overview, parts: h3s } = splitAt(afterH2, 3);

    // "## 10. DataSet, DataRelation, DataTableCollection" style sections: each ### class becomes its own entry, its #### blocks the tabs.
    const classLike = h3s.filter((p) => splitAt(stripHeading(p), 4).parts.filter((q) => MEMBER_TAB.test(headingOf(q, 4)?.title ?? "")).length >= 2);
    if (classLike.length >= 2) {
      if (plain(overview).length > 40) push(h2.title, h2.hasCode, overview, [{ id: "overview", title: "Overview", html: overview }]);
      for (const p of h3s) {
        const h3 = headingOf(p, 3);
        if (!h3) continue;
        const inner = splitAt(stripHeading(p), 4);
        if (classLike.includes(p)) push(h3.title, h3.hasCode, inner.head, makeTabs(h3.title, inner.head, inner.parts, 4));
        else push(h3.title, h3.hasCode, inner.head, [{ id: "overview", title: "Overview", html: p }]);
      }
      continue;
    }
    push(h2.title, h2.hasCode, overview, makeTabs(h2.title, overview, h3s, 3));
  }
  return { entries };
}

// Build with a first, link-agnostic pass to learn which entry/tab each anchor lives in.
const sources = [];
for (const area of AREAS) {
  for (const f of area.files) {
    if (!fs.existsSync(path.join(DOCS, f.file))) {
      if (f.optional) { console.warn(`! skipped (missing): ${f.file}`); continue; }
      throw new Error(`Missing source file: ${f.file}`);
    }
    sources.push({ area, ...f });
  }
}

const anchorMap = new Map(); // `${file}#${anchor}` -> { area, entry, tab }
const firstEntry = new Map(); // file -> { area, entry }
for (const s of sources) {
  const parsed = parseFile(s, (h) => h);
  s.parsed = parsed;
  for (const e of parsed.entries) {
    if (!firstEntry.has(s.file)) firstEntry.set(s.file, { area: s.area.id, entry: e.id });
    for (const t of e.tabs) {
      for (const m of t.html.matchAll(/\sid="([^"]+)"/g)) anchorMap.set(`${s.file}#${m[1]}`, { area: s.area.id, entry: e.id, tab: t.id });
    }
  }
  // headings of the entry itself (h2 id) point at the first tab
  for (const part of splitAt(createRenderer({ rewriteHref: (h) => h, readFile: readRepoFile }).render(fs.readFileSync(path.join(DOCS, s.file), "utf8")).body, 2).parts) {
    const h2 = headingOf(part, 2);
    if (!h2) continue;
    const owner = s.parsed.entries.find((e) => e.rawTitle === h2.title);
    if (owner) anchorMap.set(`${s.file}#${h2.id}`, { area: s.area.id, entry: owner.id, tab: owner.tabs[0].id });
  }
}
const sourceFiles = new Set(sources.map((s) => s.file));

// ---------------------------------------------------------------------------------------------------------------------
// Pass 2: real link rewriting -> in-app hash routes (#/api/<entry>/<tab>/<anchor>) or GitHub for files we do not render.
// ---------------------------------------------------------------------------------------------------------------------
function makeRewrite(fromFile) {
  return (href) => {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) return href;
    const [rawPath, hash] = href.split("#");
    const targetFile = rawPath ? path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), rawPath)) : fromFile;

    if (!targetFile.startsWith("..") && sourceFiles.has(targetFile)) {
      if (hash) {
        const hit = anchorMap.get(`${targetFile}#${hash}`);
        if (hit) return `#/api/${hit.area}/${hit.entry}/${hit.tab}/${hash}`;
      }
      const first = firstEntry.get(targetFile);
      return first ? `#/api/${first.area}/${first.entry}` : "#/api";
    }
    const repoPath = targetFile.startsWith("..") ? path.posix.normalize(path.posix.join("docs", targetFile)) : `docs/${targetFile}`;
    return `${REPO_URL}/${repoPath}${hash ? `#${hash}` : ""}`;
  };
}

const manifestAreas = [];
const areaModules = {};
const search = [];

for (const area of AREAS) {
  const entries = [];
  const modules = {};
  for (const s of sources.filter((x) => x.area === area)) {
    const { entries: es } = parseFile(s, makeRewrite(s.file));
    for (const e of es) {
      const tabHtml = {};
      for (const t of e.tabs) {
        const html = t.html.replaceAll("@AREA@", area.id).replaceAll("@ENTRY@", e.id).replaceAll("@TAB@", t.id);
        tabHtml[t.id] = html;
        const text = plain(html);
        // identifier tokens with occurrence counts ("rowdeleting*5"): pages that are ABOUT a word outrank pages that mention it once
        const counts = new Map();
        for (const w of text.match(/[A-Za-z_][A-Za-z0-9_]{2,}/g) ?? []) counts.set(w.toLowerCase(), (counts.get(w.toLowerCase()) ?? 0) + 1);
        const tokens = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 400).map(([w, n]) => (n > 1 ? `${w}*${Math.min(n, 99)}` : w));
        // p: tie-break priority. Member tabs of a class (Events, Methods, ...) beat class overviews beat general topics.
        const p = e.kind === "class" ? (/^(constructor|properties|methods|events|commands)/i.test(t.title) ? 2 : 1) : 0;
        search.push({ e: e.id, t: t.id, a: area.id, n: `${e.title} › ${t.title}`, x: text.slice(0, 240), k: tokens.join(" "), p });
      }
      modules[e.id] = tabHtml;
      entries.push({ id: e.id, title: e.title, kind: e.kind, summary: e.summary, source: s.file, tabs: e.tabs.map((t) => ({ id: t.id, title: t.title })) });
    }
  }
  if (entries.length === 0) continue;
  manifestAreas.push({ id: area.id, title: area.title, icon: area.icon, entries });
  areaModules[area.id] = modules;
}

// ---------------------------------------------------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------------------------------------------------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "areas"), { recursive: true });
const banner = "// AUTO-GENERATED by scripts/build-api-docs.mjs from /docs. Do not edit; run `npm run gen:docs -w aaira-gallery`.\n";

for (const [areaId, modules] of Object.entries(areaModules)) {
  fs.writeFileSync(path.join(OUT, "areas", `${areaId}.ts`), `${banner}const area: Record<string, Record<string, string>> = ${JSON.stringify(modules)};\nexport default area;\n`);
}

const loaders = manifestAreas.map((a) => `  '${a.id}': () => import('./areas/${a.id}'),`).join("\n");
fs.writeFileSync(
  path.join(OUT, "manifest.ts"),
  `${banner}import type { ApiArea } from './types';\n\n` +
    `export const apiAreas: ApiArea[] = ${JSON.stringify(manifestAreas, null, 1)};\n\n` +
    `/** Rendered HTML per area, loaded on demand: areaId -> entryId -> tabId -> html. */\n` +
    `export const areaLoaders: Record<string, () => Promise<{ default: Record<string, Record<string, string>> }>> = {\n${loaders}\n};\n`
);
fs.writeFileSync(path.join(OUT, "search.ts"), `${banner}import type { ApiSearchRecord } from './types';\n\nconst records: ApiSearchRecord[] = ${JSON.stringify(search)};\nexport default records;\n`);
fs.writeFileSync(
  path.join(OUT, "types.ts"),
  `export interface ApiTab { id: string; title: string }
export interface ApiEntry { id: string; title: string; kind: 'class' | 'topic'; summary: string; source: string; tabs: ApiTab[] }
export interface ApiArea { id: string; title: string; icon: string; entries: ApiEntry[] }
/** e = entry id, t = tab id, a = area id, n = display name, x = snippet, k = lower-case identifier tokens ("word" or "word*count") */
export interface ApiSearchRecord { e: string; t: string; a: string; n: string; x: string; k: string; p: number }
`
);

const total = manifestAreas.reduce((n, a) => n + a.entries.length, 0);
const tabs = manifestAreas.reduce((n, a) => n + a.entries.reduce((m, e) => m + e.tabs.length, 0), 0);
const kb = (p) => (fs.statSync(p).size / 1024).toFixed(0);
console.log(`API docs: ${manifestAreas.length} areas, ${total} entries, ${tabs} tabs, ${search.length} search records`);
console.log(`  manifest ${kb(path.join(OUT, "manifest.ts"))} KB, search ${kb(path.join(OUT, "search.ts"))} KB, areas ${fs.readdirSync(path.join(OUT, "areas")).map((f) => `${f.replace(".ts", "")}:${kb(path.join(OUT, "areas", f))}KB`).join(" ")}`);
