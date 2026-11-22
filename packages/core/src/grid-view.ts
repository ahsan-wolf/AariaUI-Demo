import {
  CancelEventArgs,
  DataBindingEventArgs,
  EventDispatcher,
  GridCancelableRowEventArgs,
  GridCommandEventArgs,
  GridPageEventArgs,
  GridRowEventArgs,
  GridSortEventArgs,
  GridUpdateEventArgs,
  SortDirection
} from "./events.js";
import { DataTable, DataRow, DataView } from "@wf-controls/data";
import { IDataSourceControl } from "./datasources/data-source.js";
import { ValidatorManager } from "./validation/validator-manager.js";

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

export type GridDataSource<T> =
  | readonly T[]
  | DataTable
  | DataView
  | IDataSourceControl;

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

function isDataSourceControl(obj: unknown): obj is IDataSourceControl {
  return (
    typeof obj === "object" &&
    obj !== null &&
    !(obj instanceof DataTable) &&
    !(obj instanceof DataView) &&
    "select" in obj &&
    typeof (obj as IDataSourceControl).select === "function"
  );
}

export class GridViewController<T extends object> {
  private source: T[] = [];
  /** Set when a data source returns `{ items, total }`: the source then holds only the current page. */
  private serverTotal: number | undefined;
  /** Absolute index of `source[0]` (non-zero only for server-side paging). */
  private sourceOffset = 0;
  private sortState?: { field: keyof T; direction: SortDirection };
  readonly dataBinding = new EventDispatcher<this, DataBindingEventArgs>();
  readonly dataBound = new EventDispatcher<this, DataBindingEventArgs>();
  readonly rowCreated = new EventDispatcher<this, GridRowEventArgs<T>>();
  readonly rowDataBound = new EventDispatcher<this, GridRowEventArgs<T>>();
  readonly rowCommand = new EventDispatcher<this, GridCommandEventArgs<T>>();
  readonly rowEditing = new EventDispatcher<this, GridCancelableRowEventArgs<T>>();
  readonly rowUpdating = new EventDispatcher<this, GridUpdateEventArgs<T>>();
  readonly rowUpdated = new EventDispatcher<this, GridRowEventArgs<T>>();
  readonly rowCancelingEdit = new EventDispatcher<this, GridCancelableRowEventArgs<T>>();
  readonly rowDeleting = new EventDispatcher<this, GridCancelableRowEventArgs<T>>();
  readonly rowDeleted = new EventDispatcher<this, GridRowEventArgs<T>>();
  readonly selectedIndexChanging = new EventDispatcher<this, GridCancelableRowEventArgs<T>>();
  readonly selectedIndexChanged = new EventDispatcher<this, GridRowEventArgs<T>>();
  readonly pageIndexChanging = new EventDispatcher<this, GridPageEventArgs>();
  readonly pageIndexChanged = new EventDispatcher<this, GridPageEventArgs>();
  readonly sorting = new EventDispatcher<this, GridSortEventArgs>();
  readonly sorted = new EventDispatcher<this, GridSortEventArgs>();
  readonly stateChanged = new EventDispatcher<this, { reason: string }>();

  readonly options: Required<
    Pick<
      GridViewOptions<T>,
      | "allowPaging"
      | "allowSorting"
      | "pageSize"
      | "pageIndex"
      | "selectedIndex"
      | "editIndex"
      | "emptyDataText"
      | "showHeader"
      | "showFooter"
    >
  > &
    GridViewOptions<T>;

  constructor(options: GridViewOptions<T>) {
    this.options = {
      allowPaging: false,
      allowSorting: false,
      pageSize: 10,
      pageIndex: 0,
      selectedIndex: -1,
      editIndex: -1,
      emptyDataText: "No records found.",
      showHeader: true,
      showFooter: false,
      causesValidation: false,
      ...options
    };
  }

  get dataSource(): readonly T[] {
    return this.source;
  }

  get totalRecords(): number {
    return this.serverTotal ?? this.source.length;
  }

  get pageCount(): number {
    const total = this.totalRecords;
    return total === 0
      ? 0
      : this.options.allowPaging
      ? Math.ceil(total / this.options.pageSize)
      : 1;
  }

  get visibleRows(): readonly T[] {
    if (!this.options.allowPaging || this.serverTotal !== undefined) return this.source;
    const start = this.options.pageIndex * this.options.pageSize;
    return this.source.slice(start, start + this.options.pageSize);
  }

  get currentSort(): Readonly<{ field: keyof T; direction: SortDirection }> | undefined {
    return this.sortState;
  }

