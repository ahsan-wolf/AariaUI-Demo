import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const themes = ["modern", "dark", "classic", "minimal", "corporate"];
const added = { modal: "md", repeater: "rp", datalist: "dl" };
const all = ["gv", "lg", "mn", "tv", "tb", "nv", "vl", ...Object.values(added)];
const read = (p) => readFileSync(join(pkgDir, p), "utf8");
const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

test("full bundles contain all 10 family prefixes and start with the untouched kit bundle", () => {
  for (const t of themes) {
    const css = read(`css/bundles/${t}-full.css`);
    for (const p of all) assert.ok(css.includes(`${p}-${t}`), `${t}-full.css lacks ${p}-${t}`);
    const kit = read(`css/bundles/${t}-all.css`).replace(/\s*$/, "\n");
    assert.ok(css.startsWith(kit), `${t}-full.css must start with the untouched ${t}-all.css`);
  }
});

test("added families: no other theme's class is used and every selector is scoped to the family class", () => {
  for (const t of themes) {
    for (const [folder, p] of Object.entries(added)) {
      const file = `css/${folder}/${p}-${t}.css`;
      const css = strip(read(file));
      for (const o of themes.filter((x) => x !== t)) for (const q of all) assert.ok(!css.includes(`${q}-${o}`), `${file} mentions ${q}-${o}`);
      // drop @keyframes blocks and unwrap @media, then check each selector
      const flat = css.replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "").replace(/@media[^{]*\{([\s\S]*)\}\s*$/, "$1");
      let n = 0;
      for (const m of flat.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
        for (const sel of m[1].split(",")) {
          n++;
          assert.ok(sel.includes(`.${p}-${t}`), `${file}: unscoped selector "${sel.trim()}"`);
        }
      }
      assert.ok(n > 10, `${file} has too few rules`);
    }
  }
});

test("modal family styles the documented markup contract", () => {
  const css = read("css/modal/md-modern.css");
  for (const needle of ["position:fixed", "inset:0", "--wf-backdrop", ".modal-content", ".modal-header", ".modal-title", ".btn-close", ".modal-body", ".modal-footer", ".btn-primary", "prefers-reduced-motion"]) {
    assert.ok(css.includes(needle), `md-modern.css lacks ${needle}`);
  }
});

test("repeater and datalist families style the documented markup contract", () => {
  const rp = read("css/repeater/rp-dark.css");
  for (const needle of [".wf-item.alt", ".wf-item.active", ".wf-item.edit", ".wf-item-header", ".empty", ".add"]) assert.ok(rp.includes(needle), `rp-dark.css lacks ${needle}`);
  const dl = read("css/datalist/dl-classic.css");
  for (const needle of [".datalist-item", ".datalist-cell", ".datalist-cell-empty", ".selected", ".edit", ".header", ".footer", ".separator", ".empty"]) assert.ok(dl.includes(needle), `dl-classic.css lacks ${needle}`);
});

test("edit-state form controls also match a bare <input> (no type attribute) and the grid edit family exists", async () => {
  const { readFileSync, existsSync } = await import("node:fs");
  const { join, dirname, resolve } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "css");
  for (const t of ["modern", "dark", "classic", "minimal", "corporate"]) {
    const edit = join(root, "gridview", `gv-${t}-edit.css`);
    assert.ok(existsSync(edit), `missing gv-${t}-edit.css`);
    for (const f of [edit, join(root, "repeater", `rp-${t}.css`), join(root, "datalist", `dl-${t}.css`), join(root, "modal", `md-${t}.css`)]) {
      assert.match(readFileSync(f, "utf8"), /input:not\(\[type\]\)/, `${f} does not style untyped inputs`);
    }
    assert.match(readFileSync(join(root, "bundles", `${t}-full.css`), "utf8"), new RegExp(`table\.gv-${t} tr\.edit select`), `${t}-full.css lacks the grid edit controls`);
    assert.match(readFileSync(join(root, "datalist", `dl-${t}.css`), "utf8"), /\.datalist-cell\{[^}]*border:0;border-bottom/, "datalist cells must reset the UA table[border] cell border");
  }
});
