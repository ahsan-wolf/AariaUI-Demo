import React, { useState } from 'react';
import { IconSliders } from './Icons';

interface MenuItem {
  id: string;
  text: string;
  value: string;
  icon?: string;
  badge?: string;
  children?: MenuItem[];
}

const menuData: MenuItem[] = [
  {
    id: 'file',
    text: 'File',
    value: 'FILE_ROOT',
    icon: '📁',
    children: [
      { id: 'f-new-proj', text: 'New Project...', value: 'NEW_PROJ', icon: '✨' },
      { id: 'f-new-file', text: 'New File', value: 'NEW_FILE', icon: '📄' },
      { id: 'f-open', text: 'Open Solution...', value: 'OPEN_SOL', icon: '📂' },
      { id: 'f-save', text: 'Save All', value: 'SAVE_ALL', icon: '💾' },
      { id: 'f-export', text: 'Export DataSet to XML', value: 'EXPORT_XML', icon: '📤', badge: 'ADO.NET' },
    ],
  },
  {
    id: 'data',
    text: 'Data & Grid',
    value: 'DATA_ROOT',
    icon: '📊',
    children: [
      { id: 'd-refresh', text: 'Rebind GridView (DataBind)', value: 'REBIND_GRID', icon: '🔄' },
      { id: 'd-sqlds', text: 'Configure SqlDataSource', value: 'CONFIG_SQLDS', icon: '🗄️' },
      { id: 'd-servermode', text: 'DevExpress Server Mode (300k)', value: 'SERVER_MODE', icon: '⚡', badge: 'Instant' },
      { id: 'd-export-excel', text: 'Export to Excel / CSV', value: 'EXPORT_EXCEL', icon: '📑' },
    ],
  },
  {
    id: 'edit',
    text: 'Edit',
    value: 'EDIT_ROOT',
    icon: '✏️',
    children: [
      { id: 'e-undo', text: 'Undo', value: 'UNDO', icon: '↩️' },
      { id: 'e-redo', text: 'Redo', value: 'REDO', icon: '↪️' },
      { id: 'e-batch', text: 'Batch Edit Mode', value: 'BATCH_EDIT', icon: '📝' },
    ],
  },
  {
    id: 'view',
    text: 'View',
    value: 'VIEW_ROOT',
    icon: '👁️',
    children: [
      { id: 'v-side', text: 'Toggle Navigation Sidebar', value: 'TOGGLE_SIDEBAR', icon: '📑' },
      { id: 'v-logs', text: 'Live Event Inspector', value: 'VIEW_LOGS', icon: '📜' },
      { id: 'v-density', text: 'Compact Density', value: 'TOGGLE_DENSITY', icon: '📏' },
    ],
  },
  {
    id: 'help',
    text: 'Help & Docs',
    value: 'HELP_ROOT',
    icon: '❓',
    children: [
      { id: 'h-docs', text: 'ASP.NET Migration Guide', value: 'HELP_MIGRATION', icon: '📖' },
      { id: 'h-about', text: 'About Aaira Controls v1.0', value: 'HELP_ABOUT', icon: 'ℹ️' },
    ],
  },
];

