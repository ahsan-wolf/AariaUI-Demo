import React, { useState } from 'react';
import { CodeSnippetViewer } from '../components/CodeSnippetViewer';
import { IconDatabase, IconCheckCircle, IconZap } from '../components/Icons';
import { ApiRoute } from '../lib/apiRoute';

interface DocsViewerPageProps {
  onOpenApi: (route: ApiRoute) => void;
}

export const DocsViewerPage: React.FC<DocsViewerPageProps> = ({ onOpenApi }) => {
  const [activeSection, setActiveSection] = useState<'intro' | 'architecture' | 'adonet' | 'theming' | 'books'>('intro');

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: 'var(--aa-brand-primary-light)', color: 'var(--aa-brand-primary)', borderRadius: '20px', fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>
          <IconCheckCircle size={14} />
          <span>Official Documentation &bull; v1.0.0</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--aa-text-primary)' }}>
          Aaira Controls Documentation
        </h1>
        <p style={{ color: 'var(--aa-text-secondary)', fontSize: '15px', marginTop: '6px' }}>
          Architecture reference, installation guides, and migration manuals for enterprise engineering teams.
        </p>
      </div>

      <div className="aa-doc-banner">
        <div>
          <strong>Looking for properties, methods, events and arguments?</strong>
          <span>The API Docs section documents every class with constructor options, members, event arguments and verified examples.</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => onOpenApi({ areaId: 'data-library', entryId: 'datatable' })}>DataTable</button>
          <button className="btn-secondary" onClick={() => onOpenApi({ areaId: 'data-library', entryId: 'dataset' })}>DataSet</button>
          <button className="btn-primary" onClick={() => onOpenApi({ areaId: 'data-library', entryId: 'quick-start' })}>Open API Docs</button>
        </div>
      </div>

      {/* Docs Nav Pills */}
      <div className="framework-pills" style={{ alignSelf: 'flex-start' }}>
        <button
          className={`framework-pill-btn ${activeSection === 'intro' ? 'active' : ''}`}
          onClick={() => setActiveSection('intro')}
        >
          Quick Start &amp; Installation
        </button>
        <button
          className={`framework-pill-btn ${activeSection === 'architecture' ? 'active' : ''}`}
          onClick={() => setActiveSection('architecture')}
        >
          3-Tier Architecture
        </button>
        <button
          className={`framework-pill-btn ${activeSection === 'adonet' ? 'active' : ''}`}
          onClick={() => setActiveSection('adonet')}
        >
          ADO.NET In-Memory Data Core
        </button>
        <button
          className={`framework-pill-btn ${activeSection === 'theming' ? 'active' : ''}`}
          onClick={() => setActiveSection('theming')}
        >
          Theming &amp; Design Tokens
        </button>
        <button
          className={`framework-pill-btn ${activeSection === 'books' ? 'active' : ''}`}
          onClick={() => setActiveSection('books')}
        >
          Books &amp; Examples
        </button>
      </div>

      {activeSection === 'intro' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Package Installation</h2>
          <p style={{ color: 'var(--aa-text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
            Aaira Controls is organized as a zero-dependency monorepo. Install the headless core alongside your framework adapter of choice:
          </p>

          <CodeSnippetViewer
            code={`# 1. Install Headless Core (Required)
npm install @wf-controls/core

# 2. Install React Presentation Adapter
npm install @wf-controls/react

# Or for Angular:
npm install @wf-controls/angular

# Or for pure HTML/jQuery:
npm install @wf-controls/jquery`}
            language="bash"
            title="Terminal"
          />

          <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '16px' }}>Quick Start (React)</h3>
          <CodeSnippetViewer
            code={`import { WebFormsGridView } from "@wf-controls/react";
import { GridViewController } from "@wf-controls/core";

const controller = new GridViewController({
  dataSource: [
    { id: 1, name: "Acme Corp", revenue: 120000 },
    { id: 2, name: "Globex", revenue: 85000 }
  ],
  allowSorting: true,
  allowPaging: true,
  pageSize: 10
});

export function App() {
  return <WebFormsGridView controller={controller} />;
}`}
            language="tsx"
            title="React Quick Start"
          />
        </div>
      )}

      {activeSection === 'architecture' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>3-Tier Zero-DOM Headless Core</h2>
          <p style={{ color: 'var(--aa-text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
            Unlike traditional widget suites that bundle heavy DOM manipulations inside business logic, Aaira cleanly isolates state machines from rendering.
          </p>

          <div style={{ background: 'var(--aa-bg-surface)', padding: '20px', borderRadius: '10px', border: '1px solid var(--aa-border-subtle)', fontFamily: 'var(--aa-font-mono)', fontSize: '12px', lineHeight: 1.6 }}>
            <div style={{ color: '#06b6d4', fontWeight: 700 }}>1. PRESENTATION ADAPTERS (React, Angular, jQuery)</div>
            <div style={{ color: 'var(--aa-text-secondary)', marginLeft: '16px' }}>&bull; Thin observers rendering HTML &amp; native templates</div>
            <div style={{ color: 'var(--aa-text-secondary)', marginLeft: '16px' }}>&bull; Dispatches UI commands (e.g. executeCommand(&apos;Page&apos;, &apos;2&apos;))</div>
            <div style={{ margin: '8px 0', borderBottom: '1px dashed var(--aa-border-subtle)' }}></div>
            <div style={{ color: '#6366f1', fontWeight: 700 }}>2. HEADLESS CONTROLLERS (@wf-controls/core)</div>
            <div style={{ color: 'var(--aa-text-secondary)', marginLeft: '16px' }}>&bull; State machines, sorting, paging, inline editing, selection</div>
            <div style={{ color: 'var(--aa-text-secondary)', marginLeft: '16px' }}>&bull; Strongly typed EventDispatcher &amp; cancellable events (e.cancel = true)</div>
            <div style={{ margin: '8px 0', borderBottom: '1px dashed var(--aa-border-subtle)' }}></div>
            <div style={{ color: '#10b981', fontWeight: 700 }}>3. DATA &amp; INFRASTRUCTURE LAYER</div>
            <div style={{ color: 'var(--aa-text-secondary)', marginLeft: '16px' }}>&bull; In-memory ADO.NET: DataSet, DataTable, DataView, DataRow</div>
            <div style={{ color: 'var(--aa-text-secondary)', marginLeft: '16px' }}>&bull; DataSources: SqlDataSource, ObjectDataSource, XmlDataSource</div>
          </div>
        </div>
      )}

      {activeSection === 'adonet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>ADO.NET In-Memory Data Core</h2>
          <p style={{ color: 'var(--aa-text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
            Aaira brings full ADO.NET relational semantics to client-side TypeScript. Use <code>DataTable</code>, <code>DataView</code>, and <code>DataSet</code> with row versioning and change tracking (<code>acceptChanges</code>, <code>rejectChanges</code>, <code>hasChanges</code>).
          </p>

          <CodeSnippetViewer
            code={`import { DataTable, DataView } from "@wf-controls/core";

// 1. Create DataTable and define schema
const table = new DataTable("Employees");
table.columns.add("id", "number");
table.columns.add("name", "string");
table.columns.add("department", "string");

// 2. Add records
table.rows.add({ id: 1, name: "Marcus", department: "Engineering" });
table.rows.add({ id: 2, name: "Sophia", department: "Product" });
table.acceptChanges();

// 3. Create a filtered & sorted DataView projection
const view = new DataView(table);
view.rowFilter = "department = 'Engineering'";
view.sort = "name ASC";

// 4. Bind directly to any Aaira control
const grid = new GridViewController({ dataSource: view });`}
            language="typescript"
            title="ADO.NET TypeScript Example"
          />
        </div>
      )}

      {activeSection === 'theming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Theming &amp; CSS Variables</h2>
          <p style={{ color: 'var(--aa-text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
            Customize colors, typography, border radius, and elevation tokens using native CSS custom properties.
          </p>

          <CodeSnippetViewer
            code={`:root {
  --aa-brand-primary: #4f46e5;
  --aa-brand-accent: #06b6d4;
  --aa-bg-surface: #ffffff;
  --aa-border-subtle: #e2e8f0;
}

[data-theme="dark"] {
  --aa-bg-canvas: #090d16;
  --aa-bg-surface: #0f172a;
  --aa-brand-primary: #6366f1;
}`}
            language="css"
            title="Design Tokens"
          />
        </div>
      )}
      {activeSection === 'books' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Books &amp; Runnable Examples</h2>
          <p style={{ color: 'var(--aa-text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
            Four printable black-and-white PDF volumes live in <code>docs/book/</code>: React UI (Volume 1), React components and
            controllers (Volume 2), Angular (Volume 3) and JavaScript / HTML (Volume 4). Every listing is a real file that was
            compiled and run in a browser.
          </p>

          <CodeSnippetViewer
            code={`npm install && npm run build                     # once
node docs/book/examples/serve.mjs                # React       http://localhost:4100
node docs/book/examples-angular/serve.mjs        # Angular     http://localhost:4300  (/?app = routed app)
node docs/book/examples-js/serve.mjs             # JavaScript  http://localhost:8080/docs/book/examples-js/gallery.html
npm run demo                                     # 18 CLI demos (incl. server-side paging, Calendar isSelectable, Tabs, Modal, Accordion, AJAX behaviors)`}
            language="bash"
            title="Run the examples"
          />

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => onOpenApi({ areaId: 'guides', entryId: 'books-run-them' })}>Books &amp; examples</button>
            <button className="btn-secondary" onClick={() => onOpenApi({ areaId: 'guides', entryId: 'rest-server-side-paging' })}>REST &amp; server paging</button>
            <button className="btn-secondary" onClick={() => onOpenApi({ areaId: 'guides', entryId: 'ngguide-install-and-import' })}>Angular guide</button>
            <button className="btn-secondary" onClick={() => onOpenApi({ areaId: 'guides', entryId: 'jsguide-loading-the-library' })}>JavaScript guide</button>
          </div>
        </div>
      )}
    </div>
  );
};
