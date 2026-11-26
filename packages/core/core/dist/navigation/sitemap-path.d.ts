import { EventDispatcher } from "../events.js";
import { SiteMapDataSource, type SiteMapNode } from "../datasources/sitemap-data-source.js";
export type PathDirection = "RootToCurrent" | "CurrentToRoot";
export type SiteMapPathItemType = "Root" | "Parent" | "Current";
export interface SiteMapPathItem {
    itemType: SiteMapPathItemType;
    node: SiteMapNode;
    text: string;
    url: string;
    isLink: boolean;
}
export interface SiteMapPathOptions {
    id: string;
    siteMapProvider?: SiteMapDataSource | undefined;
    pathSeparator?: string | undefined;
    pathDirection?: PathDirection | undefined;
    parentLevelsDisplayed?: number | undefined;
    showToolTips?: boolean | undefined;
    renderCurrentNodeAsLink?: boolean | undefined;
    currentUrlOrKey?: string | undefined;
}
export declare class SiteMapPathController {
    readonly id: string;
    siteMapProvider?: SiteMapDataSource | undefined;
    pathSeparator: string;
    pathDirection: PathDirection;
    parentLevelsDisplayed: number;
    showToolTips: boolean;
    renderCurrentNodeAsLink: boolean;
    currentUrlOrKey?: string | undefined;
    private items;
    readonly itemCreated: EventDispatcher<this, {
        item: SiteMapPathItem;
    }>;
    readonly itemDataBound: EventDispatcher<this, {
        item: SiteMapPathItem;
    }>;
    readonly stateChanged: EventDispatcher<this, {
        reason: string;
    }>;
    constructor(options: SiteMapPathOptions);
    getItems(): SiteMapPathItem[];
    dataBind(currentUrlOrKey?: string): Promise<SiteMapPathItem[]>;
    /**
     * Formats the breadcrumbs into plain text representation with path separators.
     */
    renderText(): string;
}
