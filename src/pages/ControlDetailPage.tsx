import React, { useEffect, useState } from 'react';
import { controlsRegistry } from '../data/controlsRegistry';
import { Framework } from '../types/gallery';
import { mockSiteMap } from '../data/mockData';
import { CodeSnippetViewer } from '../components/CodeSnippetViewer';
import { IconSliders, IconCheck } from '../components/Icons';
import { GridViewDemo } from '../components/GridViewDemo';
import { MenuDemo } from '../components/MenuDemo';
import { DataListDemo } from '../components/DataListDemo';
import { RepeaterDemo } from '../components/RepeaterDemo';
import { DataCoreDemo } from '../components/DataCoreDemo';
import { TabsDemo, BreadcrumbDemo, LoginDemo, ValidationDemo } from '../components/AdapterDemos';
import { ApiDocViewer } from '../components/ApiDocViewer';
import { ApiRoute } from '../lib/apiRoute';
import { EditionChip } from '../components/EditionChip';
import { EditionBox } from '../components/EditionBox';

interface ControlDetailPageProps {
  controlId: string;
  framework: Framework;
  onFrameworkChange: (fw: Framework) => void;
  /** Open a page of the full API documentation. */
  onOpenApi: (route: ApiRoute) => void;
}

export const ControlDetailPage: React.FC<ControlDetailPageProps> = ({
  controlId,
  framework,
  onFrameworkChange,
  onOpenApi,
}) => {
  const control = controlsRegistry.find((c) => c.id === controlId) || controlsRegistry[0]!;

  // The ADO.NET demos are self-contained: the grid configurator (paging / sorting / density) does not apply to them.
  const isDataDemo = control.id === 'data-table' || control.id === 'data-set' || control.id === 'data-binding';

  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'api' | 'migration'>('preview');

  // The API tab embeds the generated reference; it only tracks which sub-tab is open (other pages open the full docs).
  const [apiTabId, setApiTabId] = useState<string | undefined>(undefined);
  useEffect(() => setApiTabId(undefined), [controlId]);

  // Configurator options for Live Preview
  const [allowPaging, setAllowPaging] = useState(true);
  const [allowSorting, setAllowSorting] = useState(true);
  const [density, setDensity] = useState<'normal' | 'compact' | 'comfortable'>('normal');
  const [showStatusBadge, setShowStatusBadge] = useState(true);

  // Modal behavior live state
  const [modalOpen, setModalOpen] = useState(false);

  // TreeView expanded state
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ Dashboard: true });
  const [selectedNode, setSelectedNode] = useState<string>('Analytics Overview');

  const renderLivePreview = () => {
    switch (control.id) {
      case 'grid-view':
        return <GridViewDemo initialMode="template" />;

      case 'data-table':
        return <DataCoreDemo mode="table" />;

      case 'data-set':
        return <DataCoreDemo mode="set" />;

      case 'data-binding':
        return <DataCoreDemo mode="binding" />;

      case 'repeater':
        return <RepeaterDemo />;

      case 'data-list':
        return <DataListDemo />;

      case 'menu':
        return <MenuDemo />;

      case 'tree-view':
        return (
          <div style={{ background: 'var(--aa-bg-surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--aa-border-subtle)' }}>
            <h4 style={{ marginBottom: '12px', color: 'var(--aa-text-primary)' }}>Site Navigation Hierarchy</h4>
            {mockSiteMap.map((node) => {
              const isOpen = expandedNodes[node.title];
              return (
                <div key={node.title} style={{ marginBottom: '8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      padding: '4px 6px',
                      borderRadius: '4px',
                      color: 'var(--aa-text-primary)',
                    }}
                    onClick={() =>
                      setExpandedNodes((prev) => ({ ...prev, [node.title]: !prev[node.title] }))
                    }
                  >
                    <span>{isOpen ? '▼' : '▶'}</span>
                    <span>📁 {node.title}</span>
                  </div>

                  {isOpen && node.children && (
                    <div style={{ marginLeft: '24px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {node.children.map((child) => (
                        <div
                          key={child.title}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            background: selectedNode === child.title ? 'var(--aa-brand-primary-light)' : 'transparent',
                            color: selectedNode === child.title ? 'var(--aa-brand-primary)' : 'var(--aa-text-secondary)',
                            fontWeight: selectedNode === child.title ? 600 : 400,
                          }}
                          onClick={() => setSelectedNode(child.title)}
                        >
                          📄 {child.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'tabs':
        return <TabsDemo />;

      case 'breadcrumb':
        return <BreadcrumbDemo />;

      case 'login':
        return <LoginDemo />;

      case 'validator-manager':
        return <ValidationDemo />;

      case 'modal-popup':
        return (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <button className="btn-primary" onClick={() => setModalOpen(true)}>
              Open Aaira ModalPopup
            </button>

            {modalOpen && (
              <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                <div
                  className="search-modal"
                  style={{ width: '460px', padding: '24px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>
                    Confirm Enterprise Action
                  </h3>
                  <p style={{ color: 'var(--aa-text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                    Replicating &lt;ajaxToolkit:ModalPopupExtender&gt; with OkControlId and CancelControlId lifecycle.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button className="btn-secondary" onClick={() => setModalOpen(false)}>
                      Cancel
                    </button>
                    <button className="btn-primary" onClick={() => setModalOpen(false)}>
                      Confirm OK
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--aa-text-secondary)' }}>
            <p>Live interactive sample for <strong>{control.name}</strong></p>
            <p style={{ fontSize: '13px', marginTop: '6px', color: 'var(--aa-text-muted)' }}>
              Check the Code and API Reference tabs below for complete framework integration.
            </p>
          </div>
        );
    }
  };

  return (
    <div>
      <div className="detail-header">
        <div className="detail-title-row">
          <h1 className="detail-title">{control.name}</h1>
          <span className="asp-tag-pill">{control.aspEquivalent}</span>
          <EditionChip edition={control.edition} />
          {control.badge && (
            <span className={`badge-chip ${control.badge.toLowerCase()}`}>
              {control.badge}
            </span>
          )}
        </div>
        <p className="detail-tagline">{control.tagline}</p>
      </div>

      <EditionBox control={control} />

      <div className="detail-tabs-bar">
        <button
          className={`detail-tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          Live Preview
        </button>
        <button
          className={`detail-tab ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          Multi-Framework Code
        </button>
        <button
          className={`detail-tab ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          API Reference
        </button>
        <button
          className={`detail-tab ${activeTab === 'migration' ? 'active' : ''}`}
          onClick={() => setActiveTab('migration')}
        >
          WebForms Migration
        </button>
      </div>

      {activeTab === 'preview' && isDataDemo && (
        <div>
          <div className="preview-canvas-box">{renderLivePreview()}</div>
          <div className="aa-doc-features">
            <div className="aa-doc-features-title">Key features</div>
            <ul>
              {control.features.map((feat, idx) => (
                <li key={idx}>
                  <IconCheck size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'preview' && !isDataDemo && (
        <div className="preview-workspace">
          <div className="preview-canvas-box">{renderLivePreview()}</div>

          <div className="configurator-panel">
            <div className="config-title">
              <IconSliders size={14} />
              <span>Configurator</span>
            </div>

            <div className="config-item">
              <span>Allow Paging</span>
              <div
                className={`toggle-switch ${allowPaging ? 'active' : ''}`}
                onClick={() => setAllowPaging(!allowPaging)}
              >
                <div className="toggle-thumb"></div>
              </div>
            </div>

            <div className="config-item">
              <span>Allow Sorting</span>
              <div
                className={`toggle-switch ${allowSorting ? 'active' : ''}`}
                onClick={() => setAllowSorting(!allowSorting)}
              >
                <div className="toggle-thumb"></div>
              </div>
            </div>

            <div className="config-item">
              <span>Status Badges</span>
              <div
                className={`toggle-switch ${showStatusBadge ? 'active' : ''}`}
                onClick={() => setShowStatusBadge(!showStatusBadge)}
              >
                <div className="toggle-thumb"></div>
              </div>
            </div>

            <div className="config-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <span>Density Mode</span>
              <div className="framework-pills" style={{ width: '100%', justifyContent: 'space-between' }}>
                {(['compact', 'normal', 'comfortable'] as const).map((d) => (
                  <button
                    key={d}
                    className={`framework-pill-btn ${density === d ? 'active' : ''}`}
                    onClick={() => setDensity(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '12px', borderTop: '1px solid var(--aa-border-subtle)', paddingTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--aa-text-muted)', marginBottom: '8px' }}>
                Key Features
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {control.features.map((feat, idx) => (
                  <li key={idx} style={{ fontSize: '12px', color: 'var(--aa-text-secondary)', display: 'flex', gap: '6px' }}>
                    <IconCheck size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'code' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: 'var(--aa-text-secondary)' }}>
              Select target framework:
            </span>
            <div className="framework-pills">
              <button
                className={`framework-pill-btn ${framework === 'react' ? 'active' : ''}`}
                onClick={() => onFrameworkChange('react')}
              >
                React
              </button>
              <button
                className={`framework-pill-btn ${framework === 'angular' ? 'active' : ''}`}
                onClick={() => onFrameworkChange('angular')}
              >
                Angular
              </button>
              <button
                className={`framework-pill-btn ${framework === 'jquery' ? 'active' : ''}`}
                onClick={() => onFrameworkChange('jquery')}
              >
                Plain JS
              </button>
            </div>
          </div>

          {framework === 'jquery' && (
            <div className="aa-doc-notice">
              <strong>Plain JS:</strong> there is no jQuery package. These samples import the controllers directly
              (<code>@wf-controls/core</code>, and the Pro / Enterprise packages where the edition box above says so) and render with plain DOM code.
            </div>
          )}

          <CodeSnippetViewer
            code={control.codeSamples[framework]}
            language={framework === 'react' ? 'tsx' : framework === 'angular' ? 'html' : 'javascript'}
            title={`${control.name} Implementation (${framework.toUpperCase()})`}
          />
        </div>
      )}

      {activeTab === 'api' && control.docs && (
        <div>
          <div className="aa-doc-banner">
            <div>
              <strong>Complete reference for {control.name}</strong>
              <span>Constructor options, properties, methods, events and arguments, with verified examples.</span>
            </div>
            <button
              className="btn-primary"
              onClick={() => onOpenApi({ areaId: control.docs!.areaId, entryId: control.docs!.entryId, ...(apiTabId ? { tabId: apiTabId } : {}) })}
            >
              Open in API Docs
            </button>
          </div>
          <ApiDocViewer
            embedded
            route={{ areaId: control.docs.areaId, entryId: control.docs.entryId, ...(apiTabId ? { tabId: apiTabId } : {}) }}
            onNavigate={(route) => {
              if (route.areaId === control.docs!.areaId && route.entryId === control.docs!.entryId) setApiTabId(route.tabId);
              else onOpenApi(route);
            }}
          />
        </div>
      )}

      {activeTab === 'api' && !control.docs && (
        <div>
          {/* Properties */}
          <div className="api-section">
            <h3 className="api-section-title">Properties</h3>
            <div className="aa-table-wrapper">
              <table className="aa-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Type</th>
                    <th>Default</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {control.props.map((p) => (
                    <tr key={p.name}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td><span className="type-badge">{p.type}</span></td>
                      <td style={{ fontFamily: 'var(--aa-font-mono)', fontSize: '12px' }}>{p.defaultValue}</td>
                      <td style={{ color: 'var(--aa-text-secondary)' }}>{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Events */}
          <div className="api-section">
            <h3 className="api-section-title">Events</h3>
            <div className="aa-table-wrapper">
              <table className="aa-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Arguments</th>
                    <th>Cancellable</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {control.events.map((e) => (
                    <tr key={e.name}>
                      <td style={{ fontWeight: 600, color: 'var(--aa-brand-primary)' }}>{e.name}</td>
                      <td><span className="type-badge">{e.arguments}</span></td>
                      <td>
                        {e.cancellable ? (
                          <span className="badge-chip enterprise">Yes (e.cancel = true)</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--aa-text-muted)' }}>No</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--aa-text-secondary)' }}>{e.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Methods */}
          <div className="api-section">
            <h3 className="api-section-title">Methods</h3>
            <div className="aa-table-wrapper">
              <table className="aa-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Return Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {control.methods.map((m) => (
                    <tr key={m.name}>
                      <td style={{ fontWeight: 600, fontFamily: 'var(--aa-font-mono)' }}>{m.signature}</td>
                      <td><span className="type-badge">{m.returnType}</span></td>
                      <td style={{ color: 'var(--aa-text-secondary)' }}>{m.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'migration' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'var(--aa-bg-surface)', padding: '20px', borderRadius: '10px', border: '1px solid var(--aa-border-subtle)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>
              Migrating from Classic WebForms {control.aspEquivalent}
            </h3>
            <p style={{ color: 'var(--aa-text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
              {control.migrationNotes}
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px' }}>Side-by-Side Comparison</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--aa-text-muted)', marginBottom: '6px' }}>
                  Classic ASP.NET Markup
                </div>
                <CodeSnippetViewer
                  code={`${control.aspEquivalent.slice(0, -1)} ID="${control.id}" runat="server" AllowPaging="True" PageSize="10" />`}
                  language="xml"
                  title="ASPX Code"
                />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--aa-brand-primary)', marginBottom: '6px' }}>
                  Modern Aaira Equivalent ({framework.toUpperCase()})
                </div>
                <CodeSnippetViewer
                  code={control.codeSamples[framework]}
                  language={framework === 'react' ? 'tsx' : framework === 'angular' ? 'html' : 'javascript'}
                  title={`Aaira ${framework.toUpperCase()}`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
