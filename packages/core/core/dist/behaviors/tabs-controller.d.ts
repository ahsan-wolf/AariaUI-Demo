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
export declare class TabsController {
    private _activeTabIndex;
    private _tabs;
    readonly activeTabChanged: EventDispatcher<this, {
        activeIndex: number;
    }>;
    constructor(options?: TabsControllerOptions);
    get activeTabIndex(): number;
    get tabs(): readonly TabItem[];
    setTabs(tabs: TabItem[]): void;
    setActiveTab(index: number): Promise<void>;
}
