import React, { useEffect, useId, useReducer, useState } from 'react';
import type { TreeNode as CoreTreeNode, TreeViewController } from '@wf-controls/core';

export interface TreeNode {
  text: string;
  value?: string | undefined;
  navigateUrl?: string | undefined;
  expanded?: boolean | undefined;
  selected?: boolean | undefined;
  imageUrl?: string | undefined;
  expandedImageUrl?: string | undefined;
  children?: TreeNode[] | undefined;
}

/**
 * ASP.NET-faithful TreeView markup, compatible with the aspnet-ui-css-kit sheets (`div.tv-<theme>`).
 * - Root `div.wf-treeview` carries `className` (put `tv-modern` etc. there); `showLines` adds `wf-treeview-lines`.
 * - Every node label is an `<a>` with class `root` (depth 0), `parent` (has children), `leaf` (no children)
 *   and `selected`. Without `navigateUrl` it is `<a href="#" role="button">` (default prevented).
 * - Children sit in `<div id="{treeId}_n{path}Nodes" role="group"><ul>...</ul></div>`.
 * - Node images (`imageUrl` / `expandedImageUrl`) render as `<img>` before the label.
 * - Two modes: `nodes` (plain data, local expand/select state) or `controller` (a TreeViewController is the
 *   source of truth: checkboxes, selection, expand/collapse). `controller` wins when both are given.
 * - ARIA: `ul[role=tree]`, `li[role=treeitem]` (aria-level/expanded/selected); keyboard Right/Left/Enter/Space.
 */
export interface TreeViewProps {
  nodes?: TreeNode[] | undefined;
  controller?: TreeViewController | undefined;
  showLines?: boolean | undefined;
  className?: string | undefined;
  ariaLabel?: string | undefined;
  onNodeClick?: ((node: TreeNode) => void) | undefined;
  onNodeToggle?: ((node: TreeNode, isExpanded: boolean) => void) | undefined;
}

interface ViewNode {
  path: string;
  text: string;
  navigateUrl: string | undefined;
  target: string | undefined;
  tooltip: string | undefined;
  imageUrl: string | undefined;
  expandedImageUrl: string | undefined;
  expanded: boolean;
  selected: boolean;
  selectable: boolean;
  checked: boolean;
  showCheckBox: boolean;
  children: ViewNode[];
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
  select: () => void;
  check: (checked: boolean) => void;
}