  async dataBind(data?: GridDataSource<T>): Promise<void> {
    if (data !== undefined) {
      this.options.dataSource = data;
    }
    const sourceToBind = this.options.dataSource;
    let rows: T[] = [];
    let serverTotal: number | undefined;

    if (sourceToBind) {
      if (Array.isArray(sourceToBind)) {
        rows = [...sourceToBind];
      } else if (sourceToBind instanceof DataTable) {
        rows = sourceToBind.rows.toArray().map((r: DataRow) => r.toObject() as T);
      } else if (sourceToBind instanceof DataView) {
        rows = sourceToBind.toRows().map((r) => r.toObject() as T);
      } else if (isDataSourceControl(sourceToBind)) {
        const selectArgs = {
          startRowIndex: this.options.allowPaging
            ? this.options.pageIndex * this.options.pageSize
            : undefined,
          maximumRows: this.options.allowPaging ? this.options.pageSize : undefined,
          sortExpression: this.sortState
            ? `${String(this.sortState.field)} ${this.sortState.direction.toUpperCase()}`
            : undefined
        };
        const res = await sourceToBind.select(selectArgs);
        if (Array.isArray(res)) {
          rows = [...res] as T[];
        } else if (res instanceof DataTable) {
          rows = res.rows.toArray().map((r: DataRow) => r.toObject() as T);
        } else if (res instanceof DataView) {
          rows = res.toRows().map((r) => r.toObject() as T);
        } else if (
          res &&
          typeof res === "object" &&
          "items" in (res as Record<string, unknown>)
        ) {
          const items = (res as Record<string, unknown>).items;
          if (Array.isArray(items)) rows = [...items] as T[];
          // `{ items, total }` means server-side paging: `items` is only the requested page.
          const total = (res as Record<string, unknown>).total;
          if (typeof total === "number" && this.options.allowPaging) serverTotal = total;
        }
      }
    }

    await this.dataBinding.emit(this, { itemCount: rows.length });
    this.source = rows;
    this.serverTotal = serverTotal;
    this.clampPageIndex();
    this.sourceOffset = serverTotal !== undefined ? this.options.pageIndex * this.options.pageSize : 0;
    for (let i = 0; i < this.source.length; i++) {
      const dataItem = this.requireRow(i + this.sourceOffset);
      const args = { rowIndex: i + this.sourceOffset, dataItem };
      await this.rowCreated.emit(this, args);
      await this.rowDataBound.emit(this, args);
    }
    await this.dataBound.emit(this, { itemCount: this.totalRecords });
    await this.notify("dataBind");
  }

  getDataKey(row: T): unknown {
    return row[this.options.dataKeyField];
  }

  getAbsoluteRowIndex(visibleIndex: number): number {
    return this.options.allowPaging
      ? this.options.pageIndex * this.options.pageSize + visibleIndex
      : visibleIndex;
  }

  async executeCommand(
    rowIndex: number,
    commandName: string,
    commandArgument?: unknown
  ): Promise<void> {
    const dataItem = this.requireRow(rowIndex);
    await this.rowCommand.emit(this, {
      rowIndex,
      dataItem,
      commandName,
      ...(commandArgument === undefined ? {} : { commandArgument })
    });
    switch (commandName.toLowerCase()) {
      case "edit":
        await this.beginEdit(rowIndex);
        break;
      case "delete":
        await this.deleteRow(rowIndex);
        break;
      case "select":
        await this.selectRow(rowIndex);
        break;
      case "cancel":
        await this.cancelEdit();
        break;
    }
  }

  private resolveRowIndex(rowOrIndex: number | T): number {
    if (typeof rowOrIndex === "number") return rowOrIndex;
    const i = this.source.indexOf(rowOrIndex);
    return i < 0 ? i : i + this.sourceOffset;
  }

  async beginEdit(rowOrIndex: number | T): Promise<boolean> {
    const rowIndex = this.resolveRowIndex(rowOrIndex);
    const args = { rowIndex, dataItem: this.requireRow(rowIndex), cancel: false };
    await this.rowEditing.emit(this, args);
    if (args.cancel) return false;
    this.options.editIndex = rowIndex;
    await this.notify("beginEdit");
    return true;
  }

