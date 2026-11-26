import {
  DataBindingEventArgs,
  EventDispatcher,
  RepeaterCommandEventArgs,
  RepeaterItemEventArgs,
  RepeaterValueEventArgs,
  RepeaterCancelableItemEventArgs,
  RepeaterUpdateEventArgs
} from "@wf-controls/core";
import { DataTable, DataRow, DataView } from "@wf-controls/core";
import { IDataSourceControl } from "@wf-controls/core";
import { requireFeature } from "@wf-controls/license";
import { blockUnlicensed, evaluationNotice, limitRows } from "./evaluation.js";

export type RepeaterDataSource<T> =
  | readonly T[]
  | DataTable
  | DataView
  | IDataSourceControl;

export interface RepeaterOptions<T> {
  id: string;
  dataKeyField?: keyof T | undefined;
  dataSource?: RepeaterDataSource<T> | undefined;
  dataSourceId?: string | undefined;
  cssClass?: string | undefined;
  itemCssClass?: string | undefined;
  alternatingItemCssClass?: string | undefined;
  dataMember?: string | undefined;
  itemHeaderVisible?: boolean | undefined;
  virtualMode?: boolean | undefined;
  allowUserToAddItems?: boolean | undefined;
  allowUserToDeleteItems?: boolean | undefined;
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

export class RepeaterController<T extends object> {
  /** False when "data.repeater" is not licensed: rows are capped and editing is disabled (evaluation mode). */
  readonly licensed: boolean = requireFeature("data.repeater");
  get evaluationNotice(): string | undefined { return evaluationNotice("data.repeater"); }
  private source: T[] = [];
  private currentIndex = -1;
  private resetDepth = 0;
  private editIndex = -1;
  readonly dataBinding = new EventDispatcher<this, DataBindingEventArgs>();
  readonly dataBound = new EventDispatcher<this, DataBindingEventArgs>();
  readonly itemCreated = new EventDispatcher<this, RepeaterItemEventArgs<T>>();
  readonly itemDataBound = new EventDispatcher<this, RepeaterItemEventArgs<T>>();
  readonly itemCommand = new EventDispatcher<this, RepeaterCommandEventArgs<T>>();
  readonly currentItemIndexChanged = new EventDispatcher<this, RepeaterItemEventArgs<T>>();
  readonly itemEditing = new EventDispatcher<this, RepeaterCancelableItemEventArgs<T>>();
  readonly itemUpdating = new EventDispatcher<this, RepeaterUpdateEventArgs<T>>();
  readonly itemUpdated = new EventDispatcher<this, RepeaterItemEventArgs<T>>();
  readonly itemCancelingEdit = new EventDispatcher<this, RepeaterCancelableItemEventArgs<T>>();
  readonly onDrawItem = new EventDispatcher<this, RepeaterItemEventArgs<T>>();
  readonly onItemCloned = new EventDispatcher<this, RepeaterItemEventArgs<T>>();
  readonly onItemValueNeeded = new EventDispatcher<this, RepeaterValueEventArgs<T>>();
  readonly onItemValuePushed = new EventDispatcher<this, RepeaterValueEventArgs<T>>();
  readonly stateChanged = new EventDispatcher<this, { reason: string }>();

  constructor(readonly options: RepeaterOptions<T>) {}
  get items(): readonly T[] {
    return this.source;
  }
  get currentItemIndex(): number {
    return this.currentIndex;
  }
  get editItemIndex(): number {
    return this.editIndex;
  }
  get itemCount(): number {
    return this.source.length;
  }
  get isResetting(): boolean {
    return this.resetDepth > 0;
  }
  getDataKey(item: T, index: number): unknown {
    return this.options.dataKeyField ? item[this.options.dataKeyField] : index;
  }

  async dataBind(data?: RepeaterDataSource<T> | undefined): Promise<void> {
    if (data !== undefined) {
      this.options.dataSource = data;
    }
    const sourceToBind = this.options.dataSource;
    let items: T[] = [];

    if (sourceToBind) {
      if (Array.isArray(sourceToBind)) {
        items = [...sourceToBind];
      } else if (sourceToBind instanceof DataTable) {
        items = sourceToBind.rows.toArray().map((r: DataRow) => r.toObject() as T);
      } else if (sourceToBind instanceof DataView) {
        items = sourceToBind.toRows().map((r) => r.toObject() as T);
      } else if (isDataSourceControl(sourceToBind)) {
        const res = await sourceToBind.select();
        if (Array.isArray(res)) {
          items = [...res] as T[];
        } else if (res instanceof DataTable) {
          items = res.rows.toArray().map((r: DataRow) => r.toObject() as T);
        } else if (res instanceof DataView) {
          items = res.toRows().map((r) => r.toObject() as T);
        } else if (
          res &&
          typeof res === "object" &&
          "items" in (res as Record<string, unknown>)
        ) {
          const arr = (res as Record<string, unknown>).items;
          if (Array.isArray(arr)) items = [...arr] as T[];
        }
      }
    }

    items = limitRows("data.repeater", items);
    await this.dataBinding.emit(this, { itemCount: items.length });
    this.source = items;
    await this.itemCreated.emit(this, { itemIndex: -1, itemType: "Header" });
    for (let i = 0; i < this.source.length; i++) {
      let dataItem = this.source[i];
      if (!dataItem) continue;
      if (this.options.virtualMode) {
        const valueArgs = {
          itemIndex: i,
          itemType: i % 2 === 0 ? ("Item" as const) : ("AlternatingItem" as const),
          dataItem,
          ...(this.options.dataMember === undefined
            ? {}
            : { dataMember: this.options.dataMember }),
          value: dataItem
        };
        await this.onItemValueNeeded.emit(this, valueArgs);
        dataItem = valueArgs.value ?? dataItem;
      }
      const itemType = i % 2 === 0 ? ("Item" as const) : ("AlternatingItem" as const);
      const args = { itemIndex: i, itemType, dataItem };
      await this.itemCreated.emit(this, args);
      await this.itemDataBound.emit(this, args);
      await this.onItemCloned.emit(this, args);
      await this.onDrawItem.emit(this, args);
      if (i < this.source.length - 1)
        await this.itemCreated.emit(this, { itemIndex: i, itemType: "Separator" });
    }
    await this.itemCreated.emit(this, { itemIndex: this.source.length, itemType: "Footer" });
    await this.dataBound.emit(this, { itemCount: this.source.length });
    if (this.currentIndex >= this.source.length) this.currentIndex = -1;
    await this.stateChanged.emit(this, { reason: "dataBind" });
  }

