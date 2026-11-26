import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useId } from 'react';
export const WebFormsTabs = ({ controller, tabs = [], activeTabIndex: controlledIndex, onActiveTabChanged, className = '', children }) => {
    const [internalIndex, setInternalIndex] = useState(controller ? controller.activeTabIndex : (controlledIndex ?? 0));
    useEffect(() => {
        if (!controller)
            return;
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
    const handleSelectTab = (idx) => {
        if (controller) {
            controller.setActiveTab(idx);
        }
        else {
            setInternalIndex(idx);
        }
        if (onActiveTabChanged) {
            onActiveTabChanged(idx);
        }
    };
    const renderedTabs = tabs.length > 0 ? tabs : (controller ? controller.tabs : []);
    const uid = useId();
    const tabIdOf = (tab, idx) => `${uid}-tab-${tab.id || idx}`;
    const panelIdOf = (tab, idx) => `${uid}-panel-${tab.id || idx}`;
    const isSelectable = (t) => !!t && t.enabled !== false && t.visible !== false;
    const handleKeyDown = (e) => {
        let target = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            const step = e.key === 'ArrowRight' ? 1 : -1;
            for (let i = activeIndex + step; i >= 0 && i < renderedTabs.length; i += step) {
                if (isSelectable(renderedTabs[i])) {
                    target = i;
                    break;
                }
            }
        }
        else if (e.key === 'Home') {
            target = renderedTabs.findIndex(isSelectable);
        }
        else if (e.key === 'End') {
            for (let i = renderedTabs.length - 1; i >= 0; i--) {
                if (isSelectable(renderedTabs[i])) {
                    target = i;
                    break;
                }
            }
        }
        else {
            return;
        }
        e.preventDefault();
        if (target >= 0) {
            handleSelectTab(target);
            const root = e.currentTarget;
            const id = tabIdOf(renderedTabs[target], target);
            setTimeout(() => (Array.from(root.querySelectorAll('[role="tab"]')).find(b => b.id === id))?.focus());
        }
    };
    return (_jsxs("div", { className: `wf-tabs ${className}`.trim(), children: [_jsx("ul", { className: "ajax__tab_header nav nav-tabs mb-3", role: "tablist", onKeyDown: handleKeyDown, children: renderedTabs.map((tab, idx) => {
                    if (tab.visible === false)
                        return null;
                    const isActive = idx === activeIndex;
                    const isDisabled = tab.enabled === false;
                    return (_jsx("li", { className: "nav-item", role: "presentation", children: _jsx("span", { className: `ajax__tab_outer${isActive ? ' ajax__tab_active' : ''}`, children: _jsx("span", { className: "ajax__tab_inner", children: _jsx("button", { type: "button", id: tabIdOf(tab, idx), className: `ajax__tab_tab nav-link ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`.trim(), role: "tab", "aria-selected": isActive, "aria-controls": panelIdOf(tab, idx), tabIndex: isActive ? 0 : -1, disabled: isDisabled, onClick: () => !isDisabled && handleSelectTab(idx), children: tab.headerText }) }) }) }, tab.id || idx));
                }) }), _jsxs("div", { className: "tab-content", children: [renderedTabs.map((tab, idx) => {
                        const isActive = idx === activeIndex;
                        if (!isActive || tab.visible === false)
                            return null;
                        return (_jsx("div", { id: panelIdOf(tab, idx), "aria-labelledby": tabIdOf(tab, idx), className: "tab-pane active ajax__tab_body", role: "tabpanel", children: tab.content }, tab.id || idx));
                    }), children] })] }));
};
//# sourceMappingURL=WebFormsTabs.js.map