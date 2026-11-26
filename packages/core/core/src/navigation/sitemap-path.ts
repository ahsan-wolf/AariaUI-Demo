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

export class SiteMapPathController {
  readonly id: string;
  siteMapProvider?: SiteMapDataSource | undefined;
  pathSeparator: string;
  pathDirection: PathDirection;
  parentLevelsDisplayed: number;
  showToolTips: boolean;
  renderCurrentNodeAsLink: boolean;
  currentUrlOrKey?: string | undefined;

  private items: SiteMapPathItem[] = [];

  readonly itemCreated = new EventDispatcher<this, { item: SiteMapPathItem }>();
  readonly itemDataBound = new EventDispatcher<this, { item: SiteMapPathItem }>();
  readonly stateChanged = new EventDispatcher<this, { reason: string }>();

  constructor(options: SiteMapPathOptions) {
    this.id = options.id;
    this.siteMapProvider = options.siteMapProvider;
    this.pathSeparator = options.pathSeparator ?? " > ";
    this.pathDirection = options.pathDirection ?? "RootToCurrent";
    this.parentLevelsDisplayed = options.parentLevelsDisplayed ?? -1;
    this.showToolTips = options.showToolTips ?? true;
    this.renderCurrentNodeAsLink = options.renderCurrentNodeAsLink ?? false;
    this.currentUrlOrKey = options.currentUrlOrKey;
  }

  getItems(): SiteMapPathItem[] {
    return [...this.items];
  }

  async dataBind(currentUrlOrKey?: string): Promise<SiteMapPathItem[]> {
    const targetKey = currentUrlOrKey ?? this.currentUrlOrKey;
    if (!this.siteMapProvider || !targetKey) {
      this.items = [];
      await this.stateChanged.emit(this, { reason: "dataBind" });
      return [];
    }

    this.currentUrlOrKey = targetKey;
    let rawCrumbs = this.siteMapProvider.getBreadcrumbs(targetKey);

    if (rawCrumbs.length === 0) {
      this.items = [];
      await this.stateChanged.emit(this, { reason: "dataBind" });
      return [];
    }

    // Filter parent levels displayed if specified
    if (this.parentLevelsDisplayed >= 0 && rawCrumbs.length > 2) {
      const root = rawCrumbs[0]!;
      const current = rawCrumbs[rawCrumbs.length - 1]!;
      const intermediate = rawCrumbs.slice(1, -1);
      const slicedIntermediate = intermediate.slice(
        Math.max(0, intermediate.length - this.parentLevelsDisplayed)
      );
      rawCrumbs = [root, ...slicedIntermediate, current];
    }

    const items: SiteMapPathItem[] = [];
    const count = rawCrumbs.length;

    for (let i = 0; i < count; i++) {
      const node = rawCrumbs[i]!;
      let itemType: SiteMapPathItemType = "Parent";
      if (i === 0) itemType = "Root";
      if (i === count - 1) itemType = "Current";

      const isCurrent = itemType === "Current";
      const isLink = isCurrent ? this.renderCurrentNodeAsLink : Boolean(node.url);

      const pathItem: SiteMapPathItem = {
        itemType,
        node,
        text: node.title,
        url: node.url ?? "",
        isLink
      };

      await this.itemCreated.emit(this, { item: pathItem });
      await this.itemDataBound.emit(this, { item: pathItem });
      items.push(pathItem);
    }

    if (this.pathDirection === "CurrentToRoot") {
      items.reverse();
    }

    this.items = items;
    await this.stateChanged.emit(this, { reason: "dataBind" });
    return this.items;
  }

  /**
   * Formats the breadcrumbs into plain text representation with path separators.
   */
  renderText(): string {
    return this.items.map((it) => it.text).join(this.pathSeparator);
  }
}

