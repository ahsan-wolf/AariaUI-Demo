import { EventDispatcher } from "../events.js";
export class TabsController {
    _activeTabIndex = 0;
    _tabs = [];
    activeTabChanged = new EventDispatcher();
    constructor(options = {}) {
        this._activeTabIndex = options.activeTabIndex ?? 0;
        this._tabs = options.tabs ?? [];
    }
    get activeTabIndex() {
        return this._activeTabIndex;
    }
    get tabs() {
        return this._tabs;
    }
    setTabs(tabs) {
        this._tabs = [...tabs];
        if (this._activeTabIndex >= this._tabs.length) {
            this._activeTabIndex = Math.max(0, this._tabs.length - 1);
        }
    }
    async setActiveTab(index) {
        if (index >= 0 && index < this._tabs.length && this._activeTabIndex !== index) {
            this._activeTabIndex = index;
            await this.activeTabChanged.emit(this, { activeIndex: index });
        }
    }
}
//# sourceMappingURL=tabs-controller.js.map