import React, { useState, useEffect, useId } from 'react';
import type { TabsController, TabItem } from '@wf-controls/core';

export interface TabDefinition extends TabItem {
  content?: React.ReactNode | undefined;
}

export interface WebFormsTabsProps {
  controller?: TabsController | undefined;
  tabs?: TabDefinition[] | undefined;
  activeTabIndex?: number | undefined;
  onActiveTabChanged?: ((newIndex: number) => void) | undefined;
  className?: string | undefined;
  children?: React.ReactNode | undefined;
}

export const WebFormsTabs: React.FC<WebFormsTabsProps> = ({
  controller,
  tabs = [],
  activeTabIndex: controlledIndex,
  onActiveTabChanged,
  className = '',
  children
}) => {
  const [internalIndex, setInternalIndex] = useState(
    controller ? controller.activeTabIndex : (controlledIndex ?? 0)
  );

  useEffect(() => {
    if (!controller) return;

    const unsub = controller.activeTabChanged.subscribe((_, e) => {
      setInternalIndex(e.activeIndex);
    });

    return () => {
      unsub();
    };
  }, [controller]);

  useEffect(() => {
    if (controlledIndex !== undefined) {
      setInternalIndex(controlledIndex);
    }
  }, [controlledIndex]);

  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;

  const handleSelectTab = (idx: number) => {
    if (controller) {
      controller.setActiveTab(idx);
    } else {
      setInternalIndex(idx);
    }
    if (onActiveTabChanged) {
      onActiveTabChanged(idx);
    }
  };

  const renderedTabs = tabs.length > 0 ? tabs : (controller ? (controller.tabs as TabDefinition[]) : []);

  const uid = useId();
  const tabIdOf = (tab: TabDefinition, idx: number) => `${uid}-tab-${tab.id || idx}`;
  const panelIdOf = (tab: TabDefinition, idx: number) => `${uid}-panel-${tab.id || idx}`;
  const isSelectable = (t: TabDefinition | undefined) => !!t && t.enabled !== false && t.visible !== false;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let target = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const step = e.key === 'ArrowRight' ? 1 : -1;
      for (let i = activeIndex + step; i >= 0 && i < renderedTabs.length; i += step) {
        if (isSelectable(renderedTabs[i])) { target = i; break; }
      }
    } else if (e.key === 'Home') {
      target = renderedTabs.findIndex(isSelectable);
    } else if (e.key === 'End') {
      for (let i = renderedTabs.length - 1; i >= 0; i--) { if (isSelectable(renderedTabs[i])) { target = i; break; } }
    } else {
      return;
    }
    e.preventDefault();
    if (target >= 0) {
      handleSelectTab(target);
      const root = e.currentTarget as HTMLElement;
      const id = tabIdOf(renderedTabs[target] as TabDefinition, target);
      setTimeout(() => (Array.from(root.querySelectorAll<HTMLElement>('[role="tab"]')).find(b => b.id === id))?.focus());
    }
  };

  return (
    <div className={`wf-tabs ${className}`.trim()}>
      <ul className="ajax__tab_header nav nav-tabs mb-3" role="tablist" onKeyDown={handleKeyDown}>
        {renderedTabs.map((tab, idx) => {
          if (tab.visible === false) return null;
          const isActive = idx === activeIndex;
          const isDisabled = tab.enabled === false;
          return (
            <li key={tab.id || idx} className="nav-item" role="presentation">
              <span className={`ajax__tab_outer${isActive ? ' ajax__tab_active' : ''}`}>
                <span className="ajax__tab_inner">
                  <button
                    type="button"
                    id={tabIdOf(tab, idx)}
                    className={`ajax__tab_tab nav-link ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`.trim()}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={panelIdOf(tab, idx)}
                    tabIndex={isActive ? 0 : -1}
                    disabled={isDisabled}
                    onClick={() => !isDisabled && handleSelectTab(idx)}
                  >
                    {tab.headerText}
                  </button>
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="tab-content">
        {renderedTabs.map((tab, idx) => {
          const isActive = idx === activeIndex;
          if (!isActive || tab.visible === false) return null;
          return (
            <div key={tab.id || idx} id={panelIdOf(tab, idx)} aria-labelledby={tabIdOf(tab, idx)} className="tab-pane active ajax__tab_body" role="tabpanel">
              {tab.content}
            </div>
          );
        })}
        {children}
      </div>
    </div>
  );
};
