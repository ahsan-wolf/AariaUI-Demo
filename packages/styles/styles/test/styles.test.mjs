import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
const themes = ["modern", "dark", "classic", "minimal", "corporate"];
const kitFamilies = { gridview: "gv", login: "lg", menu: "mn", treeview: "tv", tabs: "tb", navigation: "nv", validation: "vl" };
const addedFamilies = { modal: "md", repeater: "rp", datalist: "dl" };
const families = { ...kitFamilies, ...addedFamilies };
const read = (p) => readFileSync(join(pkgDir, p), "utf8");
const themeFiles = () =>
  themes.flatMap((t) => [
    ...Object.entries(families).map(([f, p]) => `css/${f}/${p}-${t}.css`),
    `css/bundles/${t}-all.css`,
    `css/bundles/${t}-full.css`,
  ]);

test("every family x theme file exists and is non-empty", () => {
  for (const f of themeFiles()) {
    assert.ok(existsSync(join(pkgDir, f)), `missing ${f}`);
    assert.ok(read(f).trim().length > 100, `empty ${f}`);
  }
  assert.ok(existsSync(join(pkgDir, "js/validation-input-highlight.js")));
});

test("each theme bundle contains every family selector prefix", () => {
  for (const t of themes) {
    const css = read(`css/bundles/${t}-all.css`);
    for (const p of Object.values(kitFamilies)) {
      assert.ok(css.includes(`${p}-${t}`), `${t}-all.css lacks ${p}-${t}`);
    }
  }
});

test("braces are balanced in every css file", () => {
  for (const f of themeFiles()) {
    const css = read(f).replace(/\/\*[\s\S]*?\*\//g, "");
    const open = (css.match(/{/g) ?? []).length;
    const close = (css.match(/}/g) ?? []).length;
    assert.equal(open, close, `unbalanced braces in ${f}`);
  }
});

test("exports map resolves to existing files", () => {
  const ex = pkg.exports;
  const sample = {
    "./bundles/*": "modern-all.css",
    "./gridview/*": "gv-modern.css",
    "./login/*": "lg-dark.css",
    "./menu/*": "mn-classic.css",
    "./treeview/*": "tv-minimal.css",
    "./tabs/*": "tb-corporate.css",
    "./navigation/*": "nv-modern.css",
    "./validation/*": "vl-dark.css",
    "./modal/*": "md-dark.css",
    "./repeater/*": "rp-classic.css",
    "./datalist/*": "dl-minimal.css",
    "./css/*": "bundles/dark-all.css",
    "./js/*": "validation-input-highlight.js",
  };
  for (const [key, star] of Object.entries(sample)) {
    assert.ok(ex[key], `exports lacks ${key}`);
    const target = ex[key].replace("*", star);
    assert.ok(existsSync(join(pkgDir, target)), `${key} -> ${target} missing`);
  }
  for (const [key, target] of Object.entries(ex)) {
    if (!key.includes("*")) assert.ok(existsSync(join(pkgDir, target)), `${key} -> ${target} missing`);
  }
});

test("build emits dist copies and minified css", () => {
  for (const f of ["css/bundles/modern-all.css", "css/bundles/modern-all.min.css", "css/gridview/gv-dark.min.css", "js/validation-input-highlight.js"]) {
    assert.ok(existsSync(join(pkgDir, "dist", f)), `dist/${f} missing (run build)`);
  }
  const src = read("css/bundles/modern-all.css");
  const min = read("dist/css/bundles/modern-all.min.css");
  assert.ok(min.length < src.length);
  assert.ok(!min.includes("/*"));
  assert.equal((min.match(/{/g) ?? []).length, (min.match(/}/g) ?? []).length);
});

test("adapters.css exists, is exported, carries no colours and covers the adapter-specific resets", () => {
  assert.ok(pkg.exports["./adapters.css"], "exports lacks ./adapters.css");
  assert.ok(existsSync(join(pkgDir, pkg.exports["./adapters.css"])));
  const css = read("css/adapters.css").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.equal((css.match(/{/g) ?? []).length, (css.match(/}/g) ?? []).length, "unbalanced braces");
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/, "adapters.css must not set colours (the theme decides)");
  for (const needle of ["aspNetDisabled", "ul.dynamic", ".wf-treeview", "ajax__tab_tab"]) assert.ok(css.includes(needle), `adapters.css lacks ${needle}`);
});
