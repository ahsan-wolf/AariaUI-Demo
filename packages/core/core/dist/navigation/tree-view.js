import { EventDispatcher } from "../events.js";
import { TreeNode } from "./tree-node.js";
import { SiteMapDataSource } from "../datasources/sitemap-data-source.js";
export class TreeViewController {
    id;
    showCheckBoxes;
    showLines;
    expandDepth;
    nodes = [];
    selectedNode;
    selectedNodeChanged = new EventDispatcher();
    treeNodeCheckChanged = new EventDispatcher();
    treeNodeExpanded = new EventDispatcher();
    treeNodeCollapsed = new EventDispatcher();
    treeNodeDataBound = new EventDispatcher();
    stateChanged = new EventDispatcher();
    dataSource;
    constructor(options) {
        this.id = options.id;
        this.showCheckBoxes = options.showCheckBoxes ?? "None";
        this.showLines = options.showLines ?? false;
        this.expandDepth = options.expandDepth ?? -1;
        this.dataSource = options.dataSource;
        if (options.nodes) {
            this.setNodes(options.nodes);
        }
    }
    setNodes(rawNodes) {
        this.nodes = rawNodes.map((n) => (n instanceof TreeNode ? n : new TreeNode(n)));
        for (const node of this.nodes) {
            node.refreshHierarchy(undefined, 0);
        }
        if (this.expandDepth >= 0) {
            this.applyExpandDepth(this.expandDepth);
        }
    }
    async dataBind(source) {
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
        }
        else if (Array.isArray(ds)) {
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
    async notifyDataBoundRecursive(node) {
        await this.treeNodeDataBound.emit(this, { node });
        for (const child of node.childNodes) {
            await this.notifyDataBoundRecursive(child);
        }
    }
    applyExpandDepth(depth) {
        const traverse = (node) => {
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
    shouldShowCheckBox(node) {
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
    findNode(valueOrPath) {
        let found;
        const traverse = (node) => {
            if (found)
                return;
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
            if (found)
                break;
        }
        return found;
    }
    /**
     * Selects a node and fires selectedNodeChanged.
     */
    async selectNode(nodeOrValue) {
        const target = typeof nodeOrValue === "string" ? this.findNode(nodeOrValue) : nodeOrValue;
        if (!target || !target.selectable) {
            return false;
        }
        const clearSelected = (node) => {
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
    async checkNode(nodeOrValue, checked) {
        const target = typeof nodeOrValue === "string" ? this.findNode(nodeOrValue) : nodeOrValue;
        if (!target)
            return false;
        target.checked = checked;
        await this.treeNodeCheckChanged.emit(this, { node: target, checked });
        await this.stateChanged.emit(this, { reason: "checkNode" });
        return true;
    }
    /**
     * Expands a node and fires treeNodeExpanded.
     */
    async expandNode(nodeOrValue) {
        const target = typeof nodeOrValue === "string" ? this.findNode(nodeOrValue) : nodeOrValue;
        if (!target || target.expanded)
            return false;
        target.expanded = true;
        await this.treeNodeExpanded.emit(this, { node: target });
        await this.stateChanged.emit(this, { reason: "expandNode" });
        return true;
    }
    /**
     * Collapses a node and fires treeNodeCollapsed.
     */
    async collapseNode(nodeOrValue) {
        const target = typeof nodeOrValue === "string" ? this.findNode(nodeOrValue) : nodeOrValue;
        if (!target || !target.expanded)
            return false;
        target.expanded = false;
        await this.treeNodeCollapsed.emit(this, { node: target });
        await this.stateChanged.emit(this, { reason: "collapseNode" });
        return true;
    }
    /**
     * Toggles node expansion.
     */
    async toggleNode(nodeOrValue) {
        const target = typeof nodeOrValue === "string" ? this.findNode(nodeOrValue) : nodeOrValue;
        if (!target)
            return false;
        return target.expanded ? this.collapseNode(target) : this.expandNode(target);
    }
    /**
     * Expands all nodes in the tree.
     */
    async expandAll() {
        const traverse = (node) => {
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
    async collapseAll() {
        const traverse = (node) => {
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
    async expandToDepth(depth) {
        this.applyExpandDepth(depth);
        await this.stateChanged.emit(this, { reason: "expandToDepth" });
    }
    /**
     * Returns a flat list of all currently checked nodes.
     */
    getCheckedNodes() {
        const results = [];
        const traverse = (node) => {
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
//# sourceMappingURL=tree-view.js.map