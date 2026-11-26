import {
  CancelEventArgs,
  DataBindingEventArgs,
  EventDispatcher
} from "@wf-controls/core";
import { DataTable, DataRow, DataView } from "@wf-controls/core";
import { IDataSourceControl } from "@wf-controls/core";
import { requireFeature } from "@wf-controls/license";
import { blockUnlicensed, evaluationNotice, limitRows } from "./evaluation.js";

export type RepeatDirection = "Horizontal" | "Vertical";
export type RepeatLayout = "Table" | "Flow";

export type DataListItemType =
  | "Header"
  | "Footer"
  | "Item"
  | "AlternatingItem"
  | "SelectedItem"
  | "EditItem"
  | "Separator";

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

export type DataListDataSource<T> =
  | readonly T[]
  | DataTable
  | DataView
  | IDataSourceControl;

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

export class DataListController<T extends object> {
  /** False when "data.dataList" is not licensed: rows are capped and editing is disabled (evaluation mode). */
  readonly licensed: boolean = requireFeature("data.dataList");
  get evaluationNotice(): string | undefined { return evaluationNotice("data.dataList"); }
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

  private source: T[] = [];
  private _items: DataListItem<T>[] = [];
  private readonly dataSource?: DataListDataSource<T> | undefined;

  readonly dataBinding = new EventDispatcher<this, DataBindingEventArgs>();
  readonly dataBound = new EventDispatcher<this, DataBindingEventArgs>();
  readonly itemCreated = new EventDispatcher<this, { item: DataListItem<T> }>();
  readonly itemDataBound = new EventDispatcher<this, { item: DataListItem<T> }>();
  readonly itemCommand = new EventDispatcher<this, DataListCommandEventArgs<T>>();
  readonly selectedIndexChanged = new EventDispatcher<this, { itemIndex: number; item: DataListItem<T> }>();
  readonly itemEditing = new EventDispatcher<this, DataListCancelableItemEventArgs<T>>();
  readonly itemUpdating = new EventDispatcher<this, DataListUpdateEventArgs<T>>();
  readonly itemUpdated = new EventDispatcher<this, { itemIndex: number; dataItem: T }>();
  readonly itemCancelingEdit = new EventDispatcher<this, DataListCancelableItemEventArgs<T>>();
  readonly itemDeleting = new EventDispatcher<this, DataListCancelableItemEventArgs<T>>();
  readonly itemDeleted = new EventDispatcher<this, { itemIndex: number; dataItem: T }>();
  readonly stateChanged = new EventDispatcher<this, { reason: string }>();

  constructor(options: DataListOptions<T>) {
    this.id = options.id;
    this.dataKeyField = options.dataKeyField;
    this.repeatColumns = Math.max(0, options.repeatColumns ?? 0);
    this.repeatDirection = options.repeatDirection ?? "Vertical";
    this.repeatLayout = options.repeatLayout ?? "Table";
    this.selectedIndex = options.selectedIndex ?? -1;
    this.editIndex = options.editIndex ?? -1;
    this.showTableBorder = options.showTableBorder ?? false;
    this.showHeader = options.showHeader ?? false;
    this.showFooter = options.showFooter ?? false;
    this.emptyText = options.emptyText ?? "No records available.";
    this.dataSource = options.dataSource;
  }

  get items(): readonly DataListItem<T>[] {
    return this._items;
  }

  get itemCount(): number {
    return this._items.length;
  }

  get rawSource(): readonly T[] {
    return this.source;
  }

  async dataBind(source?: DataListDataSource<T>): Promise<void> {
    const ds = source ?? this.dataSource;
    await this.dataBinding.emit(this, { itemCount: 0 });

    if (ds === undefined || ds === null) {
      this.source = [];
    } else if (ds instanceof DataTable) {
      this.source = ds.rows.toArray().map((r) => r.toObject() as T);
    } else if (ds instanceof DataView) {
      this.source = ds.toTable().rows.toArray().map((r) => r.toObject() as T);
    } else if (Array.isArray(ds)) {
      this.source = [...ds];
    } else if (isDataSourceControl(ds)) {
      const result = await ds.select();
      this.source = Array.isArray(result) ? (result as T[]) : [];
    } else {
      this.source = [];
    }

    this.source = limitRows("data.dataList", this.source);
    this.rebuildItems();

    for (const item of this._items) {
      await this.itemCreated.emit(this, { item });
      await this.itemDataBound.emit(this, { item });
    }

    await this.dataBound.emit(this, { itemCount: this._items.length });
    await this.stateChanged.emit(this, { reason: "dataBind" });
  }

  private rebuildItems(): void {
    this._items = this.source.map((dataItem, index) => {
      let itemType: DataListItemType = "Item";
      if (index === this.editIndex) {
        itemType = "EditItem";
      } else if (index === this.selectedIndex) {
        itemType = "SelectedItem";
      } else if (index % 2 === 1) {
        itemType = "AlternatingItem";
      }

      const dataKey = this.dataKeyField ? dataItem[this.dataKeyField] : undefined;

      return {
        itemIndex: index,
        itemType,
        dataItem,
        ...(dataKey === undefined ? {} : { dataKey })
      };
    });
  }

