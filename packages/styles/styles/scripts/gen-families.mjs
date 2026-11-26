// Generates the ADDED families (modal md-, repeater rp-, datalist dl-) for every theme from one token table.
// The kit's own sheets (gridview, login, ...) are verbatim and never touched. Output is committed:
//   node scripts/gen-families.mjs   (npm run gen)
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Palette/typography copied from the kit's lg-<t>.css and gv-<t>.css.
const T = {
  modern: {
    font: '14px/1.45 "Segoe UI",system-ui,sans-serif', bg: "#ffffff", fg: "#1f2937", muted: "#6b7280", border: "#e5e7eb", line: "#f3f4f6",
    r: "8px", rc: "10px", shadow: "0 10px 30px rgba(0,0,0,.18)", cardShadow: "0 2px 8px rgba(0,0,0,.06)", accent: "#2563eb", accentFg: "#ffffff",
    inBg: "#ffffff", inBorder: "#cbd5e1", inR: "6px", inFg: "#1f2937", focus: "#2563eb33", danger: "#dc2626",
    headBg: "#f9fafb", headFg: "#1f2937", headBorder: "1px solid #e5e7eb", headExtra: "", zebra: "#f9fafb", hover: "#f0f7ff", selected: "#dbeafe", edit: "#fefce8",
    secBg: "#ffffff", secFg: "#374151", secBorder: "#cbd5e1", footBg: "#f9fafb", closeFg: "#6b7280", closeHover: "#1f2937", fs: "14px", label: "12px",
  },
  dark: {
    font: '14px/1.45 "Segoe UI",system-ui,sans-serif', bg: "#111827", fg: "#e5e7eb", muted: "#9ca3af", border: "#374151", line: "#1f2937",
    r: "6px", rc: "6px", shadow: "0 10px 30px rgba(0,0,0,.6)", cardShadow: "0 4px 14px rgba(0,0,0,.5)", accent: "#6366f1", accentFg: "#ffffff",
    inBg: "#0b1220", inBorder: "#374151", inR: "4px", inFg: "#e5e7eb", focus: "#6366f133", danger: "#f87171",
    headBg: "#1f2937", headFg: "#f9fafb", headBorder: "2px solid #6366f1", headExtra: "", zebra: "#161e2e", hover: "#243049", selected: "#312e81", edit: "#3b2f10",
    secBg: "#1f2937", secFg: "#e5e7eb", secBorder: "#374151", footBg: "#1f2937", closeFg: "#9ca3af", closeHover: "#f9fafb", fs: "14px", label: "12px",
  },
  classic: {
    font: "13px/1.45 Verdana,Arial,sans-serif", bg: "#ffffff", fg: "#333333", muted: "#666666", border: "#7a96b5", line: "#c5d3e3",
    r: "0", rc: "0", shadow: "3px 3px 10px rgba(0,0,0,.35)", cardShadow: "none", accent: "#3d6ca5", accentFg: "#ffffff",
    inBg: "#ffffff", inBorder: "#7a96b5", inR: "0", inFg: "#333333", focus: "#3d6ca533", danger: "#cc0000",
    headBg: "linear-gradient(#5b8bc5,#3d6ca5)", headFg: "#ffffff", headBorder: "1px solid #2f5a8f", headExtra: "", zebra: "#eef3f9", hover: "#fff4c2", selected: "#ffe9a8", edit: "#ffffe0",
    secBg: "#d9e4f1", secFg: "#333333", secBorder: "#7a96b5", footBg: "#d9e4f1", closeFg: "#ffffff", closeHover: "#ffe9a8", fs: "13px", label: "12px",
  },
  minimal: {
    font: '14px/1.45 "Helvetica Neue",Arial,sans-serif', bg: "#ffffff", fg: "#222222", muted: "#888888", border: "#dddddd", line: "#eeeeee",
    r: "0", rc: "0", shadow: "0 8px 24px rgba(0,0,0,.16)", cardShadow: "none", accent: "#111111", accentFg: "#ffffff",
    inBg: "#ffffff", inBorder: "#bbbbbb", inR: "0", inFg: "#222222", focus: "#11111133", danger: "#c62828",
    headBg: "transparent", headFg: "#222222", headBorder: "2px solid #222222", headExtra: "", zebra: "#fafafa", hover: "#fafafa", selected: "#f3f3f3", edit: "#f7f7f2",
    secBg: "#ffffff", secFg: "#222222", secBorder: "#bbbbbb", footBg: "#ffffff", closeFg: "#888888", closeHover: "#111111", fs: "14px", label: "12px",
  },
  corporate: {
    font: '12px/1.45 "Segoe UI",Tahoma,sans-serif', bg: "#ffffff", fg: "#263238", muted: "#607d8b", border: "#cfd8dc", line: "#eceff1",
    r: "2px", rc: "2px", shadow: "0 6px 20px rgba(38,50,56,.28)", cardShadow: "none", accent: "#00796b", accentFg: "#ffffff",
    inBg: "#ffffff", inBorder: "#b0bec5", inR: "2px", inFg: "#263238", focus: "#00796b33", danger: "#c62828",
    headBg: "#263238", headFg: "#eceff1", headBorder: "0", headExtra: "", zebra: "#f5f7f8", hover: "#e0f2f1", selected: "#b2dfdb", edit: "#fff8e1",
    secBg: "#eceff1", secFg: "#263238", secBorder: "#b0bec5", footBg: "#eceff1", closeFg: "#b0bec5", closeHover: "#ffffff", fs: "12px", label: "12px",
  },
};

// A bare <input> (no type attribute) is a text box too: edit templates are often written that way.
const INPUTS = (s, extra = "") => [...["text", "password", "email", "number", "date"].map((t) => `${s} input[type=${t}]${extra}`), `${s} input:not([type])${extra}`].join(",");

/** Form-control look shared by all three families (lg-<t> input look + gv-<t> tr.edit focus ring). */
function controls(s, t, pad = "8px 10px", gap = "") {
  const fields = [INPUTS(s), `${s} select`, `${s} textarea`].join(",");
  const focus = [INPUTS(s, ":focus"), `${s} select:focus`, `${s} textarea:focus`].join(",");
  return [
    `${fields}{box-sizing:border-box;width:100%;min-width:110px;padding:${pad};border:1px solid ${t.inBorder};border-radius:${t.inR};background:${t.inBg};color:${t.inFg};font:inherit${gap}}`,
    `${s} textarea{min-height:72px;resize:vertical}`,
    `${focus}{outline:0;border-color:${t.accent};box-shadow:0 0 0 3px ${t.focus}}`,
    `${s} input[type=checkbox],${s} input[type=radio]{accent-color:${t.accent};margin-right:6px;vertical-align:middle}`,
    `${s} label{color:${t.muted};font-weight:600;font-size:${t.label}}`,
    `${s} input.invalid,${s} input.is-invalid{border-color:${t.danger}!important}`,
  ].join("\n");
}

function btn(sel, t, kind, pad) {
  const base = `${sel}{border-radius:${t.r};padding:${pad};font:inherit;font-weight:600;cursor:pointer;`;
  const look = kind === "primary"
    ? `background:${t.accent};color:${t.accentFg};border:1px solid ${t.accent}}`
    : `background:${t.secBg};color:${t.secFg};border:1px solid ${t.secBorder}}`;
  return base + look;
}

function modal(n, t) {
  const s = `.md-${n}`;
  return `/* md-${n} : popup dialog (WebFormsModal / ModalBehavior). Added family, same palette as lg-${n}/gv-${n}.
   <div class="modal fade show d-block md-${n}" role="dialog" aria-modal="true"> > .modal-dialog > .modal-content
   > .modal-header (h5.modal-title, button.btn-close) + .modal-body + .modal-footer (button.btn.btn-secondary, button.btn.btn-primary)
   Backdrop colour: override --wf-backdrop on the adapter (the adapter sets it inline) or use background-color:...!important here. */
${s}{position:fixed;inset:0;z-index:1050;display:flex!important;align-items:center;justify-content:center;box-sizing:border-box;padding:16px;overflow:auto;background-color:var(--wf-backdrop,rgba(0,0,0,.5));font:${t.font};color:${t.fg};animation:md-${n}-fade .15s ease-out}
${s} .modal-dialog{box-sizing:border-box;width:100%;max-width:500px;margin:0;animation:md-${n}-in .18s ease-out}
${s} .modal-content{display:flex;flex-direction:column;max-height:calc(100vh - 32px);background:${t.bg};color:${t.fg};border:1px solid ${t.border};border-radius:${t.rc};box-shadow:${t.shadow};overflow:hidden}
${s} .modal-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;background:${t.headBg};color:${t.headFg};border-bottom:${t.headBorder}}
${s} .modal-title{margin:0;font-size:18px;font-weight:700;line-height:1.3;color:inherit}
${s} .btn-close{position:relative;width:28px;height:28px;padding:0;border:0;border-radius:${t.r};background:transparent;color:${t.closeFg};font:inherit;font-size:0;cursor:pointer;flex:none}
${s} .btn-close::before{content:"\\00d7";font-size:24px;line-height:28px;display:block;text-align:center}
${s} .btn-close:hover,${s} .btn-close:focus-visible{color:${t.closeHover};outline:0}
${s} .btn-close:focus-visible{box-shadow:0 0 0 3px ${t.focus}}
${s} .modal-body{padding:20px;overflow:auto;font-size:${t.fs};color:${t.fg}}
${s} .modal-body p{margin:0 0 10px}
${s} .modal-body p:last-child{margin-bottom:0}
${controls(s + " .modal-body", t)}
${s} .modal-body a{color:${t.accent};text-decoration:none}
${s} .modal-body a:hover{text-decoration:underline}
${s} .modal-footer{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:12px 20px;background:${t.footBg};border-top:1px solid ${t.border}}
${btn(`${s} .btn`, t, "secondary", "8px 20px")}
${btn(`${s} .btn-primary`, t, "primary", "8px 20px")}
${s} .btn:hover{filter:brightness(1.08)}
${s} .btn:focus-visible{outline:0;box-shadow:0 0 0 3px ${t.focus}}
${s} .btn:disabled{opacity:.55;cursor:not-allowed;filter:none}
@keyframes md-${n}-fade{from{opacity:0}to{opacity:1}}
@keyframes md-${n}-in{from{opacity:0;transform:translateY(-12px) scale(.98)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){${s},${s} .modal-dialog{animation:none}}
`;
}

