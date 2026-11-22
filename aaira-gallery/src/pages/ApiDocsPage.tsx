import React from 'react';
import { apiAreas } from '../data/apiDocs/manifest';
import { ApiRoute, findEntry } from '../lib/apiRoute';
import { ApiDocViewer } from '../components/ApiDocViewer';
import { IconArrowRight, IconExternalLink } from '../components/Icons';

const SOURCE_URL = 'https://github.com/ahsan-wolf/webforms-ts-controls/blob/main/docs';

interface ApiDocsPageProps {
  route: ApiRoute;
  onNavigate: (route: ApiRoute) => void;
}

export const ApiDocsPage: React.FC<ApiDocsPageProps> = ({ route, onNavigate }) => {
  const found = findEntry(route.areaId, route.entryId);
  const area = apiAreas.find((a) => a.id === route.areaId);
  const index = found && area ? area.entries.findIndex((e) => e.id === found.entry.id) : -1;
  const prev = area && index > 0 ? area.entries[index - 1] : undefined;
  const next = area && index >= 0 ? area.entries[index + 1] : undefined;

  return (
    <div className="aa-docs-page">
      <ApiDocViewer route={route} onNavigate={onNavigate} />

      {found && area && (
        <footer className="aa-doc-foot">
          <div className="aa-doc-pn">
            {prev ? (
              <button className="btn-secondary" onClick={() => onNavigate({ areaId: area.id, entryId: prev.id })}>
                ← {prev.title}
              </button>
            ) : <span />}
            {next ? (
              <button className="btn-secondary" onClick={() => onNavigate({ areaId: area.id, entryId: next.id })}>
                {next.title} <IconArrowRight size={14} />
              </button>
            ) : <span />}
          </div>
          <a className="aa-doc-source" href={`${SOURCE_URL}/${found.entry.source}`} target="_blank" rel="noopener noreferrer">
            <IconExternalLink size={13} /> View Markdown source
          </a>
        </footer>
      )}
    </div>
  );
};
