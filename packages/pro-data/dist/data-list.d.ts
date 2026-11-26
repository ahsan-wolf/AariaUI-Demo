import { CancelEventArgs, DataBindingEventArgs, EventDispatcher } from "@wf-controls/core";
import { DataTable, DataView } from "@wf-controls/core";
import { IDataSourceControl } from "@wf-controls/core";
export type RepeatDirection = "Horizontal" | "Vertical";
export type RepeatLayout = "Table" | "Flow";
export type DataListItemType = "Header" | "Footer" | "Item" | "AlternatingItem" | "SelectedItem" | "EditItem" | "Separator";
export interface DataListItem<T> {
    itemIndex: number;
    itemType: DataListItemType;
    dataItem: T;
    dataKey?: unknown;
}
export interface DataListCommandEventArgs<T> {
    itemIndex: number;
    dataItem: T;
    commandName: string;
    commandArgument?: unknown;
}
export interface DataListCancelableItemEventArgs<T> extends CancelEventArgs {
    itemIndex: number;
    dataItem: T;
}
export interface DataListUpdateEventArgs<T> extends CancelEventArgs {
    itemIndex: number;
    dataItem: T;
    values: Partial<T>;
}
export type DataListDataSource<T> = readonly T[] | DataTable | DataView | IDataSourceControl;
export interface DataListOptions<T> {
    id: string;
    dataKeyField?: keyof T | undefined;
    dataSource?: DataListDataSource<T> | undefined;
    repeatColumns?: number | undefined;
    repeatDirection?: RepeatDirection | undefined;
    repeatLayout?: RepeatLayout | undefined;
    selectedIndex?: number | undefined;
    editIndex?: number | undefined;
    showTableBorder?: boolean | undefined;
    showHeader?: boolean | undefined;
    showFooter?: boolean | undefined;
    emptyText?: string | undefined;
}
export declare class DataListController<T extends object> {
    /** False when "data.dataList" is not licensed: rows are capped and editing is disabled (evaluation mode). */
    readonly licensed: boolean;
    get evaluationNotice(): string | undefined;
    readonly id: string;
    dataKeyField?: keyof T | undefined;
    repeatColumns: number;
    repeatDirection: RepeatDirection;
    repeatLayout: RepeatLayout;
    selectedIndex: number;
    editIndex: number;
    showTableBorder: boolean;
    showHeader: boolean;
    showFooter: boolean;
    emptyText: string;
    private source;
    private _items;
    private readonly dataSource?;
    readonly dataBinding: EventDispatcher<this, DataBindingEventArgs>;
    readonly dataBound: EventDispatcher<this, DataBindingEventArgs>;
    readonly itemCreated: EventDispatcher<this, {
        item: DataListItem<T>;
    }>;
    readonly itemDataBound: EventDispatcher<this, {
        item: DataListItem<T>;
    }>;
    readonly itemCommand: EventDispatcher<this, DataListCommandEventArgs<T>>;
    readonly selectedIndexChanged: EventDispatcher<this, {
        itemIndex: number;
        item: DataListItem<T>;
    }>;
    readonly itemEditing: EventDispatcher<this, DataListCancelableItemEventArgs<T>>;
    readonly itemUpdating: EventDispatcher<this, DataListUpdateEventArgs<T>>;
    readonly itemUpdated: EventDispatcher<this, {
        itemIndex: number;
        dataItem: T;
    }>;
    readonly itemCancelingEdit: EventDispatcher<this, DataListCancelableItemEventArgs<T>>;
    readonly itemDeleting: EventDispatcher<this, DataListCancelableItemEventArgs<T>>;
    readonly itemDeleted: EventDispatcher<this, {
        itemIndex: number;
        dataItem: T;
    }>;
    readonly stateChanged: EventDispatcher<this, {
        reason: string;
    }>;
    constructor(options: DataListOptions<T>);
    get items(): readonly DataListItem<T>[];
    get itemCount(): number;
    get rawSource(): readonly T[];
    dataBind(source?: DataListDataSource<T>): Promise<void>;
    private rebuildItems;
    /**
     * Computes a 2D matrix [rowIndex][columnIndex] of items based on RepeatColumns and RepeatDirection.
     */
    getLayoutMatrix(): (DataListItem<T> | null)[][];
    selectItem(itemIndex: number): Promise<boolean>;
    beginEdit(itemIndex: number): Promise<boolean>;
    cancelEdit(): Promise<boolean>;
    updateItem(itemIndex: number, values: Partial<T>): Promise<boolean>;
    deleteItem(itemIndex: number): Promise<boolean>;
    executeCommand(itemIndex: number, commandName: string, commandArgument?: unknown): Promise<void>;
    private requireItem;
}
