import React, { useEffect, useRef, useState } from 'react';
import { areaLoaders } from '../data/apiDocs/manifest';
import { ApiRoute, findEntry, parseApiHash } from '../lib/apiRoute';
import { IconCode } from './Icons';

type AreaHtml = Record<string, Record<string, string>>;
const areaCache = new Map<string, Promise<AreaHtml>>();

/** Loads (once) the rendered HTML of one documentation area. Each area is its own lazy chunk. */
export function loadAreaHtml(areaId: string): Promise<AreaHtml> {
  let pending = areaCache.get(areaId);
  if (!pending) {
    const loader = areaLoaders[areaId];
    if (!loader) return Promise.reject(new Error(`Unknown documentation area '${areaId}'.`));
    pending = loader().then((m) => m.default);
    areaCache.set(areaId, pending);
  }
  return pending;
}

interface ApiDocViewerProps {
  route: ApiRoute;
  onNavigate: (route: ApiRoute) => void;
  /** Embedded in another page (the control detail API tab): no big title block. */
  embedded?: boolean;
}

export const ApiDocViewer: React.FC<ApiDocViewerProps> = ({ route, onNavigate, embedded = false }) => {
  const found = findEntry(route.areaId, route.entryId);
  const [html, setHtml] = useState<AreaHtml | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    setError(null);
    loadAreaHtml(route.areaId)
      .then((h) => { if (alive) setHtml(h); })
      .catch((e: unknown) => { if (alive) setError(e instanceof Error ? e.message : String(e)); });
    return () => { alive = false; };
  }, [route.areaId]);

  const entry = found?.entry;
  const tab = entry?.tabs.find((t) => t.id === route.tabId) ?? entry?.tabs[0];
  const content = html && entry && tab ? html[entry.id]?.[tab.id] : undefined;

  // After the tab renders: jump to the requested anchor.
  useEffect(() => {
    if (!content || !route.anchor) return;
    const el = bodyRef.current?.querySelector(`[id="${CSS.escape(route.anchor)}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [content, route.anchor, route.entryId, route.tabId]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    const copy = target.closest<HTMLButtonElement>('.copy-btn');
    if (copy) {
      const code = copy.closest('.code-block')?.querySelector('code')?.textContent ?? '';
      void navigator.clipboard.writeText(code).then(() => {
        copy.textContent = 'Copied!';
        window.setTimeout(() => { copy.textContent = 'Copy'; }, 1500);
      });
      return;
    }

    const link = target.closest<HTMLAnchorElement>('a[href^="#/api"]');
    if (link) {
      e.preventDefault();
      const next = parseApiHash(link.getAttribute('href') ?? '');
      if (next) onNavigate(next);
    }
  };

  if (!found || !entry) {
    return (
      <div className="aa-doc-empty">
        <h2>Page not found</h2>
        <p>
          There is no documentation page for <code>{route.areaId}/{route.entryId}</code>.
        </p>
      </div>
    );
  }

  return (
    <div className={`aa-doc-viewer ${embedded ? 'embedded' : ''}`}>
      {!embedded && (
        <header className="aa-doc-head">
          <div className="aa-doc-crumbs">
            <span>{found.area.title}</span>
            <span aria-hidden="true">›</span>
            <span>{entry.kind === 'class' ? 'Class reference' : 'Topic'}</span>
          </div>
          <h1 className="aa-doc-title">{entry.title}</h1>
          {entry.summary && <p className="aa-doc-summary">{entry.summary}</p>}
        </header>
      )}

      {entry.tabs.length > 1 && (
        <div className="detail-tabs-bar aa-doc-tabs" role="tablist" aria-label={`${entry.title} sections`}>
          {entry.tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={t.id === tab?.id}
              className={`detail-tab ${t.id === tab?.id ? 'active' : ''}`}
              onClick={() => onNavigate({ areaId: route.areaId, entryId: entry.id, tabId: t.id })}
            >
              {t.title}
            </button>
          ))}
        </div>
      )}

      {error && <p className="aa-doc-error">Could not load this page: {error}</p>}
      {!error && !content && (
        <div className="aa-doc-loading">
          <IconCode size={16} /> Loading documentation…
        </div>
      )}
      {content && (
        <div
          ref={bodyRef}
          className="aa-doc"
          onClick={handleClick}
          // The HTML is generated at build time from our own Markdown (scripts/build-api-docs.mjs); it is not user input.
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  );
};