const NodeItem: React.FC<{ node: ViewNode; level: number; treeId: string }> = ({ node, level, treeId }) => {
  const hasChildren = node.children.length > 0;
  const cls = [level === 0 ? 'root' : '', hasChildren ? 'parent' : 'leaf', node.selected ? 'selected' : '']
    .filter(Boolean).join(' ');

  const onKey = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'ArrowRight' && hasChildren && !node.expanded) { e.preventDefault(); node.expand(); }
    else if (e.key === 'ArrowLeft' && hasChildren && node.expanded) { e.preventDefault(); node.collapse(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); node.select(); }
  };

  const image = node.expanded && node.expandedImageUrl ? node.expandedImageUrl : node.imageUrl;

  return (
    <li
      role="treeitem"
      className="list-unstyled my-1"
      aria-level={level + 1}
      aria-expanded={hasChildren ? node.expanded : undefined}
      aria-selected={node.selectable ? node.selected : undefined}
    >
      <div
        className={`d-flex align-items-center py-1 px-2 rounded${node.selected ? ' bg-light' : ''}`}
        style={{ paddingLeft: `${level * 1.25}rem`, cursor: 'pointer' }}
        tabIndex={0}
        onKeyDown={onKey}
        onClick={() => node.select()}
      >
        {hasChildren ? (
          <button
            type="button"
            className="btn btn-sm p-0 me-2 text-secondary user-select-none"
            style={{ width: '1rem' }}
            aria-label={`${node.expanded ? 'Collapse' : 'Expand'} ${node.text}`}
            onClick={e => { e.stopPropagation(); node.toggle(); }}
          >
            {node.expanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="me-2 text-muted" style={{ width: '1rem', display: 'inline-block' }} aria-hidden="true">•</span>
        )}
        {node.showCheckBox && (
          <input
            type="checkbox"
            className="form-check-input me-2"
            checked={node.checked}
            aria-label={node.text}
            onClick={e => e.stopPropagation()}
            onChange={e => node.check(e.target.checked)}
          />
        )}
        {image ? <img src={image} alt="" className="me-1" /> : null}
        <a
          className={cls}
          href={node.navigateUrl ?? '#'}
          role={node.navigateUrl ? undefined : 'button'}
          target={node.target || undefined}
          title={node.tooltip || undefined}
          onClick={e => { if (!node.navigateUrl) e.preventDefault(); }}
        >
          {node.text}
        </a>
      </div>
      {hasChildren && node.expanded && (
        <div id={`${treeId}_n${node.path.replace(/[^A-Za-z0-9_-]/g, c => `x${c.charCodeAt(0).toString(16)}x`)}Nodes`} role="group">
          <ul className="ps-0 mb-0" role="none">
            {node.children.map(child => (
              <NodeItem key={child.path} node={child} level={level + 1} treeId={treeId} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};

function Tree({ roots, className, showLines, ariaLabel }: {
  roots: ViewNode[]; className: string; showLines: boolean; ariaLabel: string;
}) {
  const treeId = useId().replace(/[^A-Za-z0-9_-]/g, '');
  const cls = `wf-treeview ${showLines ? 'wf-treeview-lines ' : ''}${className}`.trim();
  return (
    <div className={cls}>
      <ul role="tree" className="ps-0 mb-0" aria-label={ariaLabel}>
        {roots.map(node => <NodeItem key={node.path} node={node} level={0} treeId={treeId} />)}
      </ul>
    </div>
  );
}

const ControllerTree: React.FC<{ controller: TreeViewController; className: string; ariaLabel: string; showLines?: boolean | undefined }> = ({
  controller, className, ariaLabel, showLines
}) => {
  const [, refresh] = useReducer((n: number) => n + 1, 0);
  useEffect(() => controller.stateChanged.subscribe(() => refresh()), [controller]);

  const build = (n: CoreTreeNode): ViewNode => ({
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
    check: (checked: boolean) => { void controller.checkNode(n, checked); }
  });

  return (
    <Tree
      roots={controller.nodes.map(build)}
      className={className}
      showLines={showLines ?? controller.showLines}
      ariaLabel={ariaLabel}
    />
  );
};

const PlainTree: React.FC<{
  nodes: TreeNode[]; className: string; ariaLabel: string; showLines: boolean;
  onNodeClick?: TreeViewProps['onNodeClick']; onNodeToggle?: TreeViewProps['onNodeToggle'];
}> = ({ nodes, className, ariaLabel, showLines, onNodeClick, onNodeToggle }) => {
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [selectedPath, setSelectedPath] = useState<string | undefined>(undefined);

  const build = (n: TreeNode, path: string): ViewNode => {
    const hasChildren = Boolean(n.children && n.children.length > 0);
    const expanded = expandedMap[path] ?? n.expanded ?? true;
    const setExpanded = (next: boolean) => {
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
      expand: () => { if (hasChildren && !expanded) setExpanded(true); },
      collapse: () => { if (hasChildren && expanded) setExpanded(false); },
      select: () => { setSelectedPath(path); onNodeClick?.(n); },
      check: () => undefined
    };
  };

  return (
    <Tree
      roots={nodes.map((n, i) => build(n, String(i)))}
      className={className}
      showLines={showLines}
      ariaLabel={ariaLabel}
    />
  );
};

export const TreeView: React.FC<TreeViewProps> = ({
  nodes = [],
  controller,
  showLines,
  className = '',
  ariaLabel = 'Tree',
  onNodeClick,
  onNodeToggle
}) => {
  if (controller) {
    return <ControllerTree controller={controller} className={className} ariaLabel={ariaLabel} showLines={showLines} />;
  }
  return (
    <PlainTree
      nodes={nodes}
      className={className}
      ariaLabel={ariaLabel}
      showLines={Boolean(showLines)}
      onNodeClick={onNodeClick}
      onNodeToggle={onNodeToggle}
    />
  );
};
