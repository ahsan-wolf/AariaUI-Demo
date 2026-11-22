import { DataSourceControl, DataSourceSelectArguments } from "./data-source.js";
import { Parameter, ParameterCollection } from "./parameter.js";

export type SqlCommandOperation = "select" | "insert" | "update" | "delete";

export type SqlCommandHandler = (
  command: string,
  parameters: Record<string, unknown>,
  operation: SqlCommandOperation,
  selectArgs?: DataSourceSelectArguments | undefined
) => Promise<unknown>;

export interface SqlDataSourceOptions {
  id: string;
  connectionString?: string | undefined;
  selectCommand?: string | undefined;
  insertCommand?: string | undefined;
  updateCommand?: string | undefined;
  deleteCommand?: string | undefined;
  selectCommandType?: ("Text" | "StoredProcedure") | undefined;
  selectParameters?: Parameter[] | ParameterCollection | undefined;
  insertParameters?: Parameter[] | ParameterCollection | undefined;
  updateParameters?: Parameter[] | ParameterCollection | undefined;
  deleteParameters?: Parameter[] | ParameterCollection | undefined;
  handler?: SqlCommandHandler | undefined;
}

export class SqlDataSource extends DataSourceControl {
  connectionString?: string | undefined;
  selectCommand?: string | undefined;
  insertCommand?: string | undefined;
  updateCommand?: string | undefined;
  deleteCommand?: string | undefined;
  selectCommandType: "Text" | "StoredProcedure";

  readonly selectParameters: ParameterCollection;
  readonly insertParameters: ParameterCollection;
  readonly updateParameters: ParameterCollection;
  readonly deleteParameters: ParameterCollection;

  handler?: SqlCommandHandler | undefined;

  constructor(options: SqlDataSourceOptions) {
    super(options.id);
    this.connectionString = options.connectionString;
    this.selectCommand = options.selectCommand;
    this.insertCommand = options.insertCommand;
    this.updateCommand = options.updateCommand;
    this.deleteCommand = options.deleteCommand;
    this.selectCommandType = options.selectCommandType ?? "Text";

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

    this.handler = options.handler;
  }

  override async select(selectArgs: DataSourceSelectArguments = {}): Promise<unknown> {
    if (!this.selectCommand) {
      throw new Error(`SqlDataSource '${this.id}' has no selectCommand configured.`);
    }

    const parameters = this.evaluateParameters(this.selectParameters);
    if (selectArgs.startRowIndex !== undefined && parameters["startRowIndex"] === undefined) {
      parameters["startRowIndex"] = selectArgs.startRowIndex;
    }
    if (selectArgs.maximumRows !== undefined && parameters["maximumRows"] === undefined) {
      parameters["maximumRows"] = selectArgs.maximumRows;
    }
    if (selectArgs.sortExpression !== undefined && parameters["sortExpression"] === undefined) {
      parameters["sortExpression"] = selectArgs.sortExpression;
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

    const data = await this.execute(
      this.selectCommand,
      selectingArgs.parameters,
      "select",
      selectArgs
    );

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
    if (!this.insertCommand) {
      throw new Error(`SqlDataSource '${this.id}' has no insertCommand configured.`);
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
      returnValue = await this.execute(this.insertCommand, insertingArgs.values, "insert");
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
    if (!this.updateCommand) {
      throw new Error(`SqlDataSource '${this.id}' has no updateCommand configured.`);
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
      returnValue = await this.execute(this.updateCommand, updatingArgs.values, "update");
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
    if (!this.deleteCommand) {
      throw new Error(`SqlDataSource '${this.id}' has no deleteCommand configured.`);
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
      returnValue = await this.execute(this.deleteCommand, parameters, "delete");
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

  private async execute(
    command: string,
    parameters: Record<string, unknown>,
    operation: SqlCommandOperation,
    selectArgs?: DataSourceSelectArguments | undefined
  ): Promise<unknown> {
    if (this.handler) {
      return this.handler(command, parameters, operation, selectArgs);
    }

    return this.defaultRestHandler(command, parameters, operation);
  }

  private async defaultRestHandler(
    command: string,
    parameters: Record<string, unknown>,
    operation: SqlCommandOperation
  ): Promise<unknown> {
    let method = "GET";
    let url = command.trim();

    const parts = url.match(/^([A-Z]+)\s+(.+)$/i);
    if (parts && parts[1] && parts[2]) {
      method = parts[1].toUpperCase();
      url = parts[2];
    } else {
      switch (operation) {
        case "insert":
          method = "POST";
          break;
        case "update":
          method = "PUT";
          break;
        case "delete":
          method = "DELETE";
          break;
        case "select":
          method = "GET";
          break;
      }
    }

    const usedParams = new Set<string>();
    url = url.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, token) => {
      if (token in parameters) {
        usedParams.add(token);
        return encodeURIComponent(String(parameters[token]));
      }
      return "";
    });

    if (this.connectionString) {
      const base = this.connectionString.endsWith("/")
        ? this.connectionString.slice(0, -1)
        : this.connectionString;
      const path = url.startsWith("/") ? url : `/${url}`;
      url = `${base}${path}`;
    }

    const headers: Record<string, string> = {
      Accept: "application/json"
    };

    let body: string | undefined;

    if (method === "GET") {
      const remainingKeys = Object.keys(parameters).filter((k) => !usedParams.has(k));
      if (remainingKeys.length > 0) {
        const queryParams = new URLSearchParams();
        for (const k of remainingKeys) {
          const v = parameters[k];
          if (v !== undefined && v !== null) {
            queryParams.append(k, String(v));
          }
        }
        const qs = queryParams.toString();
        if (qs) {
          url += (url.includes("?") ? "&" : "?") + qs;
        }
      }
    } else {
      headers["Content-Type"] = "application/json";
      const bodyObj: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(parameters)) {
        if (!usedParams.has(k)) {
          bodyObj[k] = v;
        }
      }
      body = JSON.stringify(bodyObj);
    }

    if (typeof fetch === "function") {
      const init: RequestInit = {
        method,
        headers
      };
      if (body !== undefined) {
        init.body = body;
      }
      const response = await fetch(url, init);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      if (response.status === 204) return 1;
      const text = await response.text();
      return text ? JSON.parse(text) : 1;
    }

    throw new Error("No fetch implementation or SqlCommandHandler provided for SqlDataSource.");
  }
}

