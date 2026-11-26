import {
  CancelEventArgs,
  DataBindingEventArgs,
  EventDispatcher,
  SortDirection
} from "./events.js";
import { DataTable, DataRow, DataView } from "@wf-controls/data";
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

export type DataGridColumn<T> =
  | DataGridBoundColumn<T>
  | DataGridButtonColumn<T>
  | DataGridHyperLinkColumn<T>
  | DataGridTemplateColumn;

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

export type DataGridDataSource<T> =
  | readonly T[]
  | DataTable
  | DataView
  | IDataSourceControl;

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

export class DataGridController<T extends object> {
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

  private _columns: DataGridColumn<T>[] = [];
  private source: T[] = [];
  private sortState?: { field: string; direction: SortDirection } | undefined;
  private readonly dataSource?: DataGridDataSource<T> | undefined;

  readonly dataBinding = new EventDispatcher<this, DataBindingEventArgs>();
  readonly dataBound = new EventDispatcher<this, DataBindingEventArgs>();
  readonly itemCreated = new EventDispatcher<this, { itemIndex: number; dataItem: T }>();
  readonly itemDataBound = new EventDispatcher<this, { itemIndex: number; dataItem: T }>();
  readonly itemCommand = new EventDispatcher<this, DataGridCommandEventArgs<T>>();
  readonly editCommand = new EventDispatcher<this, DataGridCancelableCommandEventArgs<T>>();
  readonly updateCommand = new EventDispatcher<this, DataGridUpdateCommandEventArgs<T>>();
  readonly cancelCommand = new EventDispatcher<this, DataGridCancelableCommandEventArgs<T>>();
  readonly deleteCommand = new EventDispatcher<this, DataGridCancelableCommandEventArgs<T>>();
  readonly pageIndexChanged = new EventDispatcher<this, DataGridPageEventArgs>();
  readonly sortCommand = new EventDispatcher<this, DataGridSortEventArgs>();
  readonly selectedItemIndexChanged = new EventDispatcher<this, { itemIndex: number; dataItem: T }>();
  readonly stateChanged = new EventDispatcher<this, { reason: string }>();

  constructor(options: DataGridOptions<T>) {
    this.id = options.id;
    this.dataKeyField = options.dataKeyField;
    this.autoGenerateColumns = options.autoGenerateColumns ?? true;
    this.allowPaging = options.allowPaging ?? false;
    this.pageSize = Math.max(1, options.pageSize ?? 10);
    this.currentPageIndex = Math.max(0, options.currentPageIndex ?? 0);
    this.allowSorting = options.allowSorting ?? false;
    this.editItemIndex = options.editItemIndex ?? -1;
    this.selectedItemIndex = options.selectedItemIndex ?? -1;
    this.showHeader = options.showHeader ?? true;
    this.showFooter = options.showFooter ?? false;
    this.emptyText = options.emptyText ?? "No records found.";
    this.dataSource = options.dataSource;

    if (options.columns) {
      this._columns = [...options.columns];
    }
  }

  get columns(): readonly DataGridColumn<T>[] {
    return this._columns;
  }

  set columns(cols: DataGridColumn<T>[]) {
    this._columns = [...cols];
  }

  get totalRecords(): number {
    return this.source.length;
  }

  get pageCount(): number {
    if (this.source.length === 0) return 0;
    return this.allowPaging ? Math.ceil(this.source.length / this.pageSize) : 1;
  }

  get visibleItems(): readonly T[] {
    if (!this.allowPaging) {
      return this.source;
    }
    const start = this.currentPageIndex * this.pageSize;
    return this.source.slice(start, start + this.pageSize);
  }

