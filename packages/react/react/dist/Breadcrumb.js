import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useReducer } from 'react';
const DEFAULT_ITEMS = [
    { text: 'Home', url: '/' },
    { text: 'Section', url: '#' },
    { text: 'Current Page' }
];
export const Breadcrumb = ({ items = DEFAULT_ITEMS, controller, separator, className = '', ariaLabel = 'breadcrumb', onItemClick }) => {
    const [, refresh] = useReducer((n) => n + 1, 0);
    useEffect(() => (controller ? controller.stateChanged.subscribe(() => refresh()) : undefined), [controller]);
    let crumbs;
    if (controller) {
        crumbs = controller.getItems().map(item => ({
            text: item.text,
            title: controller.showToolTips ? item.node.description || undefined : undefined,
            href: item.isLink && item.url ? item.url : undefined,
            current: item.itemType === 'Current',
            source: item
        }));
    }
    else {
        crumbs = items.map((item, idx) => ({
            text: item.text ?? item.title ?? `Page ${idx + 1}`,
            title: item.title && item.text ? item.title : undefined,
            href: item.url ?? item.navigateUrl,
            current: idx === items.length - 1,
            source: item
        }));
    }
    const sepValue = typeof separator === 'string' || typeof separator === 'number'
        ? String(separator)
        : controller
            ? controller.pathSeparator
            : ' / ';
    const elements = [];
    crumbs.forEach((crumb, idx) => {
        if (idx > 0) {
            elements.push(_jsx("span", { className: "sep", "aria-hidden": "true", "data-separator": sepValue }, `sep${idx}`));
        }
        if (crumb.href && (!crumb.current || controller)) {
            elements.push(_jsx("a", { href: crumb.href, className: crumb.current ? 'current' : undefined, "aria-current": crumb.current ? 'page' : undefined, title: crumb.title, onClick: e => {
                    if (onItemClick) {
                        e.preventDefault();
                        onItemClick(crumb.source);
                    }
                }, children: crumb.text }, idx));
        }
        else {
            elements.push(_jsx("span", { className: crumb.current ? 'current' : undefined, "aria-current": crumb.current ? 'page' : undefined, title: crumb.title, children: crumb.text }, idx));
        }
    });
    return (_jsx("nav", { "aria-label": ariaLabel, className: "wf-breadcrumb", children: _jsx("span", { className: className || undefined, children: elements }) }));
};
//# sourceMappingURL=Breadcrumb.js.map