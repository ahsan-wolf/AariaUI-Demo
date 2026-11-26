import React, { useState } from 'react';
import { Framework } from '../types/gallery';
import { mockEmployees } from '../data/mockData';
import { controlsRegistry } from '../data/controlsRegistry';
import {
  IconArrowRight,
  IconSparkles,
  IconGrid,
  IconTree,
  IconCheck,
  IconZap,
  IconCode,
} from '../components/Icons';
import { CodeSnippetViewer } from '../components/CodeSnippetViewer';

interface HomePageProps {
  onNavigate: (page: 'home' | 'controls' | 'migration' | 'docs', controlId?: string) => void;
  /** Opens the "Contact us for Demo" dialog. */
  onContact: () => void;
  framework: Framework;
  onFrameworkChange: (fw: Framework) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onContact,
  framework,
  onFrameworkChange,
}) => {
  const [density, setDensity] = useState<'normal' | 'compact' | 'comfortable'>('normal');
  const [currentPage, setCurrentPage] = useState(0);
  const [sortField, setSortField] = useState<string>('name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(102);

  const pageSize = 4;

  // Sorting
  const sortedData = [...mockEmployees].sort((a, b) => {
    const valA = (a as unknown as Record<string, unknown>)[sortField];
    const valB = (b as unknown as Record<string, unknown>)[sortField];
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(String(valB)) : String(valB).localeCompare(valA);
    }
    if (typeof valA === 'number') {
      return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const pagedData = sortedData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const heroCodeSnippets = {
    react: `import { WebFormsGridView } from "@wf-controls/pro-data-react";
import { GridViewController } from "@wf-controls/pro-data";

const gridCtrl = new GridViewController({
  dataSource: employees,
  allowPaging: true,
  pageSize: 4,
  allowSorting: true,
  columns: [
    { key: "id", dataField: "id", headerText: "ID", sortable: true },
    { key: "name", dataField: "name", headerText: "Employee Name", sortable: true },
    { key: "role", dataField: "role", headerText: "Role", sortable: true },
    { key: "salary", dataField: "salary", headerText: "Salary", sortable: true }
  ]
});

export default function App() {
  return <WebFormsGridView controller={gridCtrl} density="${density}" />;
}`,
    angular: `<!-- Angular Standalone Component -->
<wf-grid-view
  [dataSource]="employees"
  [allowPaging]="true"
  [pageSize]="4"
  [allowSorting]="true"
  [density]="'${density}'">
</wf-grid-view>`,
    jquery: `// Plain JS: import the controllers directly (GridView is Pro: needs a license key)
import { GridViewController } from "@wf-controls/pro-data";

const grid = new GridViewController({
  id: "employeesGrid",
  dataSource: employees,
  allowPaging: true,
  pageSize: 4,
  allowSorting: true
});
grid.stateChanged.subscribe(() => render(grid.visibleRows));   // density: "${density}" is a CSS choice
await grid.dataBind();`,
  };

  return (
    <div className="hero-container">
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-badge">
          <IconSparkles size={14} />
          <span>Free MIT core &bull; Pro &amp; Enterprise packages &bull; React, Angular &amp; plain JS</span>
        </div>

        <h1 className="hero-title">
          Enterprise UI Framework for Modern Web &amp;{' '}
          <span className="hero-title-highlight">WebForms Modernization</span>
        </h1>

        <p className="hero-subtitle">
          Aaira is an Enterprise Web UI Framework that bridges legacy ASP.NET Web Forms and modern front-end development. Use familiar controls like GridView, Repeater, Login, Menu, and validators directly in React, Angular, or plain JavaScript&mdash;retaining consistent properties, events, and data models with zero ViewState or page postbacks.
        </p>

        <img
          className="hero-image"
          src={`${import.meta.env.BASE_URL}aaira-demo.gif`}
          alt="Web Forms controls, running in React and Angular: GridView, Repeater, SqlDataSource, Login and TreeView"
          width={720}
          height={405}
          data-testid="hero-image"
        />

        <div className="hero-actions">
          <button className="btn-primary" onClick={() => onNavigate('controls', 'grid-view')}>
            <span>Browse Component Gallery</span>
            <IconArrowRight size={16} />
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('migration')}>
            <span>WebForms Migration Center</span>
          </button>
          <button className="btn-secondary" onClick={onContact} data-testid="contact-demo-btn">
            <span>Contact us for Demo</span>
          </button>
        </div>
      </section>

      {/* Metrics Counter */}
      <section className="metrics-row">
        <div className="metric-card">
          <div className="metric-number">{controlsRegistry.length}</div>
          <div className="metric-label">Controls (Free, Pro &amp; Enterprise)</div>
        </div>
        <div className="metric-card">
          <div className="metric-number">3</div>
          <div className="metric-label">Frameworks (React, Angular, plain JS)</div>
        </div>
        <div className="metric-card">
          <div className="metric-number">100%</div>
          <div className="metric-label">Headless Core (Zero DOM Dependencies)</div>
        </div>
        <div className="metric-card">
          <div className="metric-number">153 / 153</div>
          <div className="metric-label">Automated Unit Tests Passing</div>
        </div>
      </section>

      {/* Live Interactive Hero Teaser */}
      <section className="teaser-container">
        <div className="teaser-header">
          <div className="teaser-title-group">
            <div className="window-dots">
              <span className="window-dot red"></span>
              <span className="window-dot yellow"></span>
              <span className="window-dot green"></span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aa-text-secondary)' }}>
              Interactive Live Preview &mdash; Aaira GridView
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['compact', 'normal', 'comfortable'] as const).map((d) => (
                <button
                  key={d}
                  className={`teaser-tab-btn ${density === d ? 'active' : ''}`}
                  onClick={() => setDensity(d)}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>

            <div className="teaser-tabs">
              <button
                className={`teaser-tab-btn ${framework === 'react' ? 'active' : ''}`}
                onClick={() => onFrameworkChange('react')}
              >
                React
              </button>
              <button
                className={`teaser-tab-btn ${framework === 'angular' ? 'active' : ''}`}
                onClick={() => onFrameworkChange('angular')}
              >
                Angular
              </button>
              <button
                className={`teaser-tab-btn ${framework === 'jquery' ? 'active' : ''}`}
                onClick={() => onFrameworkChange('jquery')}
              >
                Plain JS
              </button>
            </div>
          </div>
        </div>

        <div className="teaser-canvas">
          <div className="aa-table-wrapper">
            <table className={`aa-table density-${density}`}>
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')}>ID {sortField === 'id' ? (sortAsc ? '▲' : '▼') : ''}</th>
                  <th onClick={() => handleSort('name')}>Employee Name {sortField === 'name' ? (sortAsc ? '▲' : '▼') : ''}</th>
                  <th onClick={() => handleSort('role')}>Role {sortField === 'role' ? (sortAsc ? '▲' : '▼') : ''}</th>
                  <th onClick={() => handleSort('department')}>Department {sortField === 'department' ? (sortAsc ? '▲' : '▼') : ''}</th>
                  <th onClick={() => handleSort('salary')}>Salary {sortField === 'salary' ? (sortAsc ? '▲' : '▼') : ''}</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pagedData.map((emp) => (
                  <tr
                    key={emp.id}
                    className={selectedRowId === emp.id ? 'selected' : ''}
                    onClick={() => setSelectedRowId(emp.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 600 }}>#{emp.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--aa-brand-primary)' }}>{emp.name}</td>
                    <td>{emp.role}</td>
                    <td>{emp.department}</td>
                    <td style={{ fontFamily: 'var(--aa-font-mono)' }}>${emp.salary.toLocaleString()}</td>
                    <td>
                      <span
                        className={`badge-chip ${emp.status === 'Active' ? 'enterprise' : 'new'}`}
                      >
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="aa-pager">
              <span>
                Showing {currentPage * pageSize + 1} -{' '}
                {Math.min((currentPage + 1) * pageSize, sortedData.length)} of {sortedData.length} records
              </span>
              <div className="aa-pager-buttons">
                <button
                  className="aa-pager-btn"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  &larr; Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={`aa-pager-btn ${currentPage === i ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="aa-pager-btn"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <CodeSnippetViewer
              code={heroCodeSnippets[framework]}
              language={framework === 'react' ? 'tsx' : framework === 'angular' ? 'html' : 'javascript'}
              title={`Aaira GridView Code (${framework.toUpperCase()})`}
            />
          </div>
        </div>
      </section>

      {/* Featured Controls Grid */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--aa-text-primary)' }}>
              Featured Enterprise Controls
            </h2>
            <p style={{ color: 'var(--aa-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              Built with zero DOM dependencies in TypeScript Core with native presentation adapters.
            </p>
          </div>
          <button
            className="btn-secondary"
            onClick={() => onNavigate('controls')}
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            <span>View All 20+ Controls</span>
            <IconArrowRight size={14} />
          </button>
        </div>

        <div className="cards-grid">
          <div className="feature-card" onClick={() => onNavigate('controls', 'grid-view')}>
            <div className="card-icon-box">
              <IconGrid size={22} />
            </div>
            <div className="card-title">GridView</div>
            <div className="card-tag">&lt;asp:GridView&gt;</div>
            <div className="card-desc">
              Tabular data grid with sorting, paging, inline editing, row command routing, and template fields.
            </div>
          </div>

          <div className="feature-card" onClick={() => onNavigate('controls', 'tree-view')}>
            <div className="card-icon-box">
              <IconTree size={22} />
            </div>
            <div className="card-title">TreeView</div>
            <div className="card-tag">&lt;asp:TreeView&gt;</div>
            <div className="card-desc">
              Hierarchical nested tree view with expand/collapse, tri-state checkboxes, and SiteMapDataSource binding.
            </div>
          </div>

          <div className="feature-card" onClick={() => onNavigate('controls', 'validator-manager')}>
            <div className="card-icon-box">
              <IconCheck size={22} />
            </div>
            <div className="card-title">Validation Suite</div>
            <div className="card-tag">Page_IsValid &amp; Validators</div>
            <div className="card-desc">
              RequiredField, Compare, Range, Regex, and Custom validators with ValidationGroups and ValidationSummary.
            </div>
          </div>

          <div className="feature-card" onClick={() => onNavigate('controls', 'modal-popup')}>
            <div className="card-icon-box">
              <IconZap size={22} />
            </div>
            <div className="card-title">ModalPopup Extender</div>
            <div className="card-tag">&lt;ajaxToolkit:ModalPopupExtender&gt;</div>
            <div className="card-desc">
              Full AjaxControlToolkit modal lifecycle with Ok/Cancel buttons, dismiss keys, and cancellable events.
            </div>
          </div>

          <div className="feature-card" onClick={onContact}>
            <div className="card-icon-box" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <IconArrowRight size={22} />
            </div>
            <div className="card-title">Contact us for Demo</div>
            <div className="card-tag">Live walkthrough</div>
            <div className="card-desc">
              Book a walkthrough of the controls, the Pro and Enterprise editions and your WebForms migration.
            </div>
          </div>

          <div className="feature-card" onClick={() => onNavigate('migration')}>
            <div className="card-icon-box" style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4' }}>
              <IconCode size={22} />
            </div>
            <div className="card-title">WebForms Migration Center</div>
            <div className="card-tag">AST Code Generator</div>
            <div className="card-desc">
              Paste classic ASPX markup and receive instant React, Angular, and plain JS equivalents with migration scores.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
