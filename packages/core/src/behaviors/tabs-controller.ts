import { EventDispatcher } from "../events.js";

export interface TabItem {
  id: string;
  headerText: string;
  enabled?: boolean;
  visible?: boolean;
}

export interface TabsControllerOptions {
  activeTabIndex?: number;
  tabs?: TabItem[];
  onActiveTabChanged?: (newIndex: number) => void;
}

export class TabsController {
  private _activeTabIndex = 0;
  private _tabs: TabItem[] = [];
  readonly activeTabChanged = new EventDispatcher<this, { activeIndex: number }>();

  constructor(options: TabsControllerOptions = {}) {
    this._activeTabIndex = options.activeTabIndex ?? 0;
    this._tabs = options.tabs ?? [];
  }

  get activeTabIndex(): number {
    return this._activeTabIndex;
  }

  get tabs(): readonly TabItem[] {
    return this._tabs;
  }

  setTabs(tabs: TabItem[]): void {
    this._tabs = [...tabs];
    if (this._activeTabIndex >= this._tabs.length) {
      this._activeTabIndex = Math.max(0, this._tabs.length - 1);
    }
  }

  async setActiveTab(index: number): Promise<void> {
    if (index >= 0 && index < this._tabs.length && this._activeTabIndex !== index) {
      this._activeTabIndex = index;
      await this.activeTabChanged.emit(this, { activeIndex: index });
    }
  }
}
