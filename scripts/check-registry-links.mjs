// Fails when a control in src/data/controlsRegistry.ts links to API docs that do not exist in the generated manifest.
// Run: npm run check:links -w aaira-gallery   (after npm run gen:docs when docs changed)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registry = fs.readFileSync(path.join(root, "src/data/controlsRegistry.ts"), "utf8");
const manifest = fs.readFileSync(path.join(root, "src/data/apiDocs/manifest.ts"), "utf8");

// Manifest is JSON-shaped inside `export const apiAreas: ApiArea[] = [...]`.
const json = manifest.slice(manifest.indexOf("= [") + 2, manifest.lastIndexOf("]") + 1);
const areas = JSON.parse(json);
const entries = new Map(areas.map((a) => [a.id, new Set(a.entries.map((e) => e.id))]));

const missing = [];
let checked = 0;
for (const m of registry.matchAll(/docs:\s*\{\s*areaId:\s*'([^']+)',\s*entryId:\s*'([^']+)'/g)) {
  checked++;
  const [, areaId, entryId] = m;
  if (!entries.get(areaId)?.has(entryId)) missing.push(`${areaId}/${entryId}`);
}

if (missing.length) {
  console.error(`Registry links to missing API docs:\n  ${missing.join("\n  ")}`);
  process.exit(1);
}
console.log(`Registry links OK (${checked} checked).`);