  async dataBind(source?: DataGridDataSource<T>): Promise<void> {
    const ds = source ?? this.dataSource;
    await this.dataBinding.emit(this, { itemCount: 0 });

    if (ds === undefined || ds === null) {
      this.source = [];
    } else if (ds instanceof DataTable) {
      this.source = ds.rows.toArray().map((r) => r.toObject() as T);
      if (this.autoGenerateColumns && this._columns.length === 0) {
        this.generateColumnsFromDataTable(ds);
      }
    } else if (ds instanceof DataView) {
      const tbl = ds.toTable();
      this.source = tbl.rows.toArray().map((r) => r.toObject() as T);
      if (this.autoGenerateColumns && this._columns.length === 0) {
        this.generateColumnsFromDataTable(tbl);
      }
    } else if (Array.isArray(ds)) {
      this.source = [...ds];
      if (this.autoGenerateColumns && this._columns.length === 0 && this.source.length > 0) {
        this.generateColumnsFromObject(this.source[0]!);
      }
    } else if (isDataSourceControl(ds)) {
      const result = await ds.select();
      this.source = Array.isArray(result) ? (result as T[]) : [];
      if (this.autoGenerateColumns && this._columns.length === 0 && this.source.length > 0) {
        this.generateColumnsFromObject(this.source[0]!);
      }
    } else {
      this.source = [];
    }

    this.clampPageIndex();

    const itemsToNotify = this.visibleItems;
    for (let i = 0; i < itemsToNotify.length; i++) {
      const dataItem = itemsToNotify[i]!;
      await this.itemCreated.emit(this, { itemIndex: i, dataItem });
      await this.itemDataBound.emit(this, { itemIndex: i, dataItem });
    }

    await this.dataBound.emit(this, { itemCount: this.source.length });
    await this.stateChanged.emit(this, { reason: "dataBind" });
  }

  private generateColumnsFromDataTable(table: DataTable): void {
    const generated: DataGridColumn<T>[] = [];
    for (const col of table.columns.toArray()) {
      generated.push({
        type: "bound",
        key: col.columnName,
        dataField: col.columnName as keyof T,
        headerText: col.caption || col.columnName,
        sortExpression: col.columnName,
        readOnly: col.readOnly
      });
    }
    this._columns = generated;
  }

  private generateColumnsFromObject(sample: T): void {
    const generated: DataGridColumn<T>[] = [];
    for (const key of Object.keys(sample)) {
      generated.push({
        type: "bound",
        key,
        dataField: key as keyof T,
        headerText: formatHeaderText(key),
        sortExpression: key
      });
    }
    this._columns = generated;
  }

  async changePage(newPageIndex: number): Promise<boolean> {
    const maxPage = Math.max(0, this.pageCount - 1);
    const safeIndex = Math.min(Math.max(0, newPageIndex), maxPage);

    const args: DataGridPageEventArgs = {
      oldPageIndex: this.currentPageIndex,
      newPageIndex: safeIndex,
      cancel: false
    };

    await this.pageIndexChanged.emit(this, args);
    if (args.cancel) return false;

    this.currentPageIndex = safeIndex;

    if (isDataSourceControl(this.dataSource)) {
      await this.dataBind();
    }

    await this.stateChanged.emit(this, { reason: "changePage" });
    return true;
  }

  async sort(sortExpression: string, direction?: SortDirection): Promise<boolean> {
    if (!this.allowSorting) return false;

    const nextDir =
      direction ??
      (this.sortState?.field === sortExpression && this.sortState.direction === "asc" ? "desc" : "asc");

    const args: DataGridSortEventArgs = {
      sortExpression,
      direction: nextDir,
      cancel: false
    };

    await this.sortCommand.emit(this, args);
    if (args.cancel) return false;

    this.sortState = { field: sortExpression, direction: nextDir };

    if (isDataSourceControl(this.dataSource)) {
      await this.dataBind();
    } else {
      const field = sortExpression as keyof T;
      this.source.sort(
        (a, b) => compareValues(a[field], b[field]) * (nextDir === "asc" ? 1 : -1)
      );
    }

    await this.stateChanged.emit(this, { reason: "sort" });
    return true;
  }

  async selectItem(itemIndex: number): Promise<boolean> {
    const dataItem = this.requireItem(itemIndex);
    this.selectedItemIndex = itemIndex;
    await this.selectedItemIndexChanged.emit(this, { itemIndex, dataItem });
    await this.stateChanged.emit(this, { reason: "selectItem" });
    return true;
  }

