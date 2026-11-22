import { CancelEventArgs, DataBindingEventArgs, EventDispatcher, SortDirection } from "./events.js";
import { DataTable, DataView } from "@wf-controls/data";
import { IDataSourceControl } from "./datasources/data-source.js";
export interface DataGridBoundColumn<T> {
    type: "bound";
    key: string;
    dataField: keyof T;
    headerText: string;
    readOnly?: boolean | undefined;
    sortExpression?: string | undefined;
    format?: ((value: unknown, row: T) => string) | undefined;
}
export interface DataGridButtonColumn<T> {
    type: "button";
    key: string;
    commandName: string;
    text?: string | undefined;
    dataTextField?: keyof T | undefined;
    headerText?: string | undefined;
    buttonType?: "LinkButton" | "PushButton" | undefined;
}
export interface DataGridHyperLinkColumn<T> {
    type: "hyperlink";
    key: string;
    headerText?: string | undefined;
    text?: string | undefined;
    dataTextField?: keyof T | undefined;
    dataNavigateUrlField?: keyof T | undefined;
    dataNavigateUrlFormatString?: string | undefined;
    target?: string | undefined;
}
export interface DataGridTemplateColumn {
    type: "template";
    key: string;
    headerText?: string | undefined;
    sortExpression?: string | undefined;
}
export type DataGridColumn<T> = DataGridBoundColumn<T> | DataGridButtonColumn<T> | DataGridHyperLinkColumn<T> | DataGridTemplateColumn;
export interface DataGridCommandEventArgs<T> {
    itemIndex: number;
    dataItem: T;
    commandName: string;
    commandArgument?: unknown;
}
export interface DataGridCancelableCommandEventArgs<T> extends CancelEventArgs {
    itemIndex: number;
    dataItem: T;
}
export interface DataGridUpdateCommandEventArgs<T> extends CancelEventArgs {
    itemIndex: number;
    dataItem: T;
    values: Partial<T>;
}
export interface DataGridSortEventArgs extends CancelEventArgs {
    sortExpression: string;
    direction: SortDirection;
}
export interface DataGridPageEventArgs extends CancelEventArgs {
    oldPageIndex: number;
    newPageIndex: number;
}
export type DataGridDataSource<T> = readonly T[] | DataTable | DataView | IDataSourceControl;
export interface DataGridOptions<T> {
    id: string;
    dataKeyField?: keyof T | undefined;
    dataSource?: DataGridDataSource<T> | undefined;
    autoGenerateColumns?: boolean | undefined;
    columns?: DataGridColumn<T>[] | undefined;
    allowPaging?: boolean | undefined;
    pageSize?: number | undefined;
    currentPageIndex?: number | undefined;
    allowSorting?: boolean | undefined;
    editItemIndex?: number | undefined;
    selectedItemIndex?: number | undefined;
    showHeader?: boolean | undefined;
    showFooter?: boolean | undefined;
    emptyText?: string | undefined;
}
export declare class DataGridController<T extends object> {
    readonly id: string;
    dataKeyField?: keyof T | undefined;
    autoGenerateColumns: boolean;
    allowPaging: boolean;
    pageSize: number;
    currentPageIndex: number;
    allowSorting: boolean;
    editItemIndex: number;
    selectedItemIndex: number;
    showHeader: boolean;
    showFooter: boolean;
    emptyText: string;
    private _columns;
    private source;
    private sortState?;
    private readonly dataSource?;
    readonly dataBinding: EventDispatcher<this, DataBindingEventArgs>;
    readonly dataBound: EventDispatcher<this, DataBindingEventArgs>;
    readonly itemCreated: EventDispatcher<this, {
        itemIndex: number;
        dataItem: T;
    }>;
    readonly itemDataBound: EventDispatcher<this, {
        itemIndex: number;
        dataItem: T;
    }>;
    readonly itemCommand: EventDispatcher<this, DataGridCommandEventArgs<T>>;
    readonly editCommand: EventDispatcher<this, DataGridCancelableCommandEventArgs<T>>;
    readonly updateCommand: EventDispatcher<this, DataGridUpdateCommandEventArgs<T>>;
    readonly cancelCommand: EventDispatcher<this, DataGridCancelableCommandEventArgs<T>>;
    readonly deleteCommand: EventDispatcher<this, DataGridCancelableCommandEventArgs<T>>;
    readonly pageIndexChanged: EventDispatcher<this, DataGridPageEventArgs>;
    readonly sortCommand: EventDispatcher<this, DataGridSortEventArgs>;
    readonly selectedItemIndexChanged: EventDispatcher<this, {
        itemIndex: number;
        dataItem: T;
    }>;
    readonly stateChanged: EventDispatcher<this, {
        reason: string;
    }>;
    constructor(options: DataGridOptions<T>);
    get columns(): readonly DataGridColumn<T>[];
    set columns(cols: DataGridColumn<T>[]);
    get totalRecords(): number;
    get pageCount(): number;
    get visibleItems(): readonly T[];
    dataBind(source?: DataGridDataSource<T>): Promise<void>;
    private generateColumnsFromDataTable;
    private generateColumnsFromObject;
    changePage(newPageIndex: number): Promise<boolean>;
    sort(sortExpression: string, direction?: SortDirection): Promise<boolean>;
    selectItem(itemIndex: number): Promise<boolean>;
    beginEdit(itemIndex: number): Promise<boolean>;
    cancelEdit(): Promise<boolean>;
    updateItem(itemIndex: number, values: Partial<T>): Promise<boolean>;
    deleteItem(itemIndex: number): Promise<boolean>;
    executeCommand(itemIndex: number, commandName: string, commandArgument?: unknown): Promise<void>;
    private requireItem;
    private clampPageIndex;
}
