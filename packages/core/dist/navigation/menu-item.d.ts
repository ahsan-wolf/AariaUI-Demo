import type { SiteMapNode } from "../datasources/sitemap-data-source.js";
export interface MenuItemOptions {
    text: string;
    value?: string | undefined;
    navigateUrl?: string | undefined;
    target?: string | undefined;
    tooltip?: string | undefined;
    imageUrl?: string | undefined;
    popOutImageUrl?: string | undefined;
    separatorImageUrl?: string | undefined;
    enabled?: boolean | undefined;
    selectable?: boolean | undefined;
    selected?: boolean | undefined;
    childItems?: MenuItemOptions[] | undefined;
}
export declare class MenuItem {
    text: string;
    value: string;
    navigateUrl: string;
    target: string;
    tooltip: string;
    imageUrl: string;
    popOutImageUrl: string;
    separatorImageUrl: string;
    enabled: boolean;
    selectable: boolean;
    selected: boolean;
    childItems: MenuItem[];
    depth: number;
    parent?: MenuItem | undefined;
    valuePath: string;
    constructor(options: MenuItemOptions);
    /**
     * Recursively recalculates depth and valuePath across the item subtree.
     */
    refreshHierarchy(parent?: MenuItem | undefined, currentDepth?: number): void;
    /**
     * Factory method to convert a SiteMapNode tree into a MenuItem tree.
     */
    static fromSiteMapNode(node: SiteMapNode, parent?: MenuItem | undefined): MenuItem;
}
