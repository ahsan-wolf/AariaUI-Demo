import { EventDispatcher } from "../events.js";
import { TreeNode, type TreeNodeOptions } from "./tree-node.js";
import { SiteMapDataSource } from "../datasources/sitemap-data-source.js";

export type TreeNodeTypes = "None" | "Root" | "Parent" | "Leaf" | "All";

export interface TreeNodeEventArgs {
  node: TreeNode;
}

export interface TreeNodeCheckEventArgs {
  node: TreeNode;
  checked: boolean;
}

export interface TreeViewOptions {
  id: string;
  showCheckBoxes?: TreeNodeTypes | undefined;
  showLines?: boolean | undefined;
  expandDepth?: number | undefined;
  dataSource?: SiteMapDataSource | (TreeNode | TreeNodeOptions)[] | undefined;
  nodes?: (TreeNode | TreeNodeOptions)[] | undefined;
}

export class TreeViewController {
  readonly id: string;
  showCheckBoxes: TreeNodeTypes;
  showLines: boolean;
  expandDepth: number;
  nodes: TreeNode[] = [];
  selectedNode?: TreeNode | undefined;

  readonly selectedNodeChanged = new EventDispatcher<this, TreeNodeEventArgs>();
  readonly treeNodeCheckChanged = new EventDispatcher<this, TreeNodeCheckEventArgs>();
  readonly treeNodeExpanded = new EventDispatcher<this, TreeNodeEventArgs>();
  readonly treeNodeCollapsed = new EventDispatcher<this, TreeNodeEventArgs>();
  readonly treeNodeDataBound = new EventDispatcher<this, TreeNodeEventArgs>();
  readonly stateChanged = new EventDispatcher<this, { reason: string }>();

  private readonly dataSource?: SiteMapDataSource | (TreeNode | TreeNodeOptions)[] | undefined;

  constructor(options: TreeViewOptions) {
    this.id = options.id;
    this.showCheckBoxes = options.showCheckBoxes ?? "None";
    this.showLines = options.showLines ?? false;
    this.expandDepth = options.expandDepth ?? -1;
    this.dataSource = options.dataSource;

    if (options.nodes) {
      this.setNodes(options.nodes);
    }
  }

  setNodes(rawNodes: (TreeNode | TreeNodeOptions)[]): void {
    this.nodes = rawNodes.map((n) => (n instanceof TreeNode ? n : new TreeNode(n)));
    for (const node of this.nodes) {
      node.refreshHierarchy(undefined, 0);
    }
    if (this.expandDepth >= 0) {
      this.applyExpandDepth(this.expandDepth);
    }
  }

  async dataBind(source?: SiteMapDataSource | (TreeNode | TreeNodeOptions)[]): Promise<void> {
    const ds = source ?? this.dataSource;
    if (!ds) {
      for (const node of this.nodes) {
        await this.notifyDataBoundRecursive(node);
      }
      await this.stateChanged.emit(this, { reason: "dataBind" });
      return;
    }

    if (ds instanceof SiteMapDataSource) {
      const siteMapNodes = await ds.select();
      this.nodes = siteMapNodes.map((sn) => TreeNode.fromSiteMapNode(sn));
    } else if (Array.isArray(ds)) {
      this.nodes = ds.map((n) => (n instanceof TreeNode ? n : new TreeNode(n)));
    }

    for (const node of this.nodes) {
      node.refreshHierarchy(undefined, 0);
      await this.notifyDataBoundRecursive(node);
    }

    if (this.expandDepth >= 0) {
      this.applyExpandDepth(this.expandDepth);
    }

    await this.stateChanged.emit(this, { reason: "dataBind" });
  }

  private async notifyDataBoundRecursive(node: TreeNode): Promise<void> {
    await this.treeNodeDataBound.emit(this, { node });
    for (const child of node.childNodes) {
      await this.notifyDataBoundRecursive(child);
    }
  }

  private applyExpandDepth(depth: number): void {
    const traverse = (node: TreeNode) => {
      node.expanded = node.depth < depth;
      for (const child of node.childNodes) {
        traverse(child);
      }
    };
    for (const root of this.nodes) {
      traverse(root);
    }
  }

  /**
   * Determines if a checkbox should be rendered for the specified node.
   */
  shouldShowCheckBox(node: TreeNode): boolean {
    switch (this.showCheckBoxes) {
      case "All":
        return true;
      case "Root":
        return node.isRoot;
      case "Parent":
        return !node.isLeaf;
      case "Leaf":
        return node.isLeaf;
      case "None":
      default:
        return false;
    }
  }

