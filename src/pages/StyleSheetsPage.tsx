// Style Sheets: documents @wf-controls/styles and shows the real React adapters in each of its five themes.
// All five theme bundles are loaded at once; every rule is scoped to a class such as gv-modern, so switching
// theme only changes the class suffix on each control root.
import React, { useEffect, useMemo, useState } from 'react';
import { InMemoryAuthProvider, LoginController, MenuController, ModalBehavior, SiteMapDataSource, SiteMapPathController, TabsController, TreeViewController } from '@wf-controls/core';
import { DataListController, GridViewController, RepeaterController } from '@wf-controls/pro-data';
import { Breadcrumb, NavigationMenu, TreeView, WebFormsLogin, WebFormsModal, WebFormsTabs } from '@wf-controls/react';
import { WebFormsDataList, WebFormsGridView, WebFormsRepeater } from '@wf-controls/pro-data-react';
import '@wf-controls/styles/bundles/modern-full.css';
import '@wf-controls/styles/bundles/dark-full.css';
import '@wf-controls/styles/bundles/classic-full.css';
import '@wf-controls/styles/bundles/minimal-full.css';
import '@wf-controls/styles/bundles/corporate-full.css';
import '@wf-controls/styles/adapters.css';
import { CodeSnippetViewer } from '../components/CodeSnippetViewer';

const THEMES = ['modern', 'dark', 'classic', 'minimal', 'corporate'] as const;
type ThemeName = (typeof THEMES)[number];

const FAMILIES: { family: string; prefix: string; controls: string; adapter: string }[] = [
  { family: 'gridview', prefix: 'gv-', controls: 'GridView and plain tables (edit row, pager, empty state); gv-<theme>-edit.css styles inputs in edit rows', adapter: 'WebFormsGridView / wf-grid-view' },
  { family: 'login', prefix: 'lg-', controls: 'Login, CreateUserWizard, ChangePassword, PasswordRecovery, LoginStatus, LoginName', adapter: 'WebFormsLogin ... / wf-login ...' },
  { family: 'menu', prefix: 'mn-', controls: 'Menu (horizontal, or vertical with mn-vertical)', adapter: 'NavigationMenu / wf-menu' },
  { family: 'treeview', prefix: 'tv-', controls: 'TreeView', adapter: 'TreeView / wf-tree-view' },
  { family: 'tabs', prefix: 'tb-', controls: 'Tab strip and panels', adapter: 'WebFormsTabs / wf-tabs' },
  { family: 'navigation', prefix: 'nv-', controls: 'SiteMapPath (breadcrumb), DataPager, link lists', adapter: 'Breadcrumb / wf-breadcrumb' },
  { family: 'validation', prefix: 'vl-', controls: 'Validators and ValidationSummary', adapter: 'none (add the classes to your markup)' },
  { family: 'modal', prefix: 'md-', controls: 'Popup dialog; backdrop colour is --wf-backdrop', adapter: 'WebFormsModal / wf-modal' },
  { family: 'repeater', prefix: 'rp-', controls: 'Repeater cards and edit template', adapter: 'WebFormsRepeater / wf-repeater' },
  { family: 'datalist', prefix: 'dl-', controls: 'DataList (flow tiles or table cells)', adapter: 'WebFormsDataList / wf-data-list' },
];

const SNIPPET_REACT = `import "@wf-controls/styles/bundles/modern-full.css";
import "@wf-controls/styles/adapters.css";   // after the theme

<WebFormsGridView controller={grid} />        // grid.options.cssClass = "gv-modern"
<NavigationMenu controller={menu} className="mn-modern" />
<WebFormsTabs controller={tabs} tabs={defs} className="tb-modern" />`;

const SNIPPET_ANGULAR = `// angular.json
"styles": ["node_modules/@wf-controls/styles/css/bundles/modern-full.css",
           "node_modules/@wf-controls/styles/css/adapters.css", "src/styles.css"]

<wf-menu [controller]="menu" cssClass="mn-modern"></wf-menu>`;

const SNIPPET_HTML = `<link rel="stylesheet" href="node_modules/@wf-controls/styles/css/bundles/modern-full.css" />
<table class="gv-modern">...</table>      <!-- switch theme: gv-dark, gv-classic ... -->`;

interface Person { id: number; first: string; last: string; role: string; }
const PEOPLE: Person[] = [
  { id: 1, first: 'Ava', last: 'Stone', role: 'Director' },
  { id: 2, first: 'Noah', last: 'Reed', role: 'Engineer' },
  { id: 3, first: 'Mia', last: 'Chen', role: 'Designer' },
  { id: 4, first: 'Leo', last: 'Grant', role: 'Manager' },
  { id: 5, first: 'Ivy', last: 'Brooks', role: 'Engineer' },
];

const SITE_MAP = {
  title: 'Home', url: '/', childNodes: [
    { title: 'Staff', url: '/staff', childNodes: [{ title: 'Engineering', url: '/staff/engineering' }, { title: 'Sales', url: '/staff/sales' }] },
    { title: 'Reports', url: '/reports' },
  ],
};

function StyleDemo({ theme }: { theme: ThemeName }) {
  const [result, setResult] = useState('');
  const c = useMemo(() => {
    const map = new SiteMapDataSource({ id: 'map', siteMap: SITE_MAP });
    const menuMap = new SiteMapDataSource({ id: 'menuMap', siteMap: SITE_MAP, showStartingNode: false });
    const provider = new InMemoryAuthProvider({ users: [{ userName: 'ann', password: 'pw', roles: ['Admin'] }] });
    return {
      grid: new GridViewController<Person>({
        id: 'styleGrid', dataKeyField: 'id', allowPaging: true, allowSorting: true, pageSize: 3,
        cssClass: 'gv-modern', selectedRowCssClass: 'selected',
        columns: [
          { type: 'bound', key: 'id', dataField: 'id', headerText: 'ID', sortable: true },
          { type: 'bound', key: 'first', dataField: 'first', headerText: 'First', sortable: true },
          { type: 'bound', key: 'last', dataField: 'last', headerText: 'Last', sortable: true },
          { type: 'bound', key: 'role', dataField: 'role', headerText: 'Role' },
          { type: 'template', key: 'actions', headerText: 'Actions' },
        ],
      }),
      repeater: new RepeaterController<Person>({ id: 'styleRepeater', dataKeyField: 'id', emptyText: 'No people.' }),
      list: new DataListController<Person>({ id: 'styleList', dataKeyField: 'id', repeatLayout: 'Flow' }),
      menu: new MenuController({ id: 'styleMenu', orientation: 'Horizontal', dataSource: menuMap }),
      path: new SiteMapPathController({ id: 'stylePath', siteMapProvider: map }),
      tree: new TreeViewController({ id: 'styleTree', dataSource: map, expandDepth: 1 }),
      tabs: new TabsController({ tabs: [{ id: 'a', headerText: 'Overview' }, { id: 'b', headerText: 'Details' }, { id: 'c', headerText: 'Locked', enabled: false }] }),
      modal: new ModalBehavior({ onOk: () => setResult('confirmed'), onCancel: () => setResult('cancelled') }),
      login: new LoginController({ provider, passwordRecoveryUrl: '#recover', createUserUrl: '#signup' }),
    };
  }, []);

  useEffect(() => {
    void c.grid.dataBind(PEOPLE);
    void c.repeater.dataBind(PEOPLE.slice(0, 3));
    void c.list.dataBind(PEOPLE.slice(0, 3));
    void c.menu.dataBind();
    void c.path.dataBind('/staff/engineering');
    void c.tree.dataBind();
  }, [c]);

  useEffect(() => {
    c.grid.options.cssClass = `gv-${theme}`;
    void c.grid.stateChanged.emit(c.grid, { reason: 'theme' });
  }, [c, theme]);

  const tabDefs = [
    { id: 'a', headerText: 'Overview', content: <p>Overview panel.</p> },
    { id: 'b', headerText: 'Details', content: <p>Details panel.</p> },
    { id: 'c', headerText: 'Locked', enabled: false },
  ];

  return (
    <div className="style-demo">
      <section><h3>GridView <code>gv-{theme}</code></h3>
        <WebFormsGridView
          controller={c.grid}
          template={(key, row, index) => key === 'actions' ? (
            <>
              <button type="button" className="dx-action-btn" onClick={() => void c.grid.executeCommand(index, 'Select', row.id)}>Select</button>{' '}
              <button type="button" className="dx-action-btn delete" onClick={() => void c.grid.executeCommand(index, 'Delete', row.id)}>Delete</button>
            </>
          ) : null}
        />
      </section>
      <section><h3>Repeater <code>rp-{theme}</code></h3>
        <WebFormsRepeater
          controller={c.repeater}
          className={`rp-${theme}`}
          itemTemplate={(p) => <div>{p.first} {p.last} <small>({p.role})</small></div>}
        />
      </section>
      <section><h3>DataList <code>dl-{theme}</code></h3>
        <WebFormsDataList
          controller={c.list}
          className={`dl-${theme}`}
          itemTemplate={(p) => <><strong>{p.first}</strong> {p.last}</>}
          emptyTemplate={() => <em>No people.</em>}
        />
      </section>
      <section><h3>Menu <code>mn-{theme}</code></h3><NavigationMenu controller={c.menu} className={`mn-${theme}`} /></section>
      <section><h3>Breadcrumb <code>nv-{theme}</code></h3><Breadcrumb controller={c.path} className={`nv-${theme}`} /></section>
      <section><h3>TreeView <code>tv-{theme}</code></h3><TreeView controller={c.tree} className={`tv-${theme}`} /></section>
      <section><h3>Tabs <code>tb-{theme}</code></h3><WebFormsTabs controller={c.tabs} tabs={tabDefs} className={`tb-${theme}`} /></section>
      <section><h3>Modal <code>md-{theme}</code></h3>
        <button type="button" className="dx-action-btn" onClick={() => void c.modal.show()}>Open dialog</button> <span>{result}</span>
        <WebFormsModal behavior={c.modal} title="Confirm" okText="OK" cancelText="Cancel" className={`md-${theme}`}>
          <p>Apply this change?</p>
        </WebFormsModal>
      </section>
      <section><h3>Login <code>lg-{theme}</code></h3>
        <p><small>Try ann / pw.</small></p>
        <WebFormsLogin controller={c.login} className={`lg-${theme}`} />
      </section>
    </div>
  );
}

