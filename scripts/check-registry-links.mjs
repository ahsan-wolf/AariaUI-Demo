// Checks the gallery's control registry (src/data/controlsRegistry*.ts):
//   1. every `docs: { areaId, entryId }` link exists in the generated API manifest,
//   2. every control declares an `edition` and a `package`,
//   3. every Pro / Enterprise control names a `featureId`, and that feature's edition in
//      packages/license/src/index.ts (FEATURES) matches the control's `edition`.
// Run: npm run check:links -w aaira-gallery   (after npm run gen:docs when docs changed)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = fs.existsSync(path.join(root, "packages/license/src/index.ts")) ? root : path.resolve(root, "..", "..");
const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");

const registryFiles = ["src/data/controlsRegistry.ts", "src/data/controlsRegistryEditions.ts"].map((f) => read(path.join(root, f)));
const manifest = read(path.join(root, "src/data/apiDocs/manifest.ts"));
const licenseSrc = read(path.join(repo, "packages/license/src/index.ts"));

// --- 1. docs links. Manifest is JSON-shaped inside `export const apiAreas: ApiArea[] = [...]`.
const json = manifest.slice(manifest.indexOf("= [") + 2, manifest.lastIndexOf("]") + 1);
const areas = JSON.parse(json);
const entries = new Map(areas.map((a) => [a.id, new Set(a.entries.map((e) => e.id))]));

const problems = [];
let linksChecked = 0;
for (const src of registryFiles) {
  for (const m of src.matchAll(/docs:\s*\{\s*areaId:\s*'([^']+)',\s*entryId:\s*'([^']+)'/g)) {
    linksChecked++;
    const [, areaId, entryId] = m;
    if (!entries.get(areaId)?.has(entryId)) problems.push(`missing API docs: ${areaId}/${entryId}`);
  }
}

// --- 2 and 3. edition metadata. FEATURES = { "data.gridView": "pro", ... } in the license package.
const featureBlock = licenseSrc.slice(licenseSrc.indexOf("export const FEATURES"), licenseSrc.indexOf("as const satisfies"));
const features = new Map([...featureBlock.matchAll(/"([A-Za-z.]+)":\s*"(free|pro|enterprise)"/g)].map((m) => [m[1], m[2]]));
if (features.size === 0) problems.push("could not read FEATURES from packages/license/src/index.ts");

const EDITIONS = new Set(["free", "pro", "enterprise", "demo"]);
let controls = 0;
const counts = { free: 0, pro: 0, enterprise: 0, demo: 0 };
for (const src of registryFiles) {
  // Top-level entries start with `    id: '<id>',` (4 spaces); nested ids (grid ids in samples) are indented differently or use quotes.
  const parts = src.split(/\n    id: '/).slice(1);
  for (const part of parts) {
    const id = part.slice(0, part.indexOf("'"));
    const block = part.split(/\n  \},?\n/)[0] ?? part;
    controls++;
    const edition = /\n    edition: '(\w+)'/.exec(block)?.[1];
    const pkg = /\n    package: '([^']+)'/.exec(block)?.[1];
    const feature = /\n    featureId: '([^']+)'/.exec(block)?.[1];
    if (!edition || !EDITIONS.has(edition)) { problems.push(`${id}: missing or unknown edition`); continue; }
    counts[edition]++;
    if (!pkg) problems.push(`${id}: missing package`);
    if (edition === "pro" || edition === "enterprise") {
      if (!feature) problems.push(`${id}: ${edition} control without featureId`);
      else if (features.get(feature) !== edition) problems.push(`${id}: edition '${edition}' disagrees with FEATURES['${feature}'] = '${features.get(feature) ?? "(unknown)"}'`);
    } else if (feature) {
      problems.push(`${id}: ${edition} control must not have a featureId ('${feature}')`);
    }
  }
}

if (problems.length) {
  console.error(`Registry problems:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`Registry OK: ${linksChecked} doc links, ${controls} controls (free ${counts.free}, pro ${counts.pro}, enterprise ${counts.enterprise}, demo ${counts.demo}); editions agree with FEATURES.`);
