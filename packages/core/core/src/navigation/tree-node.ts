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

export class TreeNode {
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
  childNodes: TreeNode[] = [];
  depth: number = 0;
  parent?: TreeNode | undefined;
  valuePath: string = "";

  constructor(options: TreeNodeOptions) {
    this.text = options.text;
    this.value = options.value ?? options.text;
    this.navigateUrl = options.navigateUrl ?? "";
    this.target = options.target ?? "";
    this.tooltip = options.tooltip ?? "";
    this.imageUrl = options.imageUrl ?? "";
    this.expandedImageUrl = options.expandedImageUrl ?? "";
    this.checked = options.checked ?? false;
    this.expanded = options.expanded ?? false;
    this.selectable = options.selectable ?? true;
    this.selected = options.selected ?? false;

    if (options.childNodes) {
      for (const childOpt of options.childNodes) {
        const child = new TreeNode(childOpt);
        child.parent = this;
        this.childNodes.push(child);
      }
    }
  }

  get isLeaf(): boolean {
    return this.childNodes.length === 0;
  }

  get isRoot(): boolean {
    return !this.parent;
  }

  /**
   * Recursively recalculates depth and valuePath across the node subtree.
   */
  refreshHierarchy(parent?: TreeNode | undefined, currentDepth = 0): void {
    this.parent = parent;
    this.depth = currentDepth;
    this.valuePath = parent && parent.valuePath ? `${parent.valuePath}/${this.value}` : this.value;

    for (const child of this.childNodes) {
      child.refreshHierarchy(this, currentDepth + 1);
    }
  }

  /**
   * Factory method to convert a SiteMapNode tree into a TreeNode tree.
   */
  static fromSiteMapNode(node: SiteMapNode, parent?: TreeNode | undefined): TreeNode {
    const treeNode = new TreeNode({
      text: node.title,
      value: node.key ?? node.url ?? node.title,
      navigateUrl: node.url ?? "",
      tooltip: node.description ?? ""
    });
    treeNode.parent = parent;
    treeNode.depth = parent ? parent.depth + 1 : 0;
    treeNode.valuePath =
      parent && parent.valuePath ? `${parent.valuePath}/${treeNode.value}` : treeNode.value;

    if (node.childNodes) {
      for (const childNode of node.childNodes) {
        const childTreeNode = TreeNode.fromSiteMapNode(childNode, treeNode);
        treeNode.childNodes.push(childTreeNode);
      }
    }
    return treeNode;
  }
}

