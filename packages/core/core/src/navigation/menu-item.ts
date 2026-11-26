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

export class MenuItem {
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
  childItems: MenuItem[] = [];
  depth: number = 0;
  parent?: MenuItem | undefined;
  valuePath: string = "";

  constructor(options: MenuItemOptions) {
    this.text = options.text;
    this.value = options.value ?? options.text;
    this.navigateUrl = options.navigateUrl ?? "";
    this.target = options.target ?? "";
    this.tooltip = options.tooltip ?? "";
    this.imageUrl = options.imageUrl ?? "";
    this.popOutImageUrl = options.popOutImageUrl ?? "";
    this.separatorImageUrl = options.separatorImageUrl ?? "";
    this.enabled = options.enabled ?? true;
    this.selectable = options.selectable ?? true;
    this.selected = options.selected ?? false;

    if (options.childItems) {
      for (const childOpt of options.childItems) {
        const child = new MenuItem(childOpt);
        child.parent = this;
        this.childItems.push(child);
      }
    }
  }

  /**
   * Recursively recalculates depth and valuePath across the item subtree.
   */
  refreshHierarchy(parent?: MenuItem | undefined, currentDepth = 0): void {
    this.parent = parent;
    this.depth = currentDepth;
    this.valuePath = parent && parent.valuePath ? `${parent.valuePath}/${this.value}` : this.value;

    for (const child of this.childItems) {
      child.refreshHierarchy(this, currentDepth + 1);
    }
  }

  /**
   * Factory method to convert a SiteMapNode tree into a MenuItem tree.
   */
  static fromSiteMapNode(node: SiteMapNode, parent?: MenuItem | undefined): MenuItem {
    const item = new MenuItem({
      text: node.title,
      value: node.key ?? node.url ?? node.title,
      navigateUrl: node.url ?? "",
      tooltip: node.description ?? ""
    });
    item.parent = parent;
    item.depth = parent ? parent.depth + 1 : 0;
    item.valuePath = parent && parent.valuePath ? `${parent.valuePath}/${item.value}` : item.value;

    if (node.childNodes) {
      for (const childNode of node.childNodes) {
        const childItem = MenuItem.fromSiteMapNode(childNode, item);
        item.childItems.push(childItem);
      }
    }
    return item;
  }
}

