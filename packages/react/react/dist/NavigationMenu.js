import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
export const NavigationMenu = ({ items = [], controller, orientation = 'horizontal', className = '', ariaLabel = 'Menu', onItemClick }) => {
    const [, setTick] = useState(0);
    const [open, setOpen] = useState([]);
    const closeTimer = useRef(undefined);
    useEffect(() => {
        if (!controller)
            return;
        const unsub = controller.stateChanged.subscribe(() => setTick(t => t + 1));
        return () => { unsub(); };
    }, [controller]);
    const isHorizontal = controller ? controller.orientation === 'Horizontal' : orientation === 'horizontal';
    const topItems = controller ? controller.getStaticItems() : items;
    const childrenOf = (item) => controller ? controller.getDynamicItems(item) : (item.childItems ?? []);
    const isEnabled = (item) => item.enabled !== false;
    const hasPopup = (item) => isEnabled(item) && childrenOf(item).length > 0;
    const isOpen = (item) => open.includes(item);
    const cancelClose = useCallback(() => {
        if (closeTimer.current !== undefined) {
            clearTimeout(closeTimer.current);
            closeTimer.current = undefined;
        }
    }, []);
    const closeAll = useCallback(() => { cancelClose(); setOpen([]); }, [cancelClose]);
    const openItem = (item, ancestors) => { cancelClose(); setOpen([...ancestors, item]); };
    const scheduleClose = () => {
        cancelClose();
        if (open.length)
            closeTimer.current = setTimeout(closeAll, controller?.disappearAfter ?? 500);
    };
    useEffect(() => () => cancelClose(), [cancelClose]);
    // Escape closes an open flyout from anywhere.
    useEffect(() => {
        if (!open.length)
            return;
        const onKey = (e) => { if (e.key === 'Escape')
            closeAll(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open.length, closeAll]);
    const handleClick = async (item, ancestors, e) => {
        if (!isEnabled(item)) {
            e.preventDefault();
            return;
        }
        const href = item.navigateUrl ?? item.url;
        if (hasPopup(item) && !href) {
            e.preventDefault();
            if (isOpen(item))
                closeAll();
            else
                openItem(item, ancestors);
            return;
        }
        if (controller) {
            if (await controller.clickItem(item)) {
                onItemClick?.(item);
                closeAll();
            }
        }
        else {
            onItemClick?.(item);
            closeAll();
        }
    };
    const focusSibling = (el, delta) => {
        const links = Array.from(el.closest('ul')?.querySelectorAll(':scope > li > a') ?? []);
        links[(links.indexOf(el) + delta + links.length) % links.length]?.focus();
    };
    const handleKey = (item, ancestors, top, e) => {
        const el = e.currentTarget;
        const horizontalTop = top && isHorizontal;
        const next = horizontalTop ? 'ArrowRight' : 'ArrowDown';
        const prev = horizontalTop ? 'ArrowLeft' : 'ArrowUp';
        const openKey = horizontalTop ? 'ArrowDown' : 'ArrowRight';
        if (e.key === next || e.key === prev) {
            e.preventDefault();
            focusSibling(el, e.key === next ? 1 : -1);
        }
        else if (e.key === openKey && hasPopup(item)) {
            e.preventDefault();
            openItem(item, ancestors);
            setTimeout(() => el.closest('li')?.querySelector(':scope > ul > li > a')?.focus());
        }
        else if ((e.key === 'ArrowLeft' || e.key === 'Escape') && !top) {
            e.preventDefault();
            e.stopPropagation();
            const parentLink = el.closest('ul')?.closest('li')?.querySelector(':scope > a');
            const parent = ancestors[ancestors.length - 1];
            if (parent)
                openItem(parent, ancestors.slice(0, -1));
            else
                closeAll();
            parentLink?.focus();
        }
        else if (e.key === ' ' && !(item.navigateUrl ?? item.url)) {
            e.preventDefault();
            el.click();
        }
    };
    const renderItem = (item, idx, ancestors, top) => {
        const text = item.text ?? item.title ?? `Item ${idx + 1}`;
        const href = item.navigateUrl || item.url || (hasPopup(item) ? undefined : '#');
        const enabled = isEnabled(item);
        const popup = hasPopup(item);
        const expanded = popup && isOpen(item);
        const linkClass = [
            'nav-link',
            item.selected ? 'selected active' : '',
            popup ? 'has-popup' : '',
            enabled ? '' : 'disabled'
        ].filter(Boolean).join(' ');
        const kids = popup && expanded ? childrenOf(item) : [];
        return (_jsxs("li", { role: "none", className: "nav-item position-relative", onMouseEnter: popup ? () => openItem(item, ancestors) : undefined, children: [_jsx("a", { role: "menuitem", className: linkClass, href: href, target: item.target || undefined, title: item.tooltip || undefined, tabIndex: enabled ? 0 : -1, "aria-disabled": enabled ? undefined : true, "aria-haspopup": popup ? 'menu' : undefined, "aria-expanded": popup ? expanded : undefined, onClick: e => { void handleClick(item, ancestors, e); }, onKeyDown: e => handleKey(item, ancestors, top, e), children: text }), kids.length > 0 && (_jsx("ul", { role: "menu", className: "dynamic dropdown-menu show position-absolute", style: { left: top && isHorizontal ? 0 : '100%', top: top && isHorizontal ? '100%' : 0 }, children: kids.map((child, i) => renderItem(child, i, [...ancestors, item], false)) }))] }, idx));
    };
    const rootClass = [
        className,
        isHorizontal ? 'navbar navbar-expand navbar-light bg-light rounded px-3' : 'nav flex-column mn-vertical'
    ].filter(Boolean).join(' ');
    const listClass = isHorizontal ? 'static navbar-nav me-auto' : 'static nav flex-column';
    return (_jsx("div", { role: "navigation", "aria-label": ariaLabel, className: rootClass, onMouseEnter: cancelClose, onMouseLeave: scheduleClose, children: _jsx("ul", { role: "menubar", "aria-orientation": isHorizontal ? 'horizontal' : 'vertical', className: listClass, children: topItems.map((item, idx) => renderItem(item, idx, [], true)) }) }));
};
//# sourceMappingURL=NavigationMenu.js.map