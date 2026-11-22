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
export declare class TreeViewController {
    readonly id: string;
    showCheckBoxes: TreeNodeTypes;
    showLines: boolean;
    expandDepth: number;
    nodes: TreeNode[];
    selectedNode?: TreeNode | undefined;
    readonly selectedNodeChanged: EventDispatcher<this, TreeNodeEventArgs>;
    readonly treeNodeCheckChanged: EventDispatcher<this, TreeNodeCheckEventArgs>;
    readonly treeNodeExpanded: EventDispatcher<this, TreeNodeEventArgs>;
    readonly treeNodeCollapsed: EventDispatcher<this, TreeNodeEventArgs>;
    readonly treeNodeDataBound: EventDispatcher<this, TreeNodeEventArgs>;
    readonly stateChanged: EventDispatcher<this, {
        reason: string;
    }>;
    private readonly dataSource?;
    constructor(options: TreeViewOptions);
    setNodes(rawNodes: (TreeNode | TreeNodeOptions)[]): void;
    dataBind(source?: SiteMapDataSource | (TreeNode | TreeNodeOptions)[]): Promise<void>;
    private notifyDataBoundRecursive;
    private applyExpandDepth;
    /**
     * Determines if a checkbox should be rendered for the specified node.
     */
    shouldShowCheckBox(node: TreeNode): boolean;
    /**
     * Finds a node by its valuePath (e.g. "Root/Parent/Child") or unique value.
     */
    findNode(valueOrPath: string): TreeNode | undefined;
    /**
     * Selects a node and fires selectedNodeChanged.
     */
    selectNode(nodeOrValue: TreeNode | string): Promise<boolean>;
    /**
     * Toggles or sets a node's checked state and fires treeNodeCheckChanged.
     */
    checkNode(nodeOrValue: TreeNode | string, checked: boolean): Promise<boolean>;
    /**
     * Expands a node and fires treeNodeExpanded.
     */
    expandNode(nodeOrValue: TreeNode | string): Promise<boolean>;
    /**
     * Collapses a node and fires treeNodeCollapsed.
     */
    collapseNode(nodeOrValue: TreeNode | string): Promise<boolean>;
    /**
     * Toggles node expansion.
     */
    toggleNode(nodeOrValue: TreeNode | string): Promise<boolean>;
    /**
     * Expands all nodes in the tree.
     */
    expandAll(): Promise<void>;
    /**
     * Collapses all nodes in the tree.
     */
    collapseAll(): Promise<void>;
    /**
     * Expands all nodes down to the specified depth.
     */
    expandToDepth(depth: number): Promise<void>;
    /**
     * Returns a flat list of all currently checked nodes.
     */
    getCheckedNodes(): TreeNode[];
}