  /**
   * Finds a node by its valuePath (e.g. "Root/Parent/Child") or unique value.
   */
  findNode(valueOrPath: string): TreeNode | undefined {
    let found: TreeNode | undefined;

    const traverse = (node: TreeNode) => {
      if (found) return;
      if (node.valuePath === valueOrPath || node.value === valueOrPath || node.text === valueOrPath) {
        found = node;
        return;
      }
      for (const child of node.childNodes) {
        traverse(child);
      }
    };

    for (const root of this.nodes) {
      traverse(root);
      if (found) break;
    }
    return found;
  }

  /**
   * Selects a node and fires selectedNodeChanged.
   */
  async selectNode(nodeOrValue: TreeNode | string): Promise<boolean> {
    const target = typeof nodeOrValue === "string" ? this.findNode(nodeOrValue) : nodeOrValue;
    if (!target || !target.selectable) {
      return false;
    }

    const clearSelected = (node: TreeNode) => {
      node.selected = false;
      for (const child of node.childNodes) {
        clearSelected(child);
      }
    };

    for (const root of this.nodes) {
      clearSelected(root);
    }

    target.selected = true;
    this.selectedNode = target;
    await this.selectedNodeChanged.emit(this, { node: target });
    await this.stateChanged.emit(this, { reason: "selectNode" });
    return true;
  }

  /**
   * Toggles or sets a node's checked state and fires treeNodeCheckChanged.
   */
  async checkNode(nodeOrValue: TreeNode | string, checked: boolean): Promise<boolean> {
    const target = typeof nodeOrValue === "string" ? this.findNode(nodeOrValue) : nodeOrValue;
    if (!target) return false;

    target.checked = checked;
    await this.treeNodeCheckChanged.emit(this, { node: target, checked });
    await this.stateChanged.emit(this, { reason: "checkNode" });
    return true;
  }

  /**
   * Expands a node and fires treeNodeExpanded.
   */
  async expandNode(nodeOrValue: TreeNode | string): Promise<boolean> {
    const target = typeof nodeOrValue === "string" ? this.findNode(nodeOrValue) : nodeOrValue;
    if (!target || target.expanded) return false;

    target.expanded = true;
    await this.treeNodeExpanded.emit(this, { node: target });
    await this.stateChanged.emit(this, { reason: "expandNode" });
    return true;
  }

  /**
   * Collapses a node and fires treeNodeCollapsed.
   */
  async collapseNode(nodeOrValue: TreeNode | string): Promise<boolean> {
    const target = typeof nodeOrValue === "string" ? this.findNode(nodeOrValue) : nodeOrValue;
    if (!target || !target.expanded) return false;

    target.expanded = false;
    await this.treeNodeCollapsed.emit(this, { node: target });
    await this.stateChanged.emit(this, { reason: "collapseNode" });
    return true;
  }

  /**
   * Toggles node expansion.
   */
  async toggleNode(nodeOrValue: TreeNode | string): Promise<boolean> {
    const target = typeof nodeOrValue === "string" ? this.findNode(nodeOrValue) : nodeOrValue;
    if (!target) return false;
    return target.expanded ? this.collapseNode(target) : this.expandNode(target);
  }

  /**
   * Expands all nodes in the tree.
   */
  async expandAll(): Promise<void> {
    const traverse = (node: TreeNode) => {
      node.expanded = true;
      for (const child of node.childNodes) {
        traverse(child);
      }
    };
    for (const root of this.nodes) {
      traverse(root);
    }
    await this.stateChanged.emit(this, { reason: "expandAll" });
  }

  /**
   * Collapses all nodes in the tree.
   */
  async collapseAll(): Promise<void> {
    const traverse = (node: TreeNode) => {
      node.expanded = false;
      for (const child of node.childNodes) {
        traverse(child);
      }
    };
    for (const root of this.nodes) {
      traverse(root);
    }
    await this.stateChanged.emit(this, { reason: "collapseAll" });
  }

  /**
   * Expands all nodes down to the specified depth.
   */
  async expandToDepth(depth: number): Promise<void> {
    this.applyExpandDepth(depth);
    await this.stateChanged.emit(this, { reason: "expandToDepth" });
  }

  /**
   * Returns a flat list of all currently checked nodes.
   */
  getCheckedNodes(): TreeNode[] {
    const results: TreeNode[] = [];
    const traverse = (node: TreeNode) => {
      if (node.checked) {
        results.push(node);
      }
      for (const child of node.childNodes) {
        traverse(child);
      }
    };
    for (const root of this.nodes) {
      traverse(root);
    }
    return results;
  }
}

