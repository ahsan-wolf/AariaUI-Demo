// Builds dist/ from css/ + js/: verbatim copies plus .min.css (comment + whitespace strip).
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, cpSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import "./bundle-full.mjs"; // regenerate css/bundles/*-full.css first

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(pkg, "dist");

/** Safe for these sheets: no strings contain "/*" or "}" and there is no calc() needing spaces around + or -. */
export function minify(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim() + "\n";
}

rmSync(dist, { recursive: true, force: true });
let count = 0;
function walk(dir, rel) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const out = join(dist, rel, name);
    if (statSync(full).isDirectory()) { walk(full, join(rel, name)); continue; }
    mkdirSync(dirname(out), { recursive: true });
    cpSync(full, out);
    if (name.endsWith(".css")) writeFileSync(out.replace(/\.css$/, ".min.css"), minify(readFileSync(full, "utf8")));
    count++;
  }
}
walk(join(pkg, "css"), "css");
walk(join(pkg, "js"), "js");
console.log(`@wf-controls/styles: built ${count} files into dist/`);
