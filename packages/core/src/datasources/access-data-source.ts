import { DataTable } from "@wf-controls/data";
import { DataSourceControl, DataSourceSelectArguments } from "./data-source.js";

export interface AccessDataSourceOptions {
  id: string;
  dataFilePath?: string | undefined;
  table?: DataTable | undefined;
  initialData?: Record<string, unknown>[] | undefined;
  filterExpression?: string | undefined;
  sortExpression?: string | undefined;
}

export class AccessDataSource extends DataSourceControl {
  dataFilePath?: string | undefined;
  table: DataTable;
  filterExpression?: string | undefined;
  sortExpression?: string | undefined;

  constructor(options: AccessDataSourceOptions) {
    super(options.id);
    this.dataFilePath = options.dataFilePath;
    this.filterExpression = options.filterExpression;
    this.sortExpression = options.sortExpression;

    if (options.table) {
      this.table = options.table;
    } else {
      this.table = new DataTable(options.id);
      if (options.initialData && options.initialData.length > 0) {
        const first = options.initialData[0];
        if (first) {
          for (const [colName, val] of Object.entries(first)) {
            const type =
              typeof val === "number"
                ? "number"
                : typeof val === "boolean"
                ? "boolean"
                : "string";
            this.table.columns.add(colName, type);
          }
          for (const row of options.initialData) {
            this.table.rows.add(row);
          }
          this.table.acceptChanges();
        }
      }
    }
  }

  override async select(selectArgs: DataSourceSelectArguments = {}): Promise<unknown[]> {
    const sort = selectArgs.sortExpression ?? this.sortExpression;

    const selectingArgs = {
      arguments: selectArgs,
      parameters: {},
      cancel: false
    };

    await this.selecting.emit(this, selectingArgs);
    if (selectingArgs.cancel) {
      return [];
    }

    const rows = this.table.select(this.filterExpression, sort);
    let items = rows.map((r) => r.toObject());

    const totalRowCount = items.length;

    if (selectArgs.startRowIndex !== undefined || selectArgs.maximumRows !== undefined) {
      const start = selectArgs.startRowIndex ?? 0;
      const count = selectArgs.maximumRows ?? items.length;
      items = items.slice(start, start + count);
    }

    await this.selected.emit(this, { data: items, totalRowCount });
    return items;
  }

  override async insert(values: Record<string, unknown>): Promise<number> {
    const insertingArgs = {
      values,
      cancel: false
    };

    await this.inserting.emit(this, insertingArgs);
    if (insertingArgs.cancel) {
      return 0;
    }

    this.table.rows.add(values);
    this.table.acceptChanges();

    await this.inserted.emit(this, {
      affectedRows: 1,
      returnValue: values,
      exceptionHandled: false
    });

    return 1;
  }

  override async update(
    keys: Record<string, unknown>,
    values: Record<string, unknown>,
    oldValues?: Record<string, unknown> | undefined
  ): Promise<number> {
    const updatingArgs = {
      keys,
      values,
      oldValues,
      cancel: false
    };

    await this.updating.emit(this, updatingArgs);
    if (updatingArgs.cancel) {
      return 0;
    }

    let updatedCount = 0;
    for (const row of this.table.rows) {
      let match = true;
      for (const [k, v] of Object.entries(keys)) {
        if (row.item(k) !== v) {
          match = false;
          break;
        }
      }
      if (match) {
        row.beginEdit();
        for (const [k, v] of Object.entries(values)) {
          row.setItem(k, v);
        }
        row.endEdit();
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      this.table.acceptChanges();
    }

    await this.updated.emit(this, {
      affectedRows: updatedCount,
      exceptionHandled: false
    });

    return updatedCount;
  }

  override async delete(
    keys: Record<string, unknown>,
    oldValues?: Record<string, unknown> | undefined
  ): Promise<number> {
    const deletingArgs = {
      keys,
      oldValues,
      cancel: false
    };

    await this.deleting.emit(this, deletingArgs);
    if (deletingArgs.cancel) {
      return 0;
    }

    let deletedCount = 0;
    for (const row of this.table.rows) {
      let match = true;
      for (const [k, v] of Object.entries(keys)) {
        if (row.item(k) !== v) {
          match = false;
          break;
        }
      }
      if (match) {
        row.delete();
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.table.acceptChanges();
    }

    await this.deleted.emit(this, {
      affectedRows: deletedCount,
      exceptionHandled: false
    });

    return deletedCount;
  }
}

