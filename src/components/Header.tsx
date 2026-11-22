import React from 'react';
import { Framework, Theme } from '../types/gallery';
import { IconSearch, IconSun, IconMoon, IconSparkles } from './Icons';

interface HeaderProps {
  activePage: string;
  onNavigate: (page: 'home' | 'controls' | 'migration' | 'ai' | 'docs' | 'api' | 'styles') => void;
  framework: Framework;
  onFrameworkChange: (fw: Framework) => void;
  theme: Theme;
  onThemeToggle: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onNavigate,
  framework,
  onFrameworkChange,
  theme,
  onThemeToggle,
  onOpenSearch,
}) => {
  return (
    <header className="portal-header">
      <div className="brand-section" onClick={() => onNavigate('home')}>
        <div className="brand-logo-icon">Aa</div>
        <div>
          <span className="brand-title">Aaira Controls</span>
        </div>
        <span className="brand-badge">Enterprise UI</span>
      </div>

      <nav className="nav-links">
        <button
          className={`nav-link-btn ${activePage === 'home' ? 'active' : ''}`}
          onClick={() => onNavigate('home')}
        >
          Home
        </button>
        <button
          className={`nav-link-btn ${activePage === 'controls' ? 'active' : ''}`}
          onClick={() => onNavigate('controls')}
        >
          Controls Gallery
        </button>
        <button
          className={`nav-link-btn ${activePage === 'migration' ? 'active' : ''}`}
          onClick={() => onNavigate('migration')}
        >
          Migration Center
        </button>
        <button
          className={`nav-link-btn ${activePage === 'ai' ? 'active' : ''}`}
          onClick={() => onNavigate('ai')}
        >
          <IconSparkles size={14} style={{ color: '#a855f7' }} />
          AI Controls
        </button>
        <button
          className={`nav-link-btn ${activePage === 'api' ? 'active' : ''}`}
          onClick={() => onNavigate('api')}
        >
          API Docs
        </button>
        <button
          className={`nav-link-btn ${activePage === 'styles' ? 'active' : ''}`}
          onClick={() => onNavigate('styles')}
        >
          Style Sheets
        </button>
        <button
          className={`nav-link-btn ${activePage === 'docs' ? 'active' : ''}`}
          onClick={() => onNavigate('docs')}
        >
          Docs
        </button>
      </nav>

      <div className="header-actions">
        {/* Framework Selector Pills */}
        <div className="framework-pills" title="Default code display framework">
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
            jQuery
          </button>
        </div>

        {/* Global Search Button */}
        <button className="search-trigger-btn" onClick={onOpenSearch} title="Search Controls & APIs">
          <IconSearch size={14} />
          <span>Search...</span>
          <span className="kbd-shortcut">Ctrl+K</span>
        </button>

        {/* Theme Toggle */}
        <button
          className="icon-action-btn"
          onClick={onThemeToggle}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
        </button>
      </div>
    </header>
  );
};