export const MenuDemo: React.FC = () => {
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string>('Ready. Click or hover any menu item.');
  const [selectedItem, setSelectedItem] = useState<string>('');

  const handleItemClick = (item: MenuItem, parentText?: string) => {
    const fullPath = parentText ? `${parentText} > ${item.text}` : item.text;
    setSelectedItem(fullPath);
    setLastAction(`MenuItemClick: "${fullPath}" (Value: ${item.value})`);
    setActiveFlyout(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Configurator / Toolbar Bar */}
      <div className="dx-demo-bar">
        <div className="dx-mode-group">
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aa-text-secondary)', marginRight: '6px' }}>
            Orientation:
          </span>
          <button
            className={`dx-mode-pill ${orientation === 'horizontal' ? 'active' : ''}`}
            onClick={() => setOrientation('horizontal')}
          >
            Horizontal (&lt;asp:Menu Orientation=&quot;Horizontal&quot;&gt;)
          </button>
          <button
            className={`dx-mode-pill ${orientation === 'vertical' ? 'active' : ''}`}
            onClick={() => setOrientation('vertical')}
          >
            Vertical (&lt;asp:Menu Orientation=&quot;Vertical&quot;&gt;)
          </button>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--aa-text-muted)', fontFamily: 'var(--aa-font-mono)' }}>
          Active Selection: <span style={{ color: 'var(--aa-brand-primary)', fontWeight: 600 }}>{selectedItem || 'None'}</span>
        </div>
      </div>

      {/* Menu Container */}
      <div
        className="aa-menu-container"
        style={{
          minHeight: orientation === 'vertical' ? '320px' : '90px',
          alignItems: orientation === 'vertical' ? 'flex-start' : 'center',
          position: 'relative',
        }}
      >
        <div className={orientation === 'horizontal' ? 'aa-menu-horizontal' : 'aa-menu-vertical'}>
          {menuData.map((item) => {
            const isOpen = activeFlyout === item.id;
            return (
              <div
                key={item.id}
                className="aa-menu-item-wrapper"
                onMouseEnter={() => setActiveFlyout(item.id)}
                onMouseLeave={() => setActiveFlyout(null)}
              >
                <button
                  className={`aa-menu-btn ${isOpen ? 'active' : ''}`}
                  onClick={() => {
                    if (item.children) {
                      setActiveFlyout(isOpen ? null : item.id);
                    } else {
                      handleItemClick(item);
                    }
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                  {item.children && (
                    <span style={{ fontSize: '10px', opacity: 0.7, marginLeft: '4px' }}>
                      {orientation === 'horizontal' ? '▼' : '▶'}
                    </span>
                  )}
                </button>

                {isOpen && item.children && (
                  <div
                    className={`aa-menu-flyout ${
                      orientation === 'vertical' ? 'aa-menu-flyout-vertical' : ''
                    }`}
                  >
                    {item.children.map((subItem) => (
                      <button
                        key={subItem.id}
                        className="aa-menu-flyout-item"
                        onClick={() => handleItemClick(subItem, item.text)}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{subItem.icon}</span>
                          <span>{subItem.text}</span>
                        </span>
                        {subItem.badge && (
                          <span
                            className="badge-chip enterprise"
                            style={{ fontSize: '10px', padding: '2px 6px' }}
                          >
                            {subItem.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status & Event Feedback */}
      <div
        style={{
          background: 'var(--aa-bg-surface)',
          border: '1px solid var(--aa-border-subtle)',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aa-text-primary)' }}>
            Event Log:
          </span>
          <span style={{ fontSize: '13px', fontFamily: 'var(--aa-font-mono)', color: 'var(--aa-brand-primary)' }}>
            {lastAction}
          </span>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--aa-text-muted)' }}>
          Dispatches standard <code>MenuItemClickEventArgs</code>
        </span>
      </div>

      {/* Features Reference */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          fontSize: '12px',
          color: 'var(--aa-text-secondary)',
        }}
      >
        <div style={{ background: 'var(--aa-bg-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--aa-border-subtle)' }}>
          <strong style={{ color: 'var(--aa-text-primary)', display: 'block', marginBottom: '4px' }}>
            Static & Dynamic Levels
          </strong>
          Supports <code>StaticDisplayLevels=&quot;1&quot;</code> and unlimited dynamic flyout levels on mouse enter.
        </div>
        <div style={{ background: 'var(--aa-bg-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--aa-border-subtle)' }}>
          <strong style={{ color: 'var(--aa-text-primary)', display: 'block', marginBottom: '4px' }}>
            Data Binding
          </strong>
          Seamlessly binds to <code>SiteMapDataSource</code> or in-memory hierarchical collections.
        </div>
        <div style={{ background: 'var(--aa-bg-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--aa-border-subtle)' }}>
          <strong style={{ color: 'var(--aa-text-primary)', display: 'block', marginBottom: '4px' }}>
            Keyboard & Accessibility
          </strong>
          Full ARIA role menubar support with arrow navigation and Enter/Escape triggers.
        </div>
      </div>
    </div>
  );
};
