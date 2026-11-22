export class MenuItem {
    text;
    value;
    navigateUrl;
    target;
    tooltip;
    imageUrl;
    popOutImageUrl;
    separatorImageUrl;
    enabled;
    selectable;
    selected;
    childItems = [];
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
    refreshHierarchy(parent, currentDepth = 0) {
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
    static fromSiteMapNode(node, parent) {
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
//# sourceMappingURL=menu-item.js.map