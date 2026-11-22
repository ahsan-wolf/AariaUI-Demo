import { DataSourceControl, DataSourceSelectArguments } from "./data-source.js";
import { Parameter, ParameterCollection } from "./parameter.js";

export type ObjectInstanceResolver = object | (() => object | Promise<object>);

export interface ObjectDataSourceOptions {
  id: string;
  typeName?: string | undefined;
  typeInstance?: ObjectInstanceResolver | undefined;
  selectMethod: string;
  insertMethod?: string | undefined;
  updateMethod?: string | undefined;
  deleteMethod?: string | undefined;
  selectParameters?: Parameter[] | ParameterCollection | undefined;
  insertParameters?: Parameter[] | ParameterCollection | undefined;
  updateParameters?: Parameter[] | ParameterCollection | undefined;
  deleteParameters?: Parameter[] | ParameterCollection | undefined;
  enablePaging?: boolean | undefined;
  startRowIndexParameterName?: string | undefined;
  maximumRowsParameterName?: string | undefined;
  sortParameterName?: string | undefined;
}

export class ObjectDataSource extends DataSourceControl {
  typeName?: string | undefined;
  typeInstance?: ObjectInstanceResolver | undefined;
  selectMethod: string;
  insertMethod?: string | undefined;
  updateMethod?: string | undefined;
  deleteMethod?: string | undefined;

  readonly selectParameters: ParameterCollection;
  readonly insertParameters: ParameterCollection;
  readonly updateParameters: ParameterCollection;
  readonly deleteParameters: ParameterCollection;

  enablePaging: boolean;
  startRowIndexParameterName: string;
  maximumRowsParameterName: string;
  sortParameterName: string;

  constructor(options: ObjectDataSourceOptions) {
    super(options.id);
    this.typeName = options.typeName;
    this.typeInstance = options.typeInstance;
    this.selectMethod = options.selectMethod;
    this.insertMethod = options.insertMethod;
    this.updateMethod = options.updateMethod;
    this.deleteMethod = options.deleteMethod;

    this.selectParameters =
      options.selectParameters instanceof ParameterCollection
        ? options.selectParameters
        : new ParameterCollection(options.selectParameters);

    this.insertParameters =
      options.insertParameters instanceof ParameterCollection
        ? options.insertParameters
        : new ParameterCollection(options.insertParameters);

    this.updateParameters =
      options.updateParameters instanceof ParameterCollection
        ? options.updateParameters
        : new ParameterCollection(options.updateParameters);

    this.deleteParameters =
      options.deleteParameters instanceof ParameterCollection
        ? options.deleteParameters
        : new ParameterCollection(options.deleteParameters);

    this.enablePaging = options.enablePaging ?? false;
    this.startRowIndexParameterName = options.startRowIndexParameterName ?? "startRowIndex";
    this.maximumRowsParameterName = options.maximumRowsParameterName ?? "maximumRows";
    this.sortParameterName = options.sortParameterName ?? "sortExpression";
  }

  private async getInstance(): Promise<Record<string, unknown>> {
    if (!this.typeInstance) {
      throw new Error(`ObjectDataSource '${this.id}' has no typeInstance configured.`);
    }
    const inst =
      typeof this.typeInstance === "function"
        ? await (this.typeInstance as () => Promise<object> | object)()
        : this.typeInstance;
    return inst as Record<string, unknown>;
  }

  override async select(selectArgs: DataSourceSelectArguments = {}): Promise<unknown> {
    const parameters = this.evaluateParameters(this.selectParameters);

    if (this.enablePaging) {
      if (selectArgs.startRowIndex !== undefined) {
        parameters[this.startRowIndexParameterName] = selectArgs.startRowIndex;
      }
      if (selectArgs.maximumRows !== undefined) {
        parameters[this.maximumRowsParameterName] = selectArgs.maximumRows;
      }
    }
    if (selectArgs.sortExpression && this.sortParameterName) {
      parameters[this.sortParameterName] = selectArgs.sortExpression;
    }

    const selectingArgs = {
      arguments: selectArgs,
      parameters,
      cancel: false
    };

    await this.selecting.emit(this, selectingArgs);
    if (selectingArgs.cancel) {
      return [];
    }

    const instance = await this.getInstance();
    const method = instance[this.selectMethod];
    if (typeof method !== "function") {
      throw new Error(
        `Method '${this.selectMethod}' not found on typeInstance for ObjectDataSource '${this.id}'.`
      );
    }

    const data = await method.call(instance, selectingArgs.parameters, selectArgs);

    let totalRowCount: number | undefined;
    if (Array.isArray(data)) {
      totalRowCount = data.length;
    } else if (data && typeof data === "object" && "total" in (data as Record<string, unknown>)) {
      totalRowCount = Number((data as Record<string, unknown>).total);
    }

    await this.selected.emit(this, { data, totalRowCount });
    return data;
  }

  override async insert(values: Record<string, unknown>): Promise<number> {
    if (!this.insertMethod) {
      throw new Error(`ObjectDataSource '${this.id}' has no insertMethod configured.`);
    }

    const parameters = {
      ...this.evaluateParameters(this.insertParameters),
      ...values
    };

    const insertingArgs = {
      values: parameters,
      cancel: false
    };

    await this.inserting.emit(this, insertingArgs);
    if (insertingArgs.cancel) {
      return 0;
    }

    let affectedRows = 0;
    let returnValue: unknown;
    let exception: Error | undefined;

    try {
      const instance = await this.getInstance();
      const method = instance[this.insertMethod];
      if (typeof method !== "function") {
        throw new Error(
          `Method '${this.insertMethod}' not found on typeInstance for ObjectDataSource '${this.id}'.`
        );
      }
      returnValue = await method.call(instance, insertingArgs.values);
      affectedRows = typeof returnValue === "number" ? returnValue : 1;
    } catch (err) {
      exception = err instanceof Error ? err : new Error(String(err));
    }

    const insertedArgs = {
      affectedRows,
      returnValue,
      exception,
      exceptionHandled: false
    };

    await this.inserted.emit(this, insertedArgs);

    if (exception && !insertedArgs.exceptionHandled) {
      throw exception;
    }

    return affectedRows;
  }

  override async update(
    keys: Record<string, unknown>,
    values: Record<string, unknown>,
    oldValues?: Record<string, unknown> | undefined
  ): Promise<number> {
    if (!this.updateMethod) {
      throw new Error(`ObjectDataSource '${this.id}' has no updateMethod configured.`);
    }

    const parameters = {
      ...this.evaluateParameters(this.updateParameters),
      ...oldValues,
      ...keys,
      ...values
    };

    const updatingArgs = {
      keys,
      values: parameters,
      oldValues,
      cancel: false
    };

    await this.updating.emit(this, updatingArgs);
    if (updatingArgs.cancel) {
      return 0;
    }

    let affectedRows = 0;
    let returnValue: unknown;
    let exception: Error | undefined;

    try {
      const instance = await this.getInstance();
      const method = instance[this.updateMethod];
      if (typeof method !== "function") {
        throw new Error(
          `Method '${this.updateMethod}' not found on typeInstance for ObjectDataSource '${this.id}'.`
        );
      }
      returnValue = await method.call(instance, updatingArgs.values, keys, oldValues);
      affectedRows = typeof returnValue === "number" ? returnValue : 1;
    } catch (err) {
      exception = err instanceof Error ? err : new Error(String(err));
    }

    const updatedArgs = {
      affectedRows,
      returnValue,
      exception,
      exceptionHandled: false
    };

    await this.updated.emit(this, updatedArgs);

    if (exception && !updatedArgs.exceptionHandled) {
      throw exception;
    }

    return affectedRows;
  }

  override async delete(
    keys: Record<string, unknown>,
    oldValues?: Record<string, unknown> | undefined
  ): Promise<number> {
    if (!this.deleteMethod) {
      throw new Error(`ObjectDataSource '${this.id}' has no deleteMethod configured.`);
    }

    const parameters = {
      ...this.evaluateParameters(this.deleteParameters),
      ...oldValues,
      ...keys
    };

    const deletingArgs = {
      keys,
      oldValues,
      cancel: false
    };

    await this.deleting.emit(this, deletingArgs);
    if (deletingArgs.cancel) {
      return 0;
    }

    let affectedRows = 0;
    let returnValue: unknown;
    let exception: Error | undefined;

    try {
      const instance = await this.getInstance();
      const method = instance[this.deleteMethod];
      if (typeof method !== "function") {
        throw new Error(
          `Method '${this.deleteMethod}' not found on typeInstance for ObjectDataSource '${this.id}'.`
        );
      }
      returnValue = await method.call(instance, deletingArgs.keys, oldValues);
      affectedRows = typeof returnValue === "number" ? returnValue : 1;
    } catch (err) {
      exception = err instanceof Error ? err : new Error(String(err));
    }

    const deletedArgs = {
      affectedRows,
      returnValue,
      exception,
      exceptionHandled: false
    };

    await this.deleted.emit(this, deletedArgs);

    if (exception && !deletedArgs.exceptionHandled) {
      throw exception;
    }

    return affectedRows;
  }
}

