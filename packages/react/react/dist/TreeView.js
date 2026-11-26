import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useReducer, useState } from 'react';
const NodeItem = ({ node, level, treeId }) => {
    const hasChildren = node.children.length > 0;
    const cls = [level === 0 ? 'root' : '', hasChildren ? 'parent' : 'leaf', node.selected ? 'selected' : '']
        .filter(Boolean).join(' ');
    const onKey = (e) => {
        if (e.target !== e.currentTarget)
            return;
        if (e.key === 'ArrowRight' && hasChildren && !node.expanded) {
            e.preventDefault();
            node.expand();
        }
        else if (e.key === 'ArrowLeft' && hasChildren && node.expanded) {
            e.preventDefault();
            node.collapse();
        }
        else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            node.select();
        }
    };
    const image = node.expanded && node.expandedImageUrl ? node.expandedImageUrl : node.imageUrl;
    return (_jsxs("li", { role: "treeitem", className: "list-unstyled my-1", "aria-level": level + 1, "aria-expanded": hasChildren ? node.expanded : undefined, "aria-selected": node.selectable ? node.selected : undefined, children: [_jsxs("div", { className: `d-flex align-items-center py-1 px-2 rounded${node.selected ? ' bg-light' : ''}`, style: { paddingLeft: `${level * 1.25}rem`, cursor: 'pointer' }, tabIndex: 0, onKeyDown: onKey, onClick: () => node.select(), children: [hasChildren ? (_jsx("button", { type: "button", className: "btn btn-sm p-0 me-2 text-secondary user-select-none", style: { width: '1rem' }, "aria-label": `${node.expanded ? 'Collapse' : 'Expand'} ${node.text}`, onClick: e => { e.stopPropagation(); node.toggle(); }, children: node.expanded ? '▾' : '▸' })) : (_jsx("span", { className: "me-2 text-muted", style: { width: '1rem', display: 'inline-block' }, "aria-hidden": "true", children: "\u2022" })), node.showCheckBox && (_jsx("input", { type: "checkbox", className: "form-check-input me-2", checked: node.checked, "aria-label": node.text, onClick: e => e.stopPropagation(), onChange: e => node.check(e.target.checked) })), image ? _jsx("img", { src: image, alt: "", className: "me-1" }) : null, _jsx("a", { className: cls, href: node.navigateUrl ?? '#', role: node.navigateUrl ? undefined : 'button', target: node.target || undefined, title: node.tooltip || undefined, onClick: e => { if (!node.navigateUrl)
                            e.preventDefault(); }, children: node.text })] }), hasChildren && node.expanded && (_jsx("div", { id: `${treeId}_n${node.path.replace(/[^A-Za-z0-9_-]/g, c => `x${c.charCodeAt(0).toString(16)}x`)}Nodes`, role: "group", children: _jsx("ul", { className: "ps-0 mb-0", role: "none", children: node.children.map(child => (_jsx(NodeItem, { node: child, level: level + 1, treeId: treeId }, child.path))) }) }))] }));
};
function Tree({ roots, className, showLines, ariaLabel }) {
    const treeId = useId().replace(/[^A-Za-z0-9_-]/g, '');
    const cls = `wf-treeview ${showLines ? 'wf-treeview-lines ' : ''}${className}`.trim();
    return (_jsx("div", { className: cls, children: _jsx("ul", { role: "tree", className: "ps-0 mb-0", "aria-label": ariaLabel, children: roots.map(node => _jsx(NodeItem, { node: node, level: 0, treeId: treeId }, node.path)) }) }));
}
const ControllerTree = ({ controller, className, ariaLabel, showLines }) => {
    const [, refresh] = useReducer((n) => n + 1, 0);
    useEffect(() => controller.stateChanged.subscribe(() => refresh()), [controller]);
    const build = (n) => ({
        path: n.valuePath,
        text: n.text,
        navigateUrl: n.navigateUrl || undefined,
        target: n.target || undefined,
        tooltip: n.tooltip || undefined,
        imageUrl: n.imageUrl || undefined,
        expandedImageUrl: n.expandedImageUrl || undefined,
        expanded: n.expanded,
        selected: n.selected,
        selectable: n.selectable,
        checked: n.checked,
        showCheckBox: controller.shouldShowCheckBox(n),
        children: n.childNodes.map(build),
        toggle: () => { void controller.toggleNode(n); },
        expand: () => { void controller.expandNode(n); },
        collapse: () => { void controller.collapseNode(n); },
        select: () => { void controller.selectNode(n); },
        check: (checked) => { void controller.checkNode(n, checked); }
    });
    return (_jsx(Tree, { roots: controller.nodes.map(build), className: className, showLines: showLines ?? controller.showLines, ariaLabel: ariaLabel }));
};
const PlainTree = ({ nodes, className, ariaLabel, showLines, onNodeClick, onNodeToggle }) => {
    const [expandedMap, setExpandedMap] = useState({});
    const [selectedPath, setSelectedPath] = useState(undefined);
    const build = (n, path) => {
        const hasChildren = Boolean(n.children && n.children.length > 0);
        const expanded = expandedMap[path] ?? n.expanded ?? true;
        const setExpanded = (next) => {
            setExpandedMap(m => ({ ...m, [path]: next }));
            onNodeToggle?.(n, next);
        };
        return {
            path,
            text: n.text,
            navigateUrl: n.navigateUrl || undefined,
            target: undefined,
            tooltip: undefined,
            imageUrl: n.imageUrl || undefined,
            expandedImageUrl: n.expandedImageUrl || undefined,
            expanded,
            selected: selectedPath !== undefined ? selectedPath === path : Boolean(n.selected),
            selectable: true,
            checked: false,
            showCheckBox: false,
            children: (n.children ?? []).map((c, i) => build(c, `${path}-${i}`)),
            toggle: () => setExpanded(!expanded),
            expand: () => { if (hasChildren && !expanded)
                setExpanded(true); },
            collapse: () => { if (hasChildren && expanded)
                setExpanded(false); },
            select: () => { setSelectedPath(path); onNodeClick?.(n); },
            check: () => undefined
        };
    };
    return (_jsx(Tree, { roots: nodes.map((n, i) => build(n, String(i))), className: className, showLines: showLines, ariaLabel: ariaLabel }));
};
export const TreeView = ({ nodes = [], controller, showLines, className = '', ariaLabel = 'Tree', onNodeClick, onNodeToggle }) => {
    if (controller) {
        return _jsx(ControllerTree, { controller: controller, className: className, ariaLabel: ariaLabel, showLines: showLines });
    }
    return (_jsx(PlainTree, { nodes: nodes, className: className, ariaLabel: ariaLabel, showLines: Boolean(showLines), onNodeClick: onNodeClick, onNodeToggle: onNodeToggle }));
};
//# sourceMappingURL=TreeView.js.map