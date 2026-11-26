# @wf-controls/styles

Framework-neutral CSS themes for the WebForms-TS controls. Five themes (**modern, dark, classic, minimal, corporate**) for ten control families (seven from the CSS kit, three added: Modal, Repeater, DataList). The sheets are plain CSS, so they work from a plain HTML `<link>`, React and Angular alike. Nothing here depends on `@wf-controls/core`.

The seven kit families are a verbatim copy of the ASP.NET UI CSS kit in `docs/StyleSheets/` (the kit's own sheets and `<theme>-all.css` bundles stay verbatim and are never edited). Modal, Repeater and DataList are added families written in the same palette and typography. It was written against classic ASP.NET Web Forms markup (see the contract below), so the adapter markup must produce the same element structure and class names.

## Install

```bash
npm install @wf-controls/styles
```

## Use

Each theme has two bundles: `bundles/<theme>-all.css` (the seven kit families, verbatim) and `bundles/<theme>-full.css` (kit + Modal + Repeater + DataList, all 10 families), plus one file per family (`<family>/<prefix>-<theme>.css`). Every rule is scoped to a class such as `gv-modern`, so you can load several themes on one page.

### Plain HTML

```html
<link rel="stylesheet" href="node_modules/@wf-controls/styles/css/bundles/modern-all.css" />
<!-- or minified: node_modules/@wf-controls/styles/dist/css/bundles/modern-all.min.css -->
<!-- or one family only: .../css/gridview/gv-modern.css -->
```

### React (Vite, webpack, Next)

```ts
import "@wf-controls/styles/bundles/modern-all.css";
// one family: import "@wf-controls/styles/gridview/gv-dark.css";
```

```tsx
<table className="gv-modern">...</table>
```

### Angular

In `angular.json`:

```json
"styles": ["node_modules/@wf-controls/styles/css/bundles/modern-all.css", "src/styles.css"]
```

or in `src/styles.css`:

```css
@import "@wf-controls/styles/css/bundles/modern-all.css";
```

### adapters.css (React and Angular: load it after the theme)

The kit's sheets were written for the tables and anchors ASP.NET renders. The `@wf-controls/react` and `@wf-controls/angular` adapters emit the same class names on lists and buttons, so a few browser defaults need resetting: tree bullets and toggle buttons, tab buttons, absolutely positioned menu flyouts, and a disabled pager link (the kit paints every `.pager span` as the current page). `adapters.css` does exactly that, carries no colours, fonts or sizes, and keeps every rule at low specificity so a theme always wins.

```ts
import "@wf-controls/styles/bundles/modern-all.css";
import "@wf-controls/styles/adapters.css";   // after the theme
```

Plain HTML that writes its own markup to the contract below does not need it.

### Switching theme

Load the bundle of the theme(s) you need, then change the one class on the control root: `gv-modern` becomes `gv-dark`, `mn-modern` becomes `mn-dark`, and so on. To switch the whole page at runtime, load all bundles you want to offer and swap the class names (or swap the `<link href>`, but then the class suffix must still match the loaded theme).

### Exports

| Import path | File |
| :--- | :--- |
| `@wf-controls/styles/bundles/<theme>-all.css` | `css/bundles/<theme>-all.css` (kit families only) |
| `@wf-controls/styles/bundles/<theme>-full.css` | `css/bundles/<theme>-full.css` (kit + modal + repeater + datalist) |
| `@wf-controls/styles/<family>/<prefix>-<theme>.css` | `css/<family>/<prefix>-<theme>.css` (families below) |
| `@wf-controls/styles/css/...`, `/dist/...`, `/js/...` | the same folders by path (`dist/` has the `.min.css` copies) |
| `@wf-controls/styles/adapters.css` | `css/adapters.css` (structural glue for the React and Angular adapters) |
| `@wf-controls/styles/validation-input-highlight.js` | `js/validation-input-highlight.js` |

## Families

| Folder | Prefix | Controls |
| :--- | :--- | :--- |
| `gridview/` | `gv-` | GridView and plain tables (inline edit, insert row, pager, empty state) |
| `login/` | `lg-` | Login, CreateUserWizard, ChangePassword, PasswordRecovery, LoginStatus, LoginName |
| `menu/` | `mn-` | Menu (horizontal, or vertical with `mn-vertical`) |
| `treeview/` | `tv-` | TreeView |
| `tabs/` | `tb-` | TabContainer (`ajax__tab_*`) or Menu + panel tab strip |
| `navigation/` | `nv-` | SiteMapPath / Breadcrumb, DataPager (`nv-<theme>-pager`), link list (`nv-<theme>-list`) |
| `validation/` | `vl-` | Validators and ValidationSummary |
| `modal/` | `md-` | Popup dialog (WebFormsModal / ModalBehavior), added |
| `repeater/` | `rp-` | Repeater cards, incl. edit template form controls, added |
| `datalist/` | `dl-` | DataList (flow tiles or table cells), incl. edit template, added |
| `bundles/` | | `<theme>-all.css`: the seven kit families; `<theme>-full.css`: all ten |

**Covered by the added families (not part of the kit):** Modal (`md-`), Repeater (`rp-`) and DataList (`dl-`). **Still not covered:** Calendar, Accordion and AdRotator. Style them yourself.

Below, `<t>` is the theme name (`modern`, `dark`, `classic`, `minimal`, `corporate`).

## Markup contract

### GridView (`gv-<t>`)

```html
<table class="gv-<t>">
  <tr><th><a>Name</a></th><th>Dept</th></tr>              <!-- header: th (links inside th are restyled) -->
  <tr><td>..</td><td><a class="btn-link">Edit</a> <a class="btn-link text-danger">Delete</a></td></tr>
  <tr class="selected"><td>..</td></tr>                    <!-- selected row -->
  <tr class="edit"><td><input type="text" /></td></tr>     <!-- inline edit row; inputs are styled; add class "invalid" to flag one -->
  <tr class="footer"><td><input type="text" /></td></tr>   <!-- insert row / footer -->
  <tr class="pager"><td colspan="n"><table><tr><td><span>1</span></td><td><a>2</a></td></tr></table></td></tr>
  <tr class="empty"><td colspan="n">No records found.</td></tr>
</table>
```

Notes: the pager is a nested table inside a `td` (the current page is a `span`, other pages are `a`). Row hover and the zebra-free look come from `td` rules, so alternating rows need no class unless you add your own colour. Action links use `a.btn-link` (`text-danger` for destructive). Use `border`-less tables (the sheets override inline borders with `!important`).

### Login family (`lg-<t>`)

```html
<table class="lg-<t>">               <!-- Login, CreateUserWizard, ChangePassword, PasswordRecovery -->
  <tr><td>
    <table>
      <tr><td colspan="2" class="title">Log In</td></tr>
      <tr><td><label>User Name:</label></td><td><input type="text" /><span id="..Required">*</span></td></tr>
      <tr><td><label>Password:</label></td><td><input type="password" /></td></tr>
      <tr><td colspan="2"><input type="checkbox" /> Remember me</td></tr>
      <tr><td colspan="2"><span class="failure">Invalid login.</span></td></tr>   <!-- or td style="color:Red" / span[id$=FailureText] -->
      <tr><td colspan="2"><input type="submit" value="Log In" /></td></tr>
    </table>
  </td></tr>
</table>
<a class="lg-<t>">Login</a>          <!-- LoginStatus link, rendered as an outlined button -->
<span class="lg-<t>">Welcome, Ada</span>   <!-- LoginName -->
```

Helper classes: `.title`, `.failure`, `.help`, `.instruction`. A span whose id ends in `Required` is coloured as an error.

### Menu (`mn-<t>`)

```html
<div class="mn-<t>">                       <!-- vertical: class="mn-<t> mn-vertical" -->
  <ul class="static">
    <li><a class="selected">Home</a></li>                   <!-- .selected or .active = current item -->
    <li><a class="has-popup">Products</a>                   <!-- .has-popup adds the dropdown arrow -->
      <ul class="dynamic"><li><a>Hardware</a></li></ul>     <!-- fly-out sub menu -->
    </li>
  </ul>
</div>
```

The sheet only sets appearance. Showing, hiding and positioning of `ul.dynamic` (hover or click) is the adapter's job.

### TreeView (`tv-<t>`)

```html
<div class="tv-<t>">
  <table><tr><td><img /> <a class="root">Root</a></td></tr></table>     <!-- a.root / a.parent / a.leaf / a.selected -->
  <div id="tree1Nodes">                                                 <!-- children container: any id ending in "Nodes" -->
    <table><tr><td><input type="checkbox" /> <a class="leaf selected">Leaf</a></td></tr></table>
  </div>
</div>
```

Node structure is nested tables (ASP.NET default). The sheet uses `:has()` (Chrome and Edge 105+, Firefox 121+, Safari 15.4+). `+`/`-` glyphs are `img` elements. A child container's left rule and indent come from `div[id$="Nodes"]`.

### Tabs (`tb-<t>`)

```html
<!-- (a) AjaxControlToolkit style -->
<div class="tb-<t>">
  <div class="ajax__tab_header">
    <span class="ajax__tab_outer"><span class="ajax__tab_inner"><span class="ajax__tab_tab">One</span></span></span>
    <!-- active tab: wrap in an element with class ajax__tab_active -->
  </div>
  <div class="ajax__tab_body">content</div>
</div>

<!-- (b) Menu + panel strip -->
<div class="tb-<t>">
  <ul class="static"><li><a class="static selected">One</a></li><li><a class="static">Two</a></li></ul>
</div>
<div class="tb-<t>-panel">panel content</div>
```

### Navigation (`nv-<t>`)

```html
<span class="nv-<t>">                       <!-- SiteMapPath / Breadcrumb -->
  <a>Home</a><span class="sep"> </span><a>Products</a><span class="sep"> </span><span class="current">Phones</span>
</span>

<span class="nv-<t>-pager">                 <!-- DataPager -->
  <a>1</a><span class="current">2</span><a>3</a><input type="submit" value="Next" />
  <!-- disabled controls: class "aspNetDisabled" -->
</span>

<ul class="nv-<t>-list">                    <!-- side navigation / Repeater link list -->
  <li><a class="active">Dashboard</a></li>  <!-- .active or [aria-current] = current -->
  <li><a>Reports</a></li>
</ul>
```

The breadcrumb separator glyph is drawn by CSS on `.sep` (its own text is hidden), so the separator element may be empty or contain a space.

### Validation (`vl-<t>`)

```html
<span class="vl-<t>">Required</span>        <!-- inline validator message: red, with a warning glyph -->
<div class="vl-<t>"><ul><li>Name is required</li></ul></div>   <!-- ValidationSummary box -->
<input class="is-invalid" />                <!-- also select.is-invalid, textarea.is-invalid: red border and tint -->
```

`is-invalid` is theme independent (it is not prefixed). `js/validation-input-highlight.js` adds and removes it automatically, but it hooks the ASP.NET `WebUIValidation` globals (`ValidatorUpdateDisplay`, `Page_Validators`), so it is only useful on real ASP.NET pages. In React/Angular toggle `is-invalid` yourself from the controller's validation state.

### Modal (`md-<t>`, added)

```html
<div class="modal fade show d-block md-<t>" role="dialog" aria-modal="true">   <!-- full-viewport overlay (position:fixed; inset:0; flex centring) -->
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content shadow">
      <div class="modal-header"><h5 class="modal-title">Title</h5><button class="btn-close" aria-label="Close"></button></div>
      <div class="modal-body">... inputs, selects, textareas, checkboxes are styled like the login inputs ...</div>
      <div class="modal-footer"><button class="btn btn-secondary">Cancel</button><button class="btn btn-primary">OK</button></div>
    </div>
  </div>
</div>
```

The close glyph is drawn by CSS (`::before`), so the button stays empty. The primary button uses the theme accent (like the login submit button), the secondary one is neutral. The dialog fades and slides in (disabled under `prefers-reduced-motion`). Focus trapping, Escape and backdrop dismissal belong to the adapter.

**Backdrop colour:** the adapter sets `background-color: var(--wf-backdrop, rgba(0,0,0,.5))` inline. Set the CSS variable (`.md-dark { --wf-backdrop: rgba(0,0,0,.75) }`, or on `:root`), or override with `background-color: ... !important`.

### Repeater (`rp-<t>`, added)

```html
<div class="wf-repeater rp-<t>">
  <button class="add">Add item</button>                              <!-- primary-looking -->
  <div class="wf-item">                                             <!-- card; odd items also get .alt (zebra) -->
    <header class="wf-item-header"><span>Item 1</span><button>Delete</button></header>
    ...
  </div>
  <div class="wf-item alt active">...</div>                         <!-- .active = current item (like tr.selected) -->
  <div class="wf-item edit">                                        <!-- item shown through its edit template (like tr.edit) -->
    <input type="text" /> <select></select> <textarea></textarea>
    <button>Save</button> <button>Cancel</button>
  </div>
  <div class="empty">No items.</div>
</div>
```

### DataList (`dl-<t>`, added)

```html
<!-- Flow layout: a responsive tile grid -->
<div class="wf-datalist dl-<t>">
  <div class="datalist-item header">Header</div>
  <div class="datalist-item">..</div>
  <div class="datalist-item datalist-alternatingItem alt">..</div>
  <div class="datalist-item datalist-selectedItem selected">..</div>
  <div class="datalist-item datalist-editItem edit"><input type="text" /> <button>Save</button> <button>Cancel</button></div>
  <div class="datalist-item separator"></div>
  <div class="datalist-item footer">Footer</div>
</div>
<!-- Table layout -->
<table class="datalist-table wf-datalist dl-<t>">
  <tr><td class="datalist-cell datalist-item">..</td><td class="datalist-cell datalist-alternatingItem alt">..</td></tr>
  <tr><td class="datalist-cell-empty">No items.</td></tr>
</table>
<p class="empty">No items.</p>
```

### Theming the edit templates (Repeater and DataList)

Inside `.wf-item.edit` (Repeater) and `.edit` (DataList) the families style `input[type=text|password|email|number|date]`, `select`, `textarea`, checkboxes, `label` and `button` in the kit's idiom (the input and focus-ring rules of `gv-<t>` `tr.edit` and the button look of `lg-<t>`). Buttons are neutral by default. A button is primary-looking (theme accent) when it is `.add`, `.save`, `.primary`, `[type=submit]`, `[data-command=Update|Save|Insert]`, or the first button of an edit item (outside the item header). `.delete` / `[data-command=Delete]` gets the danger colour. Add `invalid` or `is-invalid` to an input to flag it.

## Controller options to CSS classes

The controller option names below take a space-separated class string. To make the kit work, set them to these values (the table class carries the theme).

| Controller option | Value for the kit | Used by selector |
| :--- | :--- | :--- |
| `cssClass` / `tableCssClass` (GridView) | `gv-<t>` | `table.gv-<t>` |
| `headerCssClass` | none needed (plain `th`); any extra class is harmless | `table.gv-<t> th` |
| `rowCssClass`, `alternatingRowCssClass` | none needed (plain `td`); add your own class for zebra striping | `table.gv-<t> td` |
| `selectedRowCssClass` | `selected` | `tr.selected` |
| `editRowCssClass` | `edit` | `tr.edit` |
| `footerCssClass` | `footer` | `tr.footer` |
| `pagerCssClass` | `pager` | `tr.pager`, `.pager a`, `.pager span` |
| empty data row (`emptyDataText` renders the text) | row or cell class `empty` | `.empty` |
| `cssClass` (Menu / NavigationMenu) | `mn-<t>` (add `mn-vertical` for vertical) | `div.mn-<t>` |
| `cssClass` (TreeView) | `tv-<t>` | `div.tv-<t>`; node classes `root` / `parent` / `leaf` / `selected` |
| `cssClass` (Tabs) | `tb-<t>` | `.tb-<t>` |
| `cssClass` (Breadcrumb / SiteMapPath) | `nv-<t>` | `span.nv-<t>`; separator `sep`, current node `current` |
| `cssClass` (pager control) | `nv-<t>-pager` | `span.nv-<t>-pager`; current page `current` |
| `cssClass` (Login family) | `lg-<t>` | `table.lg-<t>` |
| `cssClass` (validators, ValidationSummary) | `vl-<t>` | `span.vl-<t>` / `div.vl-<t>` |
| `cssClass` (Repeater) | `rp-<t>` | `div.wf-repeater.rp-<t>`; items `.wf-item` (`alt`, `active`, `edit`) |
| `cssClass` (DataList) | `dl-<t>` | `.wf-datalist.dl-<t>`; items `.datalist-item` / cells `.datalist-cell` |
| `itemCssClass`, `alternatingItemCssClass`, `selectedItemCssClass`, `editItemCssClass` | none needed; the adapter's own classes (`alt`, `selected`, `edit`, `datalist-*`) are styled | |
| `cssClass` / `backgroundCssClass` (Modal) | `md-<t>` on the overlay root | `.modal.md-<t>`; backdrop colour via `--wf-backdrop` |

Calendar, Accordion and AdRotator are not styled by this package.

## Maintaining the package

```bash
npm run sync -w @wf-controls/styles    # re-copy css/ and js/ from docs/StyleSheets/... (verbatim)
npm run gen -w @wf-controls/styles     # regenerate css/{modal,repeater,datalist}/ from scripts/gen-families.mjs (committed)
npm run build -w @wf-controls/styles   # regenerates css/bundles/*-full.css, then css/ + js/ -> dist/ (copies + .min.css)
npm test -w @wf-controls/styles
```

The kit in `docs/StyleSheets/` is the source of truth for the seven kit families: do not edit those files (or `*-all.css`) by hand. The added families are generated from the token table in `scripts/gen-families.mjs`; edit that script and run `npm run gen`.

## Browser support

Modern evergreen browsers. TreeView relies on `:has()` (Chrome and Edge 105+, Firefox 121+, Safari 15.4+).

## License

MIT