  /**
   * Computes a 2D matrix [rowIndex][columnIndex] of items based on RepeatColumns and RepeatDirection.
   */
  getLayoutMatrix(): (DataListItem<T> | null)[][] {
    if (this._items.length === 0) {
      return [];
    }

    const cols = this.repeatColumns > 0 ? this.repeatColumns : 1;
    const total = this._items.length;
    const rows = Math.ceil(total / cols);

    const matrix: (DataListItem<T> | null)[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => null)
    );

    if (this.repeatDirection === "Horizontal") {
      for (let i = 0; i < total; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const row = matrix[r];
        if (row) {
          row[c] = this._items[i] ?? null;
        }
      }
    } else {
      // Vertical repeat: fills downwards column-by-column
      for (let i = 0; i < total; i++) {
        const c = Math.floor(i / rows);
        const r = i % rows;
        const row = matrix[r];
        if (row) {
          row[c] = this._items[i] ?? null;
        }
      }
    }

    return matrix;
  }

  async selectItem(itemIndex: number): Promise<boolean> {
    if (itemIndex < 0 || itemIndex >= this._items.length) {
      return false;
    }

    this.selectedIndex = itemIndex;
    this.rebuildItems();
    const item = this._items[itemIndex]!;
    await this.selectedIndexChanged.emit(this, { itemIndex, item });
    await this.stateChanged.emit(this, { reason: "selectItem" });
    return true;
  }

  async beginEdit(itemIndex: number): Promise<boolean> {
    if (blockUnlicensed("data.dataList", "editing")) return false;
    const item = this.requireItem(itemIndex);
    const args: DataListCancelableItemEventArgs<T> = {
      itemIndex,
      dataItem: item.dataItem,
      cancel: false
    };

    await this.itemEditing.emit(this, args);
    if (args.cancel) return false;

    this.editIndex = itemIndex;
    this.rebuildItems();
    await this.stateChanged.emit(this, { reason: "beginEdit" });
    return true;
  }

  async cancelEdit(): Promise<boolean> {
    if (this.editIndex < 0 || this.editIndex >= this._items.length) {
      return false;
    }

    const item = this._items[this.editIndex]!;
    const args: DataListCancelableItemEventArgs<T> = {
      itemIndex: this.editIndex,
      dataItem: item.dataItem,
      cancel: false
    };

    await this.itemCancelingEdit.emit(this, args);
    if (args.cancel) return false;

    this.editIndex = -1;
    this.rebuildItems();
    await this.stateChanged.emit(this, { reason: "cancelEdit" });
    return true;
  }

  async updateItem(itemIndex: number, values: Partial<T>): Promise<boolean> {
    if (blockUnlicensed("data.dataList", "updating")) return false;
    const item = this.requireItem(itemIndex);
    const args: DataListUpdateEventArgs<T> = {
      itemIndex,
      dataItem: item.dataItem,
      values,
      cancel: false
    };

    await this.itemUpdating.emit(this, args);
    if (args.cancel) return false;

    if (isDataSourceControl(this.dataSource)) {
      const keyVal = this.dataKeyField ? item.dataItem[this.dataKeyField] : undefined;
      await this.dataSource.update(
        keyVal !== undefined ? { [this.dataKeyField as string]: keyVal } : {},
        values as Record<string, unknown>,
        item.dataItem as Record<string, unknown>
      );
    }

    Object.assign(item.dataItem, values);
    this.editIndex = -1;
    this.rebuildItems();

    await this.itemUpdated.emit(this, { itemIndex, dataItem: item.dataItem });
    await this.stateChanged.emit(this, { reason: "updateItem" });
    return true;
  }

  async deleteItem(itemIndex: number): Promise<boolean> {
    if (blockUnlicensed("data.dataList", "deleting")) return false;
    const item = this.requireItem(itemIndex);
    const args: DataListCancelableItemEventArgs<T> = {
      itemIndex,
      dataItem: item.dataItem,
      cancel: false
    };

    await this.itemDeleting.emit(this, args);
    if (args.cancel) return false;

    if (isDataSourceControl(this.dataSource)) {
      const keyVal = this.dataKeyField ? item.dataItem[this.dataKeyField] : undefined;
      await this.dataSource.delete(
        keyVal !== undefined ? { [this.dataKeyField as string]: keyVal } : {},
        item.dataItem as Record<string, unknown>
      );
    }

    this.source.splice(itemIndex, 1);
    if (this.editIndex === itemIndex) this.editIndex = -1;
    if (this.selectedIndex === itemIndex) this.selectedIndex = -1;

    this.rebuildItems();
    await this.itemDeleted.emit(this, { itemIndex, dataItem: item.dataItem });
    await this.stateChanged.emit(this, { reason: "deleteItem" });
    return true;
  }

  async executeCommand(itemIndex: number, commandName: string, commandArgument?: unknown): Promise<void> {
    const item = this.requireItem(itemIndex);
    await this.itemCommand.emit(this, {
      itemIndex,
      dataItem: item.dataItem,
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

  private requireItem(index: number): DataListItem<T> {
    const item = this._items[index];
    if (!item) {
      throw new RangeError(`DataList item index ${index} out of bounds.`);
    }
    return item;
  }
}
