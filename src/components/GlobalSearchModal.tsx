import React, { useState, useEffect, useMemo } from 'react';
import { controlsRegistry } from '../data/controlsRegistry';
import { apiAreas } from '../data/apiDocs/manifest';
import type { ApiSearchRecord } from '../data/apiDocs/types';
import type { ApiRoute } from '../lib/apiRoute';
import { IconSearch, IconX, IconChevronRight, IconCode } from './Icons';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectControl: (id: string) => void;
  onOpenApi: (route: ApiRoute) => void;
}

const MAX_API_RESULTS = 10;

/** Parses "word*count word2" into a map, once per record (the index stores how often each identifier occurs in the section). */
const tokenCache = new WeakMap<ApiSearchRecord, Map<string, number>>();
function tokensOf(r: ApiSearchRecord): Map<string, number> {
  let m = tokenCache.get(r);
  if (!m) {
    m = new Map();
    for (const part of r.k.split(' ')) {
      const [word, n] = part.split('*');
      if (word) m.set(word, n ? Number(n) : 1);
    }
    tokenCache.set(r, m);
  }
  return m;
}

/** Ranks API records for a query: every word must match somewhere; names beat identifiers (more occurrences = more about it) beat body text. */
function searchApi(records: ApiSearchRecord[], query: string): ApiSearchRecord[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const scored: { r: ApiSearchRecord; score: number }[] = [];
  for (const r of records) {
    const name = r.n.toLowerCase();
    const tokens = tokensOf(r);
    let score = 0;
    for (const w of words) {
      let s = 0;
      if (name.includes(w)) s += name.startsWith(w) ? 14 : 10;
      const exact = tokens.get(w);
      if (exact !== undefined) s += 6 + Math.min(exact, 20);
      else if ([...tokens.keys()].some((t) => t.startsWith(w))) s += 3;
      if (s === 0 && r.x.toLowerCase().includes(w)) s += 1;
      if (s === 0) { score = 0; break; }
      score += s;
    }
    if (score > 0) scored.push({ r, score: score + r.p * 3 });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, MAX_API_RESULTS).map((x) => x.r);
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectControl,
  onOpenApi,
}) => {
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<ApiSearchRecord[] | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // The API search index is a separate chunk: fetch it the first time the modal opens.
  useEffect(() => {
    if (isOpen && !records) {
      void import('../data/apiDocs/search').then((m) => setRecords(m.default));
    }
  }, [isOpen, records]);

  const apiResults = useMemo(() => (records ? searchApi(records, query) : []), [records, query]);

  if (!isOpen) return null;

  const results = controlsRegistry.filter((ctrl) =>
    ctrl.name.toLowerCase().includes(query.toLowerCase()) ||
    ctrl.aspEquivalent.toLowerCase().includes(query.toLowerCase()) ||
    ctrl.tagline.toLowerCase().includes(query.toLowerCase()) ||
    ctrl.category.toLowerCase().includes(query.toLowerCase())
  );

  const areaTitle = (id: string) => apiAreas.find((a) => a.id === id)?.title ?? id;
  const nothing = results.length === 0 && apiResults.length === 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-input-row">
          <IconSearch size={18} style={{ color: '#94a3b8' }} />
          <input
            type="text"
            className="modal-search-input"
            placeholder="Search controls, ASP.NET tags, classes, methods, events..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
          >
            <IconX size={18} />
          </button>
        </div>

        <div className="modal-results-list">
          {nothing ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              No results matching &quot;{query}&quot;
            </div>
          ) : (
            <>
              {results.length > 0 && (
                <div className="aa-search-heading">Controls</div>
              )}
              {results.map((ctrl) => (
                <div
                  key={ctrl.id}
                  className="modal-result-item"
                  onClick={() => {
                    onSelectControl(ctrl.id);
                    onClose();
                  }}
                >
                  <div className="result-main">
                    <div>
                      <div className="result-name">{ctrl.name}</div>
                      <div className="result-category">{ctrl.category} &bull; {ctrl.aspEquivalent}</div>
                    </div>
                  </div>
                  <IconChevronRight size={14} style={{ color: '#94a3b8' }} />
                </div>
              ))}

              {apiResults.length > 0 && (
                <div className="aa-search-heading">API reference</div>
              )}
              {apiResults.map((r) => (
                <div
                  key={`${r.a}/${r.e}/${r.t}`}
                  className="modal-result-item"
                  onClick={() => {
                    onOpenApi({ areaId: r.a, entryId: r.e, tabId: r.t });
                    onClose();
                  }}
                >
                  <div className="result-main">
                    <IconCode size={15} style={{ color: '#6366f1', flex: 'none' }} />
                    <div>
                      <div className="result-name">{r.n}</div>
                      <div className="result-category">{areaTitle(r.a)} &bull; {r.x.slice(0, 90)}</div>
                    </div>
                  </div>
                  <IconChevronRight size={14} style={{ color: '#94a3b8' }} />
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
