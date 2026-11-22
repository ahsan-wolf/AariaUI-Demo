import React, { useState } from 'react';
import { parseWebFormsMarkup, MigrationResult } from '../data/migrationEngine';
import { CodeSnippetViewer } from '../components/CodeSnippetViewer';
import { IconCode, IconCheckCircle, IconZap } from '../components/Icons';

export const MigrationCenterPage: React.FC = () => {
  const presets: { label: string; markup: string }[] = [
    {
      label: 'GridView with Paging & Sorting',
      markup: `<asp:GridView ID="gvEmployees" runat="server" 
  AllowPaging="True" 
  PageSize="10" 
  AllowSorting="True" 
  AutoGenerateColumns="False" 
  DataSourceID="SqlDsEmployees" 
  EnableViewState="False">
</asp:GridView>`,
    },
    {
      label: 'Repeater with ItemTemplate',
      markup: `<asp:Repeater ID="rptOrders" runat="server" DataSourceID="SqlDsOrders">
  <HeaderTemplate>
    <h3>Customer Orders</h3>
  </HeaderTemplate>
  <ItemTemplate>
    <div><%# Eval("CustomerName") %> - <%# Eval("Total") %></div>
  </ItemTemplate>
</asp:Repeater>`,
    },
    {
      label: 'Navigation Menu',
      markup: `<asp:Menu ID="mainMenu" runat="server" 
  Orientation="Horizontal" 
  StaticDisplayLevels="2" 
  DataSourceID="SiteMapDs">
</asp:Menu>`,
    },
    {
      label: 'RequiredFieldValidator',
      markup: `<asp:RequiredFieldValidator ID="rfvEmail" runat="server" 
  ControlToValidate="txtEmail" 
  ErrorMessage="Email is required" 
  ValidationGroup="CheckoutGroup" 
  InitialValue="">
</asp:RequiredFieldValidator>`,
    },
  ];

  const [inputMarkup, setInputMarkup] = useState(presets[0]!.markup);
  const [activeOutputTab, setActiveOutputTab] = useState<'react' | 'angular' | 'jquery'>('react');
  const [result, setResult] = useState<MigrationResult>(() => parseWebFormsMarkup(presets[0]!.markup));

  const handleTranslate = () => {
    setResult(parseWebFormsMarkup(inputMarkup));
  };

  const handleSelectPreset = (markup: string) => {
    setInputMarkup(markup);
    setResult(parseWebFormsMarkup(markup));
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: 'var(--aa-brand-primary-light)', color: 'var(--aa-brand-primary)', borderRadius: '20px', fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>
          <IconZap size={14} />
          <span>AST Code Modernization Engine</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--aa-text-primary)' }}>
          WebForms Migration Center
        </h1>
        <p style={{ color: 'var(--aa-text-secondary)', fontSize: '15px', marginTop: '6px' }}>
          Paste any classic ASP.NET Web Forms markup or AjaxControlToolkit tag.
          The engine computes an automated Migration Compatibility Score and translates it into production-ready React TSX, Angular HTML, and jQuery JavaScript.
        </p>
      </div>

      {/* Preset Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aa-text-muted)' }}>Load Preset:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            className="aa-pager-btn"
            style={{ padding: '6px 12px', fontSize: '12px', height: 'auto' }}
            onClick={() => handleSelectPreset(p.markup)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Split-pane Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left: Input Pane */}
        <div style={{ background: 'var(--aa-bg-surface)', border: '1px solid var(--aa-border-subtle)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--aa-text-primary)' }}>
              ASP.NET WebForms Markup
            </span>
            <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={handleTranslate}>
              <IconCode size={14} />
              <span>Translate Now</span>
            </button>
          </div>

          <textarea
            value={inputMarkup}
            onChange={(e) => setInputMarkup(e.target.value)}
            style={{
              width: '100%',
              minHeight: '280px',
              fontFamily: 'var(--aa-font-mono)',
              fontSize: '13px',
              lineHeight: '1.6',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid var(--aa-border-strong)',
              background: 'var(--aa-code-bg)',
              color: 'var(--aa-code-text)',
              resize: 'vertical',
              outline: 'none',
            }}
          />
        </div>

        {/* Right: Output & Score Pane */}
        <div style={{ background: 'var(--aa-bg-surface)', border: '1px solid var(--aa-border-subtle)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--aa-text-primary)' }}>
                Migration Result
              </span>
              <div style={{ fontSize: '12px', color: 'var(--aa-text-muted)' }}>
                Detected: <strong>{result.controlType}</strong>
              </div>
            </div>

            {/* Score Badge */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', fontFamily: 'var(--aa-font-mono)' }}>
                {result.score}%
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--aa-text-muted)' }}>
                Compatibility Score
              </div>
            </div>
          </div>

          {/* Framework Output Tabs */}
          <div className="framework-pills">
            <button
              className={`framework-pill-btn ${activeOutputTab === 'react' ? 'active' : ''}`}
              onClick={() => setActiveOutputTab('react')}
            >
              React TSX
            </button>
            <button
              className={`framework-pill-btn ${activeOutputTab === 'angular' ? 'active' : ''}`}
              onClick={() => setActiveOutputTab('angular')}
            >
              Angular HTML
            </button>
            <button
              className={`framework-pill-btn ${activeOutputTab === 'jquery' ? 'active' : ''}`}
              onClick={() => setActiveOutputTab('jquery')}
            >
              jQuery JS
            </button>
          </div>

          <div>
            <CodeSnippetViewer
              code={
                activeOutputTab === 'react'
                  ? result.reactCode
                  : activeOutputTab === 'angular'
                  ? result.angularCode
                  : result.jqueryCode
              }
              language={activeOutputTab === 'react' ? 'tsx' : activeOutputTab === 'angular' ? 'html' : 'javascript'}
              title={`Generated Aaira ${activeOutputTab.toUpperCase()} Code`}
            />
          </div>
        </div>
      </div>

      {/* Attribute Mapping Table */}
      <div style={{ background: 'var(--aa-bg-surface)', border: '1px solid var(--aa-border-subtle)', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px', color: 'var(--aa-text-primary)' }}>
          Attribute &amp; Directive Mapping Report
        </h3>
        <div className="aa-table-wrapper">
          <table className="aa-table">
            <thead>
              <tr>
                <th>Original WebForms Attribute</th>
                <th>Mapped Aaira Equivalent</th>
                <th>Status</th>
                <th>Architectural Note</th>
              </tr>
            </thead>
            <tbody>
              {result.attributes.map((attr, idx) => (
                <tr key={idx}>
                  <td style={{ fontFamily: 'var(--aa-font-mono)', fontWeight: 600 }}>{attr.original}</td>
                  <td style={{ fontFamily: 'var(--aa-font-mono)', color: 'var(--aa-brand-primary)' }}>{attr.mapped}</td>
                  <td>
                    <span className={`badge-chip ${attr.status === 'supported' ? 'enterprise' : 'new'}`}>
                      {attr.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ color: 'var(--aa-text-secondary)', fontSize: '13px' }}>{attr.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {result.recommendations.length > 0 && (
          <div style={{ marginTop: '16px', padding: '14px', borderRadius: '8px', background: 'var(--aa-bg-subtle)', border: '1px solid var(--aa-border-subtle)' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--aa-text-primary)', marginBottom: '6px' }}>
              Migration Modernization Tips:
            </div>
            <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--aa-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {result.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
