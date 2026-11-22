// Re-copies the CSS kit from docs/StyleSheets/... into packages/styles/css + js (verbatim).
// Usage: node scripts/sync-kit.mjs [path-to-kit]
import { cpSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const kit = resolve(process.argv[2] ?? join(pkg, "..", "..", "docs", "StyleSheets", "files", "aspnet-ui-css-kit", "aspnet-ui-css-kit"));
if (!existsSync(kit)) { console.error(`Kit not found: ${kit}`); process.exit(1); }

const families = ["gridview", "login", "menu", "treeview", "tabs", "navigation", "validation", "bundles"];
let n = 0;
for (const f of families) {
  mkdirSync(join(pkg, "css", f), { recursive: true });
  for (const file of readdirSync(join(kit, f)).filter((x) => x.endsWith(".css"))) {
    cpSync(join(kit, f, file), join(pkg, "css", f, file)); n++;
  }
}
mkdirSync(join(pkg, "js"), { recursive: true });
cpSync(join(kit, "validation", "validation-input-highlight.js"), join(pkg, "js", "validation-input-highlight.js")); n++;
console.log(`Synced ${n} files from ${kit}`);