/** Buttons + edit-state form controls shared by repeater and datalist. */
function editBits(root, editSel, hdrSel, t) {
  const btns = `${root} button`;
  const primary = [
    `${root} button.add`, `${root} button.save`, `${root} button.primary`, `${root} button[type=submit]`,
    `${root} button[data-command=Update]`, `${root} button[data-command=Save]`, `${root} button[data-command=Insert]`,
    `${editSel}>button:first-of-type`, `${editSel}>*:not(${hdrSel}) button:first-of-type`,
  ];
  return [
    controls(editSel, t, "6px 10px", ";margin:2px 0 8px"),
    btn(btns, t, "secondary", "6px 14px"),
    `${btns}:hover{filter:brightness(1.08)}`,
    `${btns}:focus-visible{outline:0;box-shadow:0 0 0 3px ${t.focus}}`,
    `${btns}:disabled{opacity:.55;cursor:not-allowed;filter:none}`,
    btn(primary.join(","), t, "primary", "6px 14px"),
    `${root} button.delete,${root} button[data-command=Delete]{color:${t.danger}}`,
  ].join("\n");
}

function repeater(n, t) {
  const s = `.rp-${n}`;
  const item = `${s} .wf-item`;
  return `/* rp-${n} : Repeater (WebFormsRepeater). Added family, same palette as gv-${n}/lg-${n}.
   <div class="wf-repeater rp-${n}"> button.add, .wf-item (.alt odd, .active current, .edit edit template) > header.wf-item-header, .empty */
div${s}{box-sizing:border-box;display:flex;flex-direction:column;gap:8px;font:${t.font};color:${t.fg}}
${s} .wf-item{box-sizing:border-box;padding:12px 16px;background:${t.bg};color:${t.fg};border:1px solid ${t.border};border-radius:${t.rc};box-shadow:${t.cardShadow};font-size:${t.fs}}
${s} .wf-item.alt{background:${t.zebra}}
${s} .wf-item:hover{background:${t.hover}}
${s} .wf-item.active{background:${t.selected};border-color:${t.accent}}
${s} .wf-item.edit{background:${t.edit}}
${s} .wf-item-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid ${t.line};font-weight:700;color:${t.fg}}
${s} .add{align-self:flex-start}
${s} .empty{padding:28px;text-align:center;color:${t.muted}}
${s} a{color:${t.accent};text-decoration:none}
${s} a:hover{text-decoration:underline}
${editBits(s, `${item}.edit`, `${s} .wf-item-header`, t)}
`;
}

function datalist(n, t) {
  const s = `.dl-${n}`;
  const cell = `${s} .datalist-cell`;
  return `/* dl-${n} : DataList (WebFormsDataList). Added family, same palette as gv-${n}/lg-${n}.
   Flow:  <div class="wf-datalist dl-${n}"> div.datalist-item (+ .alt .selected .edit, header/footer/separator)
   Table: <table class="datalist-table wf-datalist dl-${n}"> td.datalist-cell (+ same classes), td.datalist-cell-empty;  empty: p.empty */
div${s}{box-sizing:border-box;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;font:${t.font};color:${t.fg}}
div${s} .datalist-item{box-sizing:border-box;padding:12px 16px;background:${t.bg};color:${t.fg};border:1px solid ${t.border};border-radius:${t.rc};box-shadow:${t.cardShadow};font-size:${t.fs}}
div${s} .datalist-item.alt,div${s} .datalist-alternatingItem{background:${t.zebra}}
div${s} .datalist-item:hover{background:${t.hover}}
div${s} .datalist-item.selected,div${s} .datalist-selectedItem{background:${t.selected};border-color:${t.accent}}
div${s} .datalist-item.edit,div${s} .datalist-editItem{background:${t.edit}}
div${s} .datalist-item.header,div${s} .datalist-item.footer{grid-column:1/-1;background:${t.headBg};color:${t.headFg};border:1px solid ${t.border};border-bottom:${t.headBorder==='0'?'1px solid '+t.border:t.headBorder};font-weight:700}
div${s} .datalist-item.separator{grid-column:1/-1;padding:0;height:0;border:0;border-top:1px solid ${t.line};background:transparent;box-shadow:none}
table${s}{width:100%;border-collapse:separate;border-spacing:0;font:${t.font};color:${t.fg};font-size:${t.fs};border:1px solid ${t.border};border-radius:${t.rc};background:${t.bg}}
${cell}{padding:12px 16px;vertical-align:top;border:0;border-bottom:1px solid ${t.line};background:${t.bg};color:${t.fg}}
${cell}.alt,${cell}.datalist-alternatingItem{background:${t.zebra}}
${cell}:hover{background:${t.hover}}
${cell}.selected,${cell}.datalist-selectedItem{background:${t.selected}}
${cell}.edit,${cell}.datalist-editItem{background:${t.edit}}
${cell}.header,${cell}.datalist-header,${cell}.footer,${cell}.datalist-footer{background:${t.headBg};color:${t.headFg};font-weight:700;border-bottom:${t.headBorder}}
${cell}.separator,${cell}.datalist-separator{padding:0;height:0;border-bottom:1px solid ${t.line}}
${cell}-empty{padding:28px;text-align:center;color:${t.muted}}
${s} .empty{padding:28px;text-align:center;color:${t.muted}}
${s} a{color:${t.accent};text-decoration:none}
${s} a:hover{text-decoration:underline}
${editBits(s, `${s}.wf-datalist .edit`, `${s} .header`, t)}
`;
}

/** GridView edit / insert rows: the kit's gv-<t> only styles `tr.edit input[type=text|date]`; custom edit templates also use
 *  select, textarea, number/email inputs, checkboxes, labels and buttons (the kit styles anchors `a.btn-link`, not buttons). */
function gridEdit(n, t) {
  const s = `table.gv-${n}`;
  const edit = `${s} tr.edit`;
  const foot = `${s} tr.footer`;
  const btnSel = `${edit} button,${foot} button`;
  const primary = [`${edit} button.save`, `${edit} button.primary`, `${edit} button[type=submit]`, `${edit} button[data-command=Update]`,
    `${foot} button.add`, `${foot} button.primary`, `${foot} button[type=submit]`, `${foot} button[data-command=Insert]`,
    `${edit} td>button:first-of-type`, `${edit} td>*:not(label) button:first-of-type`];
  return `/* gv-${n}-edit : GridView inline edit / insert rows (adds to gv-${n}; the kit's gv-${n}.css is untouched). Added family, same palette.
   <table class="gv-${n}"> tr.edit (editTemplate / in-place edit) and tr.footer (insert row): inputs, select, textarea, checkbox, label, button */
${controls(edit, t, "6px 10px", ";margin:2px 0")}
${controls(foot, t, "6px 10px", ";margin:2px 0")}
${edit} td[colspan] label{display:block;margin:0 0 10px}
${edit} td[colspan]{padding:14px 16px}
${btn(btnSel, t, "secondary", "6px 14px")}
${btnSel.split(",").map((x) => x + ":hover").join(",")}{filter:brightness(1.08)}
${btnSel.split(",").map((x) => x + ":focus-visible").join(",")}{outline:0;box-shadow:0 0 0 3px ${t.focus}}
${btnSel.split(",").map((x) => x + ":disabled").join(",")}{opacity:.55;cursor:not-allowed;filter:none}
${btn(primary.join(","), t, "primary", "6px 14px")}
${edit} button+button{margin-left:6px}
${edit} button.delete,${edit} button[data-command=Delete]{color:${t.danger}}
`;
}

const fams = [["modal", "md", modal, ""], ["repeater", "rp", repeater, ""], ["datalist", "dl", datalist, ""], ["gridview", "gv", gridEdit, "-edit"]];
for (const [folder, p, fn, suffix] of fams) {
  mkdirSync(join(pkg, "css", folder), { recursive: true });
  for (const [n, t] of Object.entries(T)) writeFileSync(join(pkg, "css", folder, `${p}-${n}${suffix}.css`), fn(n, t));
}
console.log("generated modal/repeater/datalist/gridview-edit families for", Object.keys(T).join(", "));