export const StyleSheetsPage: React.FC = () => {
  const [theme, setTheme] = useState<ThemeName>('modern');

  return (
    <div className="docs-page-container">
      <h1>Style Sheets</h1>
      <p>
        <code>@wf-controls/styles</code> is framework-neutral CSS: five themes for ten control families. The React and Angular
        adapters emit the markup the sheets target, so a theme is applied by putting its class on the control root
        (for example <code>gv-modern</code> becomes <code>gv-dark</code>). Several themes can coexist on one page.
      </p>

      <h2>Families</h2>
      <div className="aa-table-wrapper">
        <table className="aa-table">
          <thead><tr><th>Family</th><th>Prefix</th><th>Controls</th><th>Adapter</th></tr></thead>
          <tbody>
            {FAMILIES.map((f) => (
              <tr key={f.family}>
                <td><code>{f.family}/</code></td><td><code>{f.prefix}&lt;theme&gt;</code></td><td>{f.controls}</td><td>{f.adapter}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Bundles: <code>bundles/&lt;theme&gt;-all.css</code> is the seven kit families (verbatim from the ASP.NET CSS kit);
        <code> bundles/&lt;theme&gt;-full.css</code> adds Modal, Repeater, DataList and the grid edit-row sheet (recommended).
        Not covered: Calendar, Accordion, AdRotator. Load <code>adapters.css</code> after the theme for React and Angular.
      </p>

      <h2>Use it</h2>
      <CodeSnippetViewer title="React" language="tsx" code={SNIPPET_REACT} />
      <CodeSnippetViewer title="Angular" language="typescript" code={SNIPPET_ANGULAR} />
      <CodeSnippetViewer title="Plain HTML" language="html" code={SNIPPET_HTML} />

      <h2>Live themes</h2>
      <div className="dx-demo-bar">
        <div className="dx-mode-group">
          <span style={{ fontSize: '13px', fontWeight: 700 }}>Theme:</span>
          {THEMES.map((t) => (
            <button key={t} type="button" className={`dx-mode-pill ${theme === t ? 'active' : ''}`} onClick={() => setTheme(t)}>{t}</button>
          ))}
        </div>
      </div>
      <div className="style-demo-canvas" style={{ background: theme === 'dark' ? '#111827' : '#fff', color: theme === 'dark' ? '#e5e7eb' : '#111827', padding: 16, borderRadius: 10, marginTop: 12, border: '1px solid var(--aa-border-subtle)' }}>
        <StyleDemo theme={theme} />
      </div>
    </div>
  );
};
