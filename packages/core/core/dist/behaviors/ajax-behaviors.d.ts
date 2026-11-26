import { EventDispatcher } from "../events.js";
export interface AutoCompleteOptions {
    serviceMethod?: string;
    minimumPrefixLength?: number;
    completionInterval?: number;
    enableCaching?: boolean;
    completionSetCount?: number;
    onSearch?: (term: string) => Promise<string[]>;
}
export declare class AutoCompleteBehavior {
    options: AutoCompleteOptions;
    readonly searchTriggered: EventDispatcher<this, {
        term: string;
    }>;
    readonly resultsLoaded: EventDispatcher<this, {
        results: string[];
    }>;
    private _cachedResults;
    constructor(options?: AutoCompleteOptions);
    search(term: string): Promise<string[]>;
}
export interface ConfirmButtonOptions {
    confirmText: string;
    confirmTitle?: string;
    onConfirm?: () => Promise<void> | void;
    onCancel?: () => void;
}
export declare class ConfirmButtonBehavior {
    options: ConfirmButtonOptions;
    constructor(options: ConfirmButtonOptions);
    execute(): Promise<boolean>;
}
export interface CollapsiblePanelOptions {
    collapsed?: boolean;
    collapseControlId?: string;
    expandControlId?: string;
    textLabelId?: string;
    collapsedText?: string;
    expandedText?: string;
}
export declare class CollapsiblePanelBehavior {
    options: CollapsiblePanelOptions;
    private _collapsed;
    readonly stateChanged: EventDispatcher<this, {
        collapsed: boolean;
    }>;
    constructor(options?: CollapsiblePanelOptions);
    get isCollapsed(): boolean;
    setCollapsed(collapsed: boolean): void;
    toggle(): void;
}
export interface CascadingDropDownOptions {
    category: string;
    parentControlId?: string;
    promptText?: string;
    loadingText?: string;
    loadItems?: (parentValue: string) => Promise<Array<{
        text: string;
        value: string;
    }>>;
}
export declare class CascadingDropDownBehavior {
    options: CascadingDropDownOptions;
    readonly itemsLoaded: EventDispatcher<this, {
        items: Array<{
            text: string;
            value: string;
        }>;
    }>;
    constructor(options: CascadingDropDownOptions);
    onParentChange(parentValue: string): Promise<Array<{
        text: string;
        value: string;
    }>>;
}