  async updateRow(rowOrIndex: number | T, values: Partial<T>): Promise<boolean> {
    const rowIndex = this.resolveRowIndex(rowOrIndex);
    if (this.options.causesValidation) {
      const valid = await ValidatorManager.validate(this.options.validationGroup);
      if (!valid) {
        return false;
      }
    }

    const args = { rowIndex, dataItem: this.requireRow(rowIndex), values, cancel: false };
    await this.rowUpdating.emit(this, args);
    if (args.cancel) return false;

    if (isDataSourceControl(this.options.dataSource)) {
      const keyVal = this.getDataKey(args.dataItem);
      await this.options.dataSource.update(
        { [this.options.dataKeyField as string]: keyVal },
        values as Record<string, unknown>,
        args.dataItem as Record<string, unknown>
      );
    }

    Object.assign(args.dataItem, values);
    this.options.editIndex = -1;
    await this.rowUpdated.emit(this, { rowIndex, dataItem: args.dataItem });
    await this.notify("updateRow");
    return true;
  }

  async cancelEdit(): Promise<boolean> {
    const rowIndex = this.options.editIndex;
    if (rowIndex < 0) return false;
    const args = { rowIndex, dataItem: this.requireRow(rowIndex), cancel: false };
    await this.rowCancelingEdit.emit(this, args);
    if (args.cancel) return false;
    this.options.editIndex = -1;
    await this.notify("cancelEdit");
    return true;
  }

  async deleteRow(rowOrIndex: number | T): Promise<boolean> {
    const rowIndex = this.resolveRowIndex(rowOrIndex);
    const dataItem = this.requireRow(rowIndex);
    const args = { rowIndex, dataItem, cancel: false };
    await this.rowDeleting.emit(this, args);
    if (args.cancel) return false;

    if (isDataSourceControl(this.options.dataSource)) {
      const keyVal = this.getDataKey(dataItem);
      await this.options.dataSource.delete(
        { [this.options.dataKeyField as string]: keyVal },
        dataItem as Record<string, unknown>
      );
    }

    this.source.splice(rowIndex - this.sourceOffset, 1);
    if (this.serverTotal !== undefined) this.serverTotal -= 1;
    this.clampPageIndex();
    await this.rowDeleted.emit(this, { rowIndex, dataItem });
    await this.notify("deleteRow");
    return true;
  }

  async selectRow(rowOrIndex: number | T): Promise<boolean> {
    const rowIndex = this.resolveRowIndex(rowOrIndex);
    const dataItem = this.requireRow(rowIndex);
    const args = { rowIndex, dataItem, cancel: false };
    await this.selectedIndexChanging.emit(this, args);
    if (args.cancel) return false;
    this.options.selectedIndex = rowIndex;
    await this.selectedIndexChanged.emit(this, { rowIndex, dataItem });
    await this.notify("selectRow");
    return true;
  }

  async changePage(newPageIndex: number): Promise<boolean> {
    const maximum = Math.max(0, this.pageCount - 1);
    const safeIndex = Math.min(Math.max(0, newPageIndex), maximum);
    const args = { oldPageIndex: this.options.pageIndex, newPageIndex: safeIndex, cancel: false };
    await this.pageIndexChanging.emit(this, args);
    if (args.cancel) return false;
    this.options.pageIndex = safeIndex;

    if (isDataSourceControl(this.options.dataSource)) {
      await this.dataBind();
    }

    await this.pageIndexChanged.emit(this, args);
    await this.notify("changePage");
    return true;
  }

  async sort(field: keyof T, direction?: SortDirection): Promise<boolean> {
    if (!this.options.allowSorting) return false;
    const nextDirection =
      direction ??
      (this.sortState?.field === field && this.sortState.direction === "asc" ? "desc" : "asc");
    const args = { sortExpression: String(field), direction: nextDirection, cancel: false };
    await this.sorting.emit(this, args);
    if (args.cancel) return false;
    this.sortState = { field, direction: nextDirection };

    if (isDataSourceControl(this.options.dataSource)) {
      await this.dataBind();
    } else {
      this.source.sort(
        (a, b) => compare(a[field], b[field]) * (nextDirection === "asc" ? 1 : -1)
      );
    }

    await this.sorted.emit(this, args);
    await this.notify("sort");
    return true;
  }

  private requireRow(index: number): T {
    const row = this.source[index - this.sourceOffset];
    if (!row) throw new RangeError(`Grid row ${index} does not exist.`);
    return row;
  }

  private clampPageIndex(): void {
    this.options.pageIndex = Math.min(
      this.options.pageIndex,
      Math.max(0, this.pageCount - 1)
    );
  }

  private async notify(reason: string): Promise<void> {
    await this.stateChanged.emit(this, { reason });
  }
}

function compare(a: unknown, b: unknown): number {
  if (Object.is(a, b)) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base"
  });
}