  async setCurrentItemIndex(index: number): Promise<void> {
    if (index < -1 || index >= this.source.length)
      throw new RangeError(`Repeater item ${index} does not exist.`);
    this.currentIndex = index;
    await this.currentItemIndexChanged.emit(this, {
      itemIndex: index,
      itemType: index < 0 ? "Item" : index % 2 === 0 ? "Item" : "AlternatingItem",
      ...(index < 0 ? {} : { dataItem: this.source[index] })
    });
    await this.stateChanged.emit(this, { reason: "setCurrentItemIndex" });
  }

  async beginResetItemTemplate(): Promise<void> {
    this.resetDepth++;
    await this.stateChanged.emit(this, { reason: "beginResetItemTemplate" });
  }
  async endResetItemTemplate(): Promise<void> {
    if (this.resetDepth > 0) this.resetDepth--;
    await this.stateChanged.emit(this, { reason: "endResetItemTemplate" });
  }

  async addItem(item: T): Promise<void> {
    if (blockUnlicensed("data.repeater", "adding")) return;
    this.source.push(item);
    await this.onItemValuePushed.emit(this, {
      itemIndex: this.source.length - 1,
      itemType: "Item",
      dataItem: item,
      ...(this.options.dataMember === undefined
        ? {}
        : { dataMember: this.options.dataMember }),
      value: item
    });
    await this.stateChanged.emit(this, { reason: "addItem" });
  }

  async deleteItem(index: number): Promise<void> {
    if (blockUnlicensed("data.repeater", "deleting")) return;
    const item = this.source[index];
    if (!item) throw new RangeError(`Repeater item ${index} does not exist.`);
    this.source.splice(index, 1);
    if (this.currentIndex === index) this.currentIndex = -1;
    else if (this.currentIndex > index) this.currentIndex--;
    await this.stateChanged.emit(this, { reason: "deleteItem" });
  }

  async beginEdit(index: number): Promise<boolean> {
    if (blockUnlicensed("data.repeater", "editing")) return false;
    const dataItem = this.source[index];
    if (!dataItem) throw new RangeError(`Repeater item ${index} does not exist.`);
    const args = {
      itemIndex: index,
      itemType: index % 2 === 0 ? ("Item" as const) : ("AlternatingItem" as const),
      dataItem,
      cancel: false
    };
    await this.itemEditing.emit(this, args);
    if (args.cancel) return false;
    this.editIndex = index;
    await this.stateChanged.emit(this, { reason: "beginEdit" });
    return true;
  }

  async updateItem(index: number, values: Partial<T>): Promise<boolean> {
    if (blockUnlicensed("data.repeater", "updating")) return false;
    const dataItem = this.source[index];
    if (!dataItem) throw new RangeError(`Repeater item ${index} does not exist.`);
    const args = {
      itemIndex: index,
      itemType: index % 2 === 0 ? ("Item" as const) : ("AlternatingItem" as const),
      dataItem,
      values,
      cancel: false
    };
    await this.itemUpdating.emit(this, args);
    if (args.cancel) return false;
    Object.assign(dataItem, values);
    this.editIndex = -1;
    await this.itemUpdated.emit(this, {
      itemIndex: index,
      itemType: args.itemType,
      dataItem
    });
    await this.stateChanged.emit(this, { reason: "updateItem" });
    return true;
  }

  async cancelEdit(): Promise<boolean> {
    if (this.editIndex < 0) return false;
    const index = this.editIndex;
    const dataItem = this.source[index];
    if (!dataItem) {
      this.editIndex = -1;
      return false;
    }
    const args = {
      itemIndex: index,
      itemType: index % 2 === 0 ? ("Item" as const) : ("AlternatingItem" as const),
      dataItem,
      cancel: false
    };
    await this.itemCancelingEdit.emit(this, args);
    if (args.cancel) return false;
    this.editIndex = -1;
    await this.stateChanged.emit(this, { reason: "cancelEdit" });
    return true;
  }

  async executeCommand(
    itemIndex: number,
    commandName: string,
    commandArgument?: unknown
  ): Promise<void> {
    const dataItem = this.source[itemIndex];
    if (!dataItem) throw new RangeError(`Repeater item ${itemIndex} does not exist.`);
    await this.itemCommand.emit(this, {
      itemIndex,
      itemType: itemIndex % 2 === 0 ? "Item" : "AlternatingItem",
      dataItem,
      commandName,
      ...(commandArgument === undefined ? {} : { commandArgument })
    });
    switch (commandName.toLowerCase()) {
      case "select":
        await this.setCurrentItemIndex(itemIndex);
        break;
      case "edit":
        await this.beginEdit(itemIndex);
        break;
      case "cancel":
        await this.cancelEdit();
        break;
    }
  }
}
