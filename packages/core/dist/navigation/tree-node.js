export class TreeNode {
    text;
    value;
    navigateUrl;
    target;
    tooltip;
    imageUrl;
    expandedImageUrl;
    checked;
    expanded;
    selectable;
    selected;
    childNodes = [];
    depth = 0;
    parent;
    valuePath = "";
    constructor(options) {
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
    get isLeaf() {
        return this.childNodes.length === 0;
    }
    get isRoot() {
        return !this.parent;
    }
    /**
     * Recursively recalculates depth and valuePath across the node subtree.
     */
    refreshHierarchy(parent, currentDepth = 0) {
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
    static fromSiteMapNode(node, parent) {
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
//# sourceMappingURL=tree-node.js.map