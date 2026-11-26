import type { SiteMapNode } from "../datasources/sitemap-data-source.js";
export interface TreeNodeOptions {
    text: string;
    value?: string | undefined;
    navigateUrl?: string | undefined;
    target?: string | undefined;
    tooltip?: string | undefined;
    imageUrl?: string | undefined;
    expandedImageUrl?: string | undefined;
    checked?: boolean | undefined;
    expanded?: boolean | undefined;
    selectable?: boolean | undefined;
    selected?: boolean | undefined;
    childNodes?: TreeNodeOptions[] | undefined;
}
export declare class TreeNode {
    text: string;
    value: string;
    navigateUrl: string;
    target: string;
    tooltip: string;
    imageUrl: string;
    expandedImageUrl: string;
    checked: boolean;
    expanded: boolean;
    selectable: boolean;
    selected: boolean;
    childNodes: TreeNode[];
    depth: number;
    parent?: TreeNode | undefined;
    valuePath: string;
    constructor(options: TreeNodeOptions);
    get isLeaf(): boolean;
    get isRoot(): boolean;
    /**
     * Recursively recalculates depth and valuePath across the node subtree.
     */
    refreshHierarchy(parent?: TreeNode | undefined, currentDepth?: number): void;
    /**
     * Factory method to convert a SiteMapNode tree into a TreeNode tree.
     */
    static fromSiteMapNode(node: SiteMapNode, parent?: TreeNode | undefined): TreeNode;
}
