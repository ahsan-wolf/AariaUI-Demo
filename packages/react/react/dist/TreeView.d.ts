import React from 'react';
import type { TreeViewController } from '@wf-controls/core';
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
export declare const TreeView: React.FC<TreeViewProps>;
