import { EventDispatcher } from "../events.js";

export interface AutoCompleteOptions {
  serviceMethod?: string;
  minimumPrefixLength?: number;
  completionInterval?: number;
  enableCaching?: boolean;
  completionSetCount?: number;
  onSearch?: (term: string) => Promise<string[]>;
}

export class AutoCompleteBehavior {
  readonly searchTriggered = new EventDispatcher<this, { term: string }>();
  readonly resultsLoaded = new EventDispatcher<this, { results: string[] }>();
  private _cachedResults = new Map<string, string[]>();

  constructor(public options: AutoCompleteOptions = {}) {}

  async search(term: string): Promise<string[]> {
    if ((term || "").length < (this.options.minimumPrefixLength ?? 1)) {
      return [];
    }
    if (this.options.enableCaching && this._cachedResults.has(term)) {
      return this._cachedResults.get(term)!;
    }
    await this.searchTriggered.emit(this, { term });
    let results: string[] = [];
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

export interface ConfirmButtonOptions {
  confirmText: string;
  confirmTitle?: string;
  onConfirm?: () => Promise<void> | void;
  onCancel?: () => void;
}

export class ConfirmButtonBehavior {
  constructor(public options: ConfirmButtonOptions) {}

  async execute(): Promise<boolean> {
    if (typeof window !== "undefined" && typeof window.confirm === "function") {
      const confirmed = window.confirm(this.options.confirmText);
      if (confirmed) {
        if (this.options.onConfirm) await this.options.onConfirm();
        return true;
      } else {
        if (this.options.onCancel) this.options.onCancel();
        return false;
      }
    }
    return true;
  }
}

export interface CollapsiblePanelOptions {
  collapsed?: boolean;
  collapseControlId?: string;
  expandControlId?: string;
  textLabelId?: string;
  collapsedText?: string;
  expandedText?: string;
}

export class CollapsiblePanelBehavior {
  private _collapsed: boolean;
  readonly stateChanged = new EventDispatcher<this, { collapsed: boolean }>();

  constructor(public options: CollapsiblePanelOptions = {}) {
    this._collapsed = options.collapsed ?? false;
  }

  get isCollapsed(): boolean {
    return this._collapsed;
  }

  setCollapsed(collapsed: boolean): void {
    if (this._collapsed !== collapsed) {
      this._collapsed = collapsed;
      void this.stateChanged.emit(this, { collapsed });
    }
  }

  toggle(): void {
    this.setCollapsed(!this._collapsed);
  }
}

export interface CascadingDropDownOptions {
  category: string;
  parentControlId?: string;
  promptText?: string;
  loadingText?: string;
  loadItems?: (parentValue: string) => Promise<Array<{ text: string; value: string }>>;
}

export class CascadingDropDownBehavior {
  readonly itemsLoaded = new EventDispatcher<this, { items: Array<{ text: string; value: string }> }>();

  constructor(public options: CascadingDropDownOptions) {}

  async onParentChange(parentValue: string): Promise<Array<{ text: string; value: string }>> {
    if (!this.options.loadItems) return [];
    const items = await this.options.loadItems(parentValue);
    await this.itemsLoaded.emit(this, { items });
    return items;
  }
}
