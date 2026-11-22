import { EventDispatcher } from "../events.js";
export class SiteMapPathController {
    id;
    siteMapProvider;
    pathSeparator;
    pathDirection;
    parentLevelsDisplayed;
    showToolTips;
    renderCurrentNodeAsLink;
    currentUrlOrKey;
    items = [];
    itemCreated = new EventDispatcher();
    itemDataBound = new EventDispatcher();
    stateChanged = new EventDispatcher();
    constructor(options) {
        this.id = options.id;
        this.siteMapProvider = options.siteMapProvider;
        this.pathSeparator = options.pathSeparator ?? " > ";
        this.pathDirection = options.pathDirection ?? "RootToCurrent";
        this.parentLevelsDisplayed = options.parentLevelsDisplayed ?? -1;
        this.showToolTips = options.showToolTips ?? true;
        this.renderCurrentNodeAsLink = options.renderCurrentNodeAsLink ?? false;
        this.currentUrlOrKey = options.currentUrlOrKey;
    }
    getItems() {
        return [...this.items];
    }
    async dataBind(currentUrlOrKey) {
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
            const root = rawCrumbs[0];
            const current = rawCrumbs[rawCrumbs.length - 1];
            const intermediate = rawCrumbs.slice(1, -1);
            const slicedIntermediate = intermediate.slice(Math.max(0, intermediate.length - this.parentLevelsDisplayed));
            rawCrumbs = [root, ...slicedIntermediate, current];
        }
        const items = [];
        const count = rawCrumbs.length;
        for (let i = 0; i < count; i++) {
            const node = rawCrumbs[i];
            let itemType = "Parent";
            if (i === 0)
                itemType = "Root";
            if (i === count - 1)
                itemType = "Current";
            const isCurrent = itemType === "Current";
            const isLink = isCurrent ? this.renderCurrentNodeAsLink : Boolean(node.url);
            const pathItem = {
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
    renderText() {
        return this.items.map((it) => it.text).join(this.pathSeparator);
    }
}
//# sourceMappingURL=sitemap-path.js.map