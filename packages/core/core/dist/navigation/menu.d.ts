import { EventDispatcher, type CancelEventArgs } from "../events.js";
import { MenuItem, type MenuItemOptions } from "./menu-item.js";
import { SiteMapDataSource } from "../datasources/sitemap-data-source.js";
export type MenuOrientation = "Horizontal" | "Vertical";
export interface MenuItemClickEventArgs extends CancelEventArgs {
    item: MenuItem;
}
export interface MenuItemDataBoundEventArgs {
    item: MenuItem;
}
export interface MenuOptions {
    id: string;
    orientation?: MenuOrientation | undefined;
    staticDisplayLevels?: number | undefined;
    maximumDynamicDisplayLevels?: number | undefined;
    disappearAfter?: number | undefined;
    dataSource?: SiteMapDataSource | (MenuItem | MenuItemOptions)[] | undefined;
    items?: (MenuItem | MenuItemOptions)[] | undefined;
}
export declare class MenuController {
    readonly id: string;
    orientation: MenuOrientation;
    staticDisplayLevels: number;
    maximumDynamicDisplayLevels: number;
    disappearAfter: number;
    items: MenuItem[];
    selectedItem?: MenuItem | undefined;
    readonly menuItemClick: EventDispatcher<this, MenuItemClickEventArgs>;
    readonly menuItemDataBound: EventDispatcher<this, MenuItemDataBoundEventArgs>;
    readonly stateChanged: EventDispatcher<this, {
        reason: string;
    }>;
    private readonly dataSource?;
    constructor(options: MenuOptions);
    setItems(rawItems: (MenuItem | MenuItemOptions)[]): void;
    dataBind(source?: SiteMapDataSource | (MenuItem | MenuItemOptions)[]): Promise<void>;
    private notifyDataBoundRecursive;
    /**
     * Returns items configured for static layout (depth < staticDisplayLevels).
     */
    getStaticItems(): MenuItem[];
    /**
     * Returns dynamic (flyout/popup) child items for a given parent item.
     */
    getDynamicItems(parentItem: MenuItem): MenuItem[];
    /**
     * Finds an item by its valuePath (e.g. "Root/Section/Page") or by unique value.
     */
    findItem(valueOrPath: string): MenuItem | undefined;
    /**
     * Selects an item, clearing prior selection on other items.
     */
    selectItem(itemOrValue: MenuItem | string): Promise<boolean>;
    /**
     * Simulates clicking an item (triggers cancellable menuItemClick event and updates selection).
     */
    clickItem(itemOrValue: MenuItem | string): Promise<boolean>;
}
