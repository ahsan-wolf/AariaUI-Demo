import { EventDispatcher } from "../events.js";
import { MenuItem } from "./menu-item.js";
import { SiteMapDataSource } from "../datasources/sitemap-data-source.js";
export class MenuController {
    id;
    orientation;
    staticDisplayLevels;
    maximumDynamicDisplayLevels;
    disappearAfter;
    items = [];
    selectedItem;
    menuItemClick = new EventDispatcher();
    menuItemDataBound = new EventDispatcher();
    stateChanged = new EventDispatcher();
    dataSource;
    constructor(options) {
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
    setItems(rawItems) {
        this.items = rawItems.map((it) => (it instanceof MenuItem ? it : new MenuItem(it)));
        for (const item of this.items) {
            item.refreshHierarchy(undefined, 0);
        }
    }
    async dataBind(source) {
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
        }
        else if (Array.isArray(ds)) {
            this.items = ds.map((it) => (it instanceof MenuItem ? it : new MenuItem(it)));
        }
        for (const item of this.items) {
            item.refreshHierarchy(undefined, 0);
            await this.notifyDataBoundRecursive(item);
        }
        await this.stateChanged.emit(this, { reason: "dataBind" });
    }
    async notifyDataBoundRecursive(item) {
        await this.menuItemDataBound.emit(this, { item });
        for (const child of item.childItems) {
            await this.notifyDataBoundRecursive(child);
        }
    }
    /**
     * Returns items configured for static layout (depth < staticDisplayLevels).
     */
    getStaticItems() {
        const results = [];
        const traverse = (item) => {
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
    getDynamicItems(parentItem) {
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
    findItem(valueOrPath) {
        let found;
        const traverse = (item) => {
            if (found)
                return;
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
            if (found)
                break;
        }
        return found;
    }
    /**
     * Selects an item, clearing prior selection on other items.
     */
    async selectItem(itemOrValue) {
        const target = typeof itemOrValue === "string" ? this.findItem(itemOrValue) : itemOrValue;
        if (!target || !target.enabled || !target.selectable) {
            return false;
        }
        const clearSelected = (item) => {
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
    async clickItem(itemOrValue) {
        const target = typeof itemOrValue === "string" ? this.findItem(itemOrValue) : itemOrValue;
        if (!target || !target.enabled) {
            return false;
        }
        const args = {
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
//# sourceMappingURL=menu.js.map