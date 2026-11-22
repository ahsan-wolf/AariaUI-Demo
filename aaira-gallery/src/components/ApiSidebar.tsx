import React, { useMemo, useState } from 'react';
import { apiAreas } from '../data/apiDocs/manifest';
import { ApiRoute } from '../lib/apiRoute';
import {
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconDatabase,
  IconGrid,
  IconLayers,
  IconSearch,
  IconShield,
  IconTree,
  IconZap,
  IconList
} from './Icons';

const AREA_ICONS: Record<string, React.ReactNode> = {
  database: <IconDatabase size={15} />,
  link: <IconZap size={15} />,
  grid: <IconGrid size={15} />,
  check: <IconCheck size={15} />,
  tree: <IconTree size={15} />,
  shield: <IconShield size={15} />,
  calendar: <IconCalendar size={15} />,
  zap: <IconZap size={15} />,
  layers: <IconLayers size={15} />,
  book: <IconList size={15} />
};

interface ApiSidebarProps {
  route: ApiRoute;
  onNavigate: (route: ApiRoute) => void;
}

export const ApiSidebar: React.FC<ApiSidebarProps> = ({ route, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const q = query.trim().toLowerCase();
  const areas = useMemo(
    () =>
      apiAreas
        .map((area) => ({
          ...area,
          entries: q
            ? area.entries.filter((e) => e.title.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q) || area.title.toLowerCase().includes(q))
            : area.entries
        }))
        .filter((a) => a.entries.length > 0),
    [q]
  );

  return (
    <aside className="portal-sidebar" aria-label="API documentation">
      <div className="sidebar-search-box">
        <span className="sidebar-search-icon"><IconSearch size={14} /></span>
        <input
          type="text"
          className="sidebar-search-input"
          placeholder="Filter classes & topics..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {areas.map((area) => {
        // Open while filtering and for the area being read; otherwise closed unless the user opened it.
        const isCollapsed = q ? false : collapsed[area.id] ?? area.id !== route.areaId;
        return (
          <div key={area.id} className="category-group">
            <div className="category-header" onClick={() => setCollapsed((p) => ({ ...p, [area.id]: !isCollapsed }))}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {AREA_ICONS[area.icon]}
                <span>{area.title}</span>
              </div>
              {isCollapsed ? <IconChevronRight size={14} /> : <IconChevronDown size={14} />}
            </div>

            {!isCollapsed && (
              <div style={{ marginTop: '4px' }}>
                {area.entries.map((entry) => {
                  const active = route.areaId === area.id && route.entryId === entry.id;
                  return (
                    <div
                      key={entry.id}
                      className={`control-nav-item aa-api-nav-item ${active ? 'active' : ''} ${entry.kind}`}
                      onClick={() => onNavigate({ areaId: area.id, entryId: entry.id })}
                      title={entry.summary}
                    >
                      <span className="aa-api-nav-label">{entry.title}</span>
                      {entry.kind === 'class' && <span className="aa-api-kind" aria-label="class">{'{ }'}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {areas.length === 0 && <p className="aa-doc-nomatch">Nothing matches “{query}”.</p>}
    </aside>
  );
};
