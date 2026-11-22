import { EventDispatcher } from "../events.js";
export class AutoCompleteBehavior {
    options;
    searchTriggered = new EventDispatcher();
    resultsLoaded = new EventDispatcher();
    _cachedResults = new Map();
    constructor(options = {}) {
        this.options = options;
    }
    async search(term) {
        if ((term || "").length < (this.options.minimumPrefixLength ?? 1)) {
            return [];
        }
        if (this.options.enableCaching && this._cachedResults.has(term)) {
            return this._cachedResults.get(term);
        }
        await this.searchTriggered.emit(this, { term });
        let results = [];
        if (this.options.onSearch) {
            results = await this.options.onSearch(term);
        }
        if (this.options.enableCaching) {
            this._cachedResults.set(term, results);
        }
        await this.resultsLoaded.emit(this, { results });
        return results;
    }
}
export class ConfirmButtonBehavior {
    options;
    constructor(options) {
        this.options = options;
    }
    async execute() {
        if (typeof window !== "undefined" && typeof window.confirm === "function") {
            const confirmed = window.confirm(this.options.confirmText);
            if (confirmed) {
                if (this.options.onConfirm)
                    await this.options.onConfirm();
                return true;
            }
            else {
                if (this.options.onCancel)
                    this.options.onCancel();
                return false;
            }
        }
        return true;
    }
}
export class CollapsiblePanelBehavior {
    options;
    _collapsed;
    stateChanged = new EventDispatcher();
    constructor(options = {}) {
        this.options = options;
        this._collapsed = options.collapsed ?? false;
    }
    get isCollapsed() {
        return this._collapsed;
    }
    setCollapsed(collapsed) {
        if (this._collapsed !== collapsed) {
            this._collapsed = collapsed;
            void this.stateChanged.emit(this, { collapsed });
        }
    }
    toggle() {
        this.setCollapsed(!this._collapsed);
    }
}
export class CascadingDropDownBehavior {
    options;
    itemsLoaded = new EventDispatcher();
    constructor(options) {
        this.options = options;
    }
    async onParentChange(parentValue) {
        if (!this.options.loadItems)
            return [];
        const items = await this.options.loadItems(parentValue);
        await this.itemsLoaded.emit(this, { items });
        return items;
    }
}
//# sourceMappingURL=ajax-behaviors.js.map