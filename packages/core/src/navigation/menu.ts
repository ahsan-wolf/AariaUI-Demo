import { EventDispatcher, type CancelEventArgs } from "../events.js";
import { MenuItem, type MenuItemOptions } from "./menu-item.js";
import { SiteMapDataSource } from "../datasources/sitemap-data-source.js";

export type MenuOrientation = "Horizontal" | "Vertical";

export interface MenuItemClickEventArgs extends CancelEventArgs {
  item: MenuItem;
}

export interface MenuItemDataBoundEventArgs {
  item: MenuItem;
}

export interface MenuOptions {
  id: string;
  orientation?: MenuOrientation | undefined;
  staticDisplayLevels?: number | undefined;
  maximumDynamicDisplayLevels?: number | undefined;
  disappearAfter?: number | undefined;
  dataSource?: SiteMapDataSource | (MenuItem | MenuItemOptions)[] | undefined;
  items?: (MenuItem | MenuItemOptions)[] | undefined;
}

export class MenuController {
  readonly id: string;
  orientation: MenuOrientation;
  staticDisplayLevels: number;
  maximumDynamicDisplayLevels: number;
  disappearAfter: number;
  items: MenuItem[] = [];
  selectedItem?: MenuItem | undefined;

  readonly menuItemClick = new EventDispatcher<this, MenuItemClickEventArgs>();
  readonly menuItemDataBound = new EventDispatcher<this, MenuItemDataBoundEventArgs>();
  readonly stateChanged = new EventDispatcher<this, { reason: string }>();

  private readonly dataSource?: SiteMapDataSource | (MenuItem | MenuItemOptions)[] | undefined;

  constructor(options: MenuOptions) {
    this.id = options.id;
    this.orientation = options.orientation ?? "Vertical";
    this.staticDisplayLevels = Math.max(1, options.staticDisplayLevels ?? 1);
    this.maximumDynamicDisplayLevels = Math.max(0, options.maximumDynamicDisplayLevels ?? 3);
    this.disappearAfter = options.disappearAfter ?? 500;
    this.dataSource = options.dataSource;

    if (options.items) {
      this.setItems(options.items);
    }
  }

  setItems(rawItems: (MenuItem | MenuItemOptions)[]): void {
    this.items = rawItems.map((it) => (it instanceof MenuItem ? it : new MenuItem(it)));
    for (const item of this.items) {
      item.refreshHierarchy(undefined, 0);
    }
  }

  async dataBind(source?: SiteMapDataSource | (MenuItem | MenuItemOptions)[]): Promise<void> {
    const ds = source ?? this.dataSource;
    if (!ds) {
      for (const item of this.items) {
        await this.notifyDataBoundRecursive(item);
      }
      await this.stateChanged.emit(this, { reason: "dataBind" });
      return;
    }

    if (ds instanceof SiteMapDataSource) {
      const nodes = await ds.select();
      this.items = nodes.map((n) => MenuItem.fromSiteMapNode(n));
    } else if (Array.isArray(ds)) {
      this.items = ds.map((it) => (it instanceof MenuItem ? it : new MenuItem(it)));
    }

    for (const item of this.items) {
      item.refreshHierarchy(undefined, 0);
      await this.notifyDataBoundRecursive(item);
    }

    await this.stateChanged.emit(this, { reason: "dataBind" });
  }

  private async notifyDataBoundRecursive(item: MenuItem): Promise<void> {
    await this.menuItemDataBound.emit(this, { item });
    for (const child of item.childItems) {
      await this.notifyDataBoundRecursive(child);
    }
  }

  /**
   * Returns items configured for static layout (depth < staticDisplayLevels).
   */
  getStaticItems(): MenuItem[] {
    const results: MenuItem[] = [];
    const traverse = (item: MenuItem) => {
      if (item.depth < this.staticDisplayLevels) {
        results.push(item);
        for (const child of item.childItems) {
          traverse(child);
        }
      }
    };

    for (const root of this.items) {
      traverse(root);
    }
    return results;
  }

  /**
   * Returns dynamic (flyout/popup) child items for a given parent item.
   */
  getDynamicItems(parentItem: MenuItem): MenuItem[] {
    if (parentItem.depth < this.staticDisplayLevels - 1) {
      // Children are still static
      return [];
    }

    const maxDepth = this.staticDisplayLevels + this.maximumDynamicDisplayLevels;
    return parentItem.childItems.filter((child) => child.depth <= maxDepth);
  }

  /**
   * Finds an item by its valuePath (e.g. "Root/Section/Page") or by unique value.
   */
  findItem(valueOrPath: string): MenuItem | undefined {
    let found: MenuItem | undefined;

    const traverse = (item: MenuItem) => {
      if (found) return;
      if (item.valuePath === valueOrPath || item.value === valueOrPath || item.text === valueOrPath) {
        found = item;
        return;
      }
      for (const child of item.childItems) {
        traverse(child);
      }
    };

    for (const root of this.items) {
      traverse(root);
      if (found) break;
    }
    return found;
  }

  /**
   * Selects an item, clearing prior selection on other items.
   */
  async selectItem(itemOrValue: MenuItem | string): Promise<boolean> {
    const target = typeof itemOrValue === "string" ? this.findItem(itemOrValue) : itemOrValue;
    if (!target || !target.enabled || !target.selectable) {
      return false;
    }

    const clearSelected = (item: MenuItem) => {
      item.selected = false;
      for (const child of item.childItems) {
        clearSelected(child);
      }
    };

    for (const root of this.items) {
      clearSelected(root);
    }

    target.selected = true;
    this.selectedItem = target;
    await this.stateChanged.emit(this, { reason: "selectItem" });
    return true;
  }

  /**
   * Simulates clicking an item (triggers cancellable menuItemClick event and updates selection).
   */
  async clickItem(itemOrValue: MenuItem | string): Promise<boolean> {
    const target = typeof itemOrValue === "string" ? this.findItem(itemOrValue) : itemOrValue;
    if (!target || !target.enabled) {
      return false;
    }

    const args: MenuItemClickEventArgs = {
      item: target,
      cancel: false
    };

    await this.menuItemClick.emit(this, args);
    if (args.cancel) {
      return false;
    }

    if (target.selectable) {
      await this.selectItem(target);
    }

    return true;
  }
}

