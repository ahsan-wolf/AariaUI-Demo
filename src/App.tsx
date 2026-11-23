import React, { useState, useEffect, useCallback } from 'react';
import { Framework, Theme } from './types/gallery';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ApiSidebar } from './components/ApiSidebar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { HomePage } from './pages/HomePage';
import { ControlDetailPage } from './pages/ControlDetailPage';
import { MigrationCenterPage } from './pages/MigrationCenterPage';
import { DocsViewerPage } from './pages/DocsViewerPage';
import { ApiDocsPage } from './pages/ApiDocsPage';
import { StyleSheetsPage } from './pages/StyleSheetsPage';
import { ApiRoute, DEFAULT_API_ROUTE, formatApiHash, parseApiHash } from './lib/apiRoute';
import './styles/theme.css';
import './styles/docs.css';

type Page = 'home' | 'controls' | 'migration' | 'docs' | 'api' | 'styles';

export const App: React.FC = () => {
  const initialApiRoute = parseApiHash(window.location.hash);
  const [activePage, setActivePage] = useState<Page>(initialApiRoute ? 'api' : 'home');
  const [apiRoute, setApiRoute] = useState<ApiRoute>(initialApiRoute ?? DEFAULT_API_ROUTE);
  const [selectedControlId, setSelectedControlId] = useState<string>('grid-view');
  const [framework, setFramework] = useState<Framework>('react');
  const [theme, setTheme] = useState<Theme>('dark');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Browser back/forward and pasted links: #/api/<area>/<entry>/<tab>/<anchor>
  useEffect(() => {
    const onHashChange = () => {
      const route = parseApiHash(window.location.hash);
      if (route) {
        setApiRoute(route);
        setActivePage('api');
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleNavigate = (page: Page, controlId?: string) => {
    setActivePage(page);
    if (controlId) {
      setSelectedControlId(controlId);
    }
    if (page !== 'api' && window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    if (page === 'api') {
      window.history.replaceState(null, '', formatApiHash(apiRoute));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectControl = (id: string) => {
    setSelectedControlId(id);
    setActivePage('controls');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Open (and deep-link) a page of the API documentation. */
  const handleOpenApi = useCallback((route: ApiRoute) => {
    setApiRoute(route);
    setActivePage('api');
    const hash = formatApiHash(route);
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
    if (!route.anchor) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="app-container">
      <Header
        activePage={activePage}
        onNavigate={handleNavigate}
        framework={framework}
        onFrameworkChange={setFramework}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <div className="portal-body">
        {activePage === 'controls' && (
          <Sidebar
            selectedControlId={selectedControlId}
            onSelectControl={handleSelectControl}
          />
        )}

        {activePage === 'api' && <ApiSidebar route={apiRoute} onNavigate={handleOpenApi} />}

        <main className="portal-main-content">
          {activePage === 'home' && (
            <HomePage
              onNavigate={handleNavigate}
              framework={framework}
              onFrameworkChange={setFramework}
            />
          )}

          {activePage === 'controls' && (
            <ControlDetailPage
              controlId={selectedControlId}
              framework={framework}
              onFrameworkChange={setFramework}
              onOpenApi={handleOpenApi}
            />
          )}

          {activePage === 'migration' && <MigrationCenterPage />}

          {activePage === 'docs' && <DocsViewerPage onOpenApi={handleOpenApi} />}

          {activePage === 'styles' && <StyleSheetsPage />}

          {activePage === 'api' && <ApiDocsPage route={apiRoute} onNavigate={handleOpenApi} />}
        </main>
      </div>

      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectControl={handleSelectControl}
        onOpenApi={handleOpenApi}
      />

      <footer
        style={{
          borderTop: '1px solid var(--aa-border-subtle)',
          padding: '24px 32px',
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--aa-text-muted)',
          background: 'var(--aa-bg-surface)',
        }}
      >
        <p>
          <strong>Aaira Controls Framework</strong> &mdash; Enterprise UI Suite for React, Angular &amp; WebForms Modernization.
        </p>
        <p style={{ marginTop: '4px' }}>
          Licensed under MIT &bull; Zero DOM Core Architecture &bull; 103/103 Automated Unit Tests Passing.
        </p>
      </footer>
    </div>
  );
};
