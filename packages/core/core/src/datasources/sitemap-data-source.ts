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

export class SiteMapDataSource extends DataSourceControl {
  siteMap?: SiteMapNode | undefined;
  showStartingNode: boolean;
  startingNodeUrl?: string | undefined;

  constructor(options: SiteMapDataSourceOptions) {
    super(options.id);
    this.siteMap = options.siteMap;
    this.showStartingNode = options.showStartingNode ?? true;
    this.startingNodeUrl = options.startingNodeUrl;

    if (this.siteMap) {
      this.linkParents(this.siteMap);
    }
  }

  private linkParents(node: SiteMapNode, parent?: SiteMapNode | undefined): void {
    node.parent = parent;
    if (node.childNodes) {
      for (const child of node.childNodes) {
        this.linkParents(child, node);
      }
    }
  }

  findNode(
    urlOrKey: string,
    node: SiteMapNode | undefined = this.siteMap
  ): SiteMapNode | undefined {
    if (!node) return undefined;
    if (node.key === urlOrKey || node.url === urlOrKey) return node;
    if (node.childNodes) {
      for (const child of node.childNodes) {
        const found = this.findNode(urlOrKey, child);
        if (found) return found;
      }
    }
    return undefined;
  }

  getBreadcrumbs(currentUrlOrKey: string): SiteMapNode[] {
    const crumbs: SiteMapNode[] = [];
    let current = this.findNode(currentUrlOrKey);
    while (current) {
      crumbs.unshift(current);
      current = current.parent;
    }
    return crumbs;
  }

  override async select(selectArgs: DataSourceSelectArguments = {}): Promise<SiteMapNode[]> {
    const selectingArgs = {
      arguments: selectArgs,
      parameters: {},
      cancel: false
    };

    await this.selecting.emit(this, selectingArgs);
    if (selectingArgs.cancel || !this.siteMap) {
      return [];
    }

    let startingNode = this.siteMap;
    if (this.startingNodeUrl) {
      const found = this.findNode(this.startingNodeUrl);
      if (found) startingNode = found;
    }

    let result: SiteMapNode[];
    if (this.showStartingNode) {
      result = [startingNode];
    } else {
      result = startingNode.childNodes ?? [];
    }

    await this.selected.emit(this, { data: result, totalRowCount: result.length });
    return result;
  }

  override async insert(): Promise<number> {
    throw new Error("SiteMapDataSource does not support insert operations.");
  }

  override async update(): Promise<number> {
    throw new Error("SiteMapDataSource does not support update operations.");
  }

  override async delete(): Promise<number> {
    throw new Error("SiteMapDataSource does not support delete operations.");
  }
}

