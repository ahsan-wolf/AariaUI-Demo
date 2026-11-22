// Generates css/bundles/<theme>-full.css = the kit's <theme>-all.css (untouched) + modal + repeater + datalist for that theme.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const themes = ["modern", "dark", "classic", "minimal", "corporate"];
const extra = [["gridview", "gv", "-edit"], ["modal", "md"], ["repeater", "rp"], ["datalist", "dl"]];
const read = (p) => readFileSync(join(pkg, "css", p), "utf8");

for (const t of themes) {
  const parts = [read(`bundles/${t}-all.css`).replace(/\s*$/, "\n")];
  for (const [f, p, suffix = ""] of extra) parts.push(read(`${f}/${p}-${t}${suffix}.css`).replace(/\s*$/, "\n"));
  writeFileSync(join(pkg, "css", "bundles", `${t}-full.css`), parts.join("\n"));
}
console.log(`@wf-controls/styles: wrote ${themes.length} *-full.css bundles`);