  async beginEdit(itemIndex: number): Promise<boolean> {
    const dataItem = this.requireItem(itemIndex);
    const args: DataGridCancelableCommandEventArgs<T> = {
      itemIndex,
      dataItem,
      cancel: false
    };

    await this.editCommand.emit(this, args);
    if (args.cancel) return false;

    this.editItemIndex = itemIndex;
    await this.stateChanged.emit(this, { reason: "beginEdit" });
    return true;
  }

  async cancelEdit(): Promise<boolean> {
    if (this.editItemIndex < 0) return false;
    const dataItem = this.requireItem(this.editItemIndex);
    const args: DataGridCancelableCommandEventArgs<T> = {
      itemIndex: this.editItemIndex,
      dataItem,
      cancel: false
    };

    await this.cancelCommand.emit(this, args);
    if (args.cancel) return false;

    this.editItemIndex = -1;
    await this.stateChanged.emit(this, { reason: "cancelEdit" });
    return true;
  }

  async updateItem(itemIndex: number, values: Partial<T>): Promise<boolean> {
    const dataItem = this.requireItem(itemIndex);
    const args: DataGridUpdateCommandEventArgs<T> = {
      itemIndex,
      dataItem,
      values,
      cancel: false
    };

    await this.updateCommand.emit(this, args);
    if (args.cancel) return false;

    if (isDataSourceControl(this.dataSource)) {
      const keyVal = this.dataKeyField ? dataItem[this.dataKeyField] : undefined;
      await this.dataSource.update(
        keyVal !== undefined ? { [this.dataKeyField as string]: keyVal } : {},
        values as Record<string, unknown>,
        dataItem as Record<string, unknown>
      );
    }

    Object.assign(dataItem, values);
    this.editItemIndex = -1;
    await this.stateChanged.emit(this, { reason: "updateItem" });
    return true;
  }

  async deleteItem(itemIndex: number): Promise<boolean> {
    const dataItem = this.requireItem(itemIndex);
    const args: DataGridCancelableCommandEventArgs<T> = {
      itemIndex,
      dataItem,
      cancel: false
    };

    await this.deleteCommand.emit(this, args);
    if (args.cancel) return false;

    if (isDataSourceControl(this.dataSource)) {
      const keyVal = this.dataKeyField ? dataItem[this.dataKeyField] : undefined;
      await this.dataSource.delete(
        keyVal !== undefined ? { [this.dataKeyField as string]: keyVal } : {},
        dataItem as Record<string, unknown>
      );
    }

    this.source.splice(itemIndex, 1);
    this.clampPageIndex();
    if (this.editItemIndex === itemIndex) this.editItemIndex = -1;
    if (this.selectedItemIndex === itemIndex) this.selectedItemIndex = -1;

    await this.stateChanged.emit(this, { reason: "deleteItem" });
    return true;
  }

  async executeCommand(itemIndex: number, commandName: string, commandArgument?: unknown): Promise<void> {
    const dataItem = this.requireItem(itemIndex);
    await this.itemCommand.emit(this, {
      itemIndex,
      dataItem,
      commandName,
      ...(commandArgument === undefined ? {} : { commandArgument })
    });

    switch (commandName.toLowerCase()) {
      case "edit":
        await this.beginEdit(itemIndex);
        break;
      case "cancel":
        await this.cancelEdit();
        break;
      case "delete":
        await this.deleteItem(itemIndex);
        break;
      case "select":
        await this.selectItem(itemIndex);
        break;
    }
  }

  private requireItem(index: number): T {
    const item = this.source[index];
    if (!item) {
      throw new RangeError(`DataGrid item index ${index} out of bounds.`);
    }
    return item;
  }

  private clampPageIndex(): void {
    if (!this.allowPaging) {
      this.currentPageIndex = 0;
      return;
    }
    this.currentPageIndex = Math.min(
      this.currentPageIndex,
      Math.max(0, this.pageCount - 1)
    );
  }
}

function formatHeaderText(propName: string): string {
  // Convert camelCase or PascalCase to "Title Case"
  return propName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function compareValues(a: unknown, b: unknown): number {
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
