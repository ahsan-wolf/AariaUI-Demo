import { DataSourceControl, DataSourceSelectArguments } from "./data-source.js";
export interface SiteMapNode {
    key?: string | undefined;
    url?: string | undefined;
    title: string;
    description?: string | undefined;
    roles?: string[] | undefined;
    childNodes?: SiteMapNode[] | undefined;
    parent?: SiteMapNode | undefined;
}
export interface SiteMapDataSourceOptions {
    id: string;
    siteMap?: SiteMapNode | undefined;
    showStartingNode?: boolean | undefined;
    startingNodeUrl?: string | undefined;
}
export declare class SiteMapDataSource extends DataSourceControl {
    siteMap?: SiteMapNode | undefined;
    showStartingNode: boolean;
    startingNodeUrl?: string | undefined;
    constructor(options: SiteMapDataSourceOptions);
    private linkParents;
    findNode(urlOrKey: string, node?: SiteMapNode | undefined): SiteMapNode | undefined;
    getBreadcrumbs(currentUrlOrKey: string): SiteMapNode[];
    select(selectArgs?: DataSourceSelectArguments): Promise<SiteMapNode[]>;
    insert(): Promise<number>;
    update(): Promise<number>;
    delete(): Promise<number>;
}
