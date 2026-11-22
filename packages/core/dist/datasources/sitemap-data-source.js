import { DataSourceControl } from "./data-source.js";
export class SiteMapDataSource extends DataSourceControl {
    siteMap;
    showStartingNode;
    startingNodeUrl;
    constructor(options) {
        super(options.id);
        this.siteMap = options.siteMap;
        this.showStartingNode = options.showStartingNode ?? true;
        this.startingNodeUrl = options.startingNodeUrl;
        if (this.siteMap) {
            this.linkParents(this.siteMap);
        }
    }
    linkParents(node, parent) {
        node.parent = parent;
        if (node.childNodes) {
            for (const child of node.childNodes) {
                this.linkParents(child, node);
            }
        }
    }
    findNode(urlOrKey, node = this.siteMap) {
        if (!node)
            return undefined;
        if (node.key === urlOrKey || node.url === urlOrKey)
            return node;
        if (node.childNodes) {
            for (const child of node.childNodes) {
                const found = this.findNode(urlOrKey, child);
                if (found)
                    return found;
            }
        }
        return undefined;
    }
    getBreadcrumbs(currentUrlOrKey) {
        const crumbs = [];
        let current = this.findNode(currentUrlOrKey);
        while (current) {
            crumbs.unshift(current);
            current = current.parent;
        }
        return crumbs;
    }
    async select(selectArgs = {}) {
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
            if (found)
                startingNode = found;
        }
        let result;
        if (this.showStartingNode) {
            result = [startingNode];
        }
        else {
            result = startingNode.childNodes ?? [];
        }
        await this.selected.emit(this, { data: result, totalRowCount: result.length });
        return result;
    }
    async insert() {
        throw new Error("SiteMapDataSource does not support insert operations.");
    }
    async update() {
        throw new Error("SiteMapDataSource does not support update operations.");
    }
    async delete() {
        throw new Error("SiteMapDataSource does not support delete operations.");
    }
}
//# sourceMappingURL=sitemap-data-source.js.map