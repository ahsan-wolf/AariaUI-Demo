import { DataBindingEventArgs, EventDispatcher, GridCancelableRowEventArgs, GridCommandEventArgs, GridPageEventArgs, GridRowEventArgs, GridSortEventArgs, GridUpdateEventArgs, SortDirection } from "@wf-controls/core";
import { DataTable, DataView } from "@wf-controls/core";
import { IDataSourceControl } from "@wf-controls/core";
export interface BoundColumn<T> {
    type: "bound";
    key: string;
    dataField: keyof T;
    headerText: string;
    sortable?: boolean;
    visible?: boolean;
    format?: (value: unknown, row: T) => string;
}
export interface TemplateColumn {
    type: "template";
    key: string;
    headerText: string;
    visible?: boolean;
}
export type GridColumn<T> = BoundColumn<T> | TemplateColumn;
export type GridDataSource<T> = readonly T[] | DataTable | DataView | IDataSourceControl;
export interface GridViewOptions<T> {
    id: string;
    dataKeyField: keyof T;
    columns: GridColumn<T>[];
    dataSource?: GridDataSource<T>;
    dataSourceId?: string;
    allowPaging?: boolean;
    allowSorting?: boolean;
    pageSize?: number;
    pageIndex?: number;
    selectedIndex?: number;
    editIndex?: number;
    emptyDataText?: string;
    showHeader?: boolean;
    showFooter?: boolean;
    cssClass?: string;
    rowCssClass?: string;
    alternatingRowCssClass?: string;
    selectedRowCssClass?: string;
    editRowCssClass?: string;
    headerCssClass?: string;
    footerCssClass?: string;
    pagerCssClass?: string;
    tableCssClass?: string;
    causesValidation?: boolean | undefined;
    validationGroup?: string | undefined;
}
export declare class GridViewController<T extends object> {
    private source;
    /** Set when a data source returns `{ items, total }`: the source then holds only the current page. */
    private serverTotal;
    /** Absolute index of `source[0]` (non-zero only for server-side paging). */
    private sourceOffset;
    private sortState?;
    readonly dataBinding: EventDispatcher<this, DataBindingEventArgs>;
    readonly dataBound: EventDispatcher<this, DataBindingEventArgs>;
    readonly rowCreated: EventDispatcher<this, GridRowEventArgs<T>>;
    readonly rowDataBound: EventDispatcher<this, GridRowEventArgs<T>>;
    readonly rowCommand: EventDispatcher<this, GridCommandEventArgs<T>>;
    readonly rowEditing: EventDispatcher<this, GridCancelableRowEventArgs<T>>;
    readonly rowUpdating: EventDispatcher<this, GridUpdateEventArgs<T>>;
    readonly rowUpdated: EventDispatcher<this, GridRowEventArgs<T>>;
    readonly rowCancelingEdit: EventDispatcher<this, GridCancelableRowEventArgs<T>>;
    readonly rowDeleting: EventDispatcher<this, GridCancelableRowEventArgs<T>>;
    readonly rowDeleted: EventDispatcher<this, GridRowEventArgs<T>>;
    readonly selectedIndexChanging: EventDispatcher<this, GridCancelableRowEventArgs<T>>;
    readonly selectedIndexChanged: EventDispatcher<this, GridRowEventArgs<T>>;
    readonly pageIndexChanging: EventDispatcher<this, GridPageEventArgs>;
    readonly pageIndexChanged: EventDispatcher<this, GridPageEventArgs>;
    readonly sorting: EventDispatcher<this, GridSortEventArgs>;
    readonly sorted: EventDispatcher<this, GridSortEventArgs>;
    readonly stateChanged: EventDispatcher<this, {
        reason: string;
    }>;
    /** False when "data.gridView" is not licensed: rows are capped and editing is disabled (evaluation mode). */
    readonly licensed: boolean;
    /** Text for the adapter to show (watermark / evaluation limit), or undefined when fully licensed. */
    get evaluationNotice(): string | undefined;
    readonly options: Required<Pick<GridViewOptions<T>, "allowPaging" | "allowSorting" | "pageSize" | "pageIndex" | "selectedIndex" | "editIndex" | "emptyDataText" | "showHeader" | "showFooter">> & GridViewOptions<T>;
    constructor(options: GridViewOptions<T>);
    get dataSource(): readonly T[];
    get totalRecords(): number;
    get pageCount(): number;
    get visibleRows(): readonly T[];
    get currentSort(): Readonly<{
        field: keyof T;
        direction: SortDirection;
    }> | undefined;
    dataBind(data?: GridDataSource<T>): Promise<void>;
    getDataKey(row: T): unknown;
    getAbsoluteRowIndex(visibleIndex: number): number;
    executeCommand(rowIndex: number, commandName: string, commandArgument?: unknown): Promise<void>;
    private resolveRowIndex;
    beginEdit(rowOrIndex: number | T): Promise<boolean>;
    updateRow(rowOrIndex: number | T, values: Partial<T>): Promise<boolean>;
    cancelEdit(): Promise<boolean>;
    deleteRow(rowOrIndex: number | T): Promise<boolean>;
    selectRow(rowOrIndex: number | T): Promise<boolean>;
    changePage(newPageIndex: number): Promise<boolean>;
    sort(field: keyof T, direction?: SortDirection): Promise<boolean>;
    private requireRow;
    private clampPageIndex;
    private notify;
}
