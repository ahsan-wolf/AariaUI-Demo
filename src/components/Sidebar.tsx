import React, { useState } from 'react';
import { controlsRegistry } from '../data/controlsRegistry';
import { ControlCategory, Edition } from '../types/gallery';
import { EditionChip } from './EditionChip';
import {
  IconSearch,
  IconGrid,
  IconCheck,
  IconTree,
  IconZap,
  IconShield,
  IconCalendar,
  IconDatabase,
  IconChevronDown,
  IconChevronRight,
} from './Icons';

interface SidebarProps {
  selectedControlId?: string;
  onSelectControl: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ selectedControlId, onSelectControl }) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [editionFilter, setEditionFilter] = useState<Edition | 'all'>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const categories: { name: ControlCategory; icon: React.ReactNode }[] = [
    { name: 'ADO.NET Data Core', icon: <IconDatabase size={15} /> },
    { name: 'Data Controls', icon: <IconGrid size={15} /> },
    { name: 'Data Sources', icon: <IconDatabase size={15} /> },
    { name: 'Input & Validation', icon: <IconCheck size={15} /> },
    { name: 'Navigation', icon: <IconTree size={15} /> },
    { name: 'AJAX & Behaviors', icon: <IconZap size={15} /> },
    { name: 'Login & Security', icon: <IconShield size={15} /> },
    { name: 'Specialized', icon: <IconCalendar size={15} /> },
  ];

  const toggleCategory = (catName: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catName]: !prev[catName] }));
  };

  const filteredControls = controlsRegistry.filter((ctrl) =>
    (editionFilter === 'all' || ctrl.edition === editionFilter) &&
    (ctrl.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      ctrl.aspEquivalent.toLowerCase().includes(filterQuery.toLowerCase()) ||
      ctrl.category.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <aside className="portal-sidebar">
      <div className="sidebar-search-box">
        <span className="sidebar-search-icon">
          <IconSearch size={14} />
        </span>
        <input
          type="text"
          className="sidebar-search-input"
          placeholder="Filter controls..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
        />
      </div>

      <div className="edition-filter" role="group" aria-label="Filter by edition">
        {(['all', 'free', 'pro', 'enterprise'] as const).map((e) => (
          <button key={e} className={editionFilter === e ? 'active' : ''} data-edition-filter={e} onClick={() => setEditionFilter(e)}>
            {e === 'all' ? 'All' : e === 'free' ? 'Free' : e === 'pro' ? 'Pro' : 'Enterprise'}
          </button>
        ))}
      </div>

      {categories.map((cat) => {
        const catControls = filteredControls.filter((c) => c.category === cat.name);
        if (catControls.length === 0) return null;
        const isCollapsed = collapsedCategories[cat.name];

        return (
          <div key={cat.name} className="category-group">
            <div className="category-header" onClick={() => toggleCategory(cat.name)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {cat.icon}
                <span>{cat.name}</span>
              </div>
              {isCollapsed ? <IconChevronRight size={14} /> : <IconChevronDown size={14} />}
            </div>

            {!isCollapsed && (
              <div style={{ marginTop: '4px' }}>
                {catControls.map((ctrl) => (
                  <div
                    key={ctrl.id}
                    className={`control-nav-item ${selectedControlId === ctrl.id ? 'active' : ''}`}
                    onClick={() => onSelectControl(ctrl.id)}
                  >
                    <span>{ctrl.name}</span>
                    <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                      {ctrl.badge && ctrl.badge !== 'Stable' && (
                        <span className={`badge-chip ${ctrl.badge.toLowerCase()}`}>
                          {ctrl.badge}
                        </span>
                      )}
                      <EditionChip edition={ctrl.edition} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
};
