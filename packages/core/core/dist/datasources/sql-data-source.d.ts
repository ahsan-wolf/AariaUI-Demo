import { DataSourceControl, DataSourceSelectArguments } from "./data-source.js";
import { Parameter, ParameterCollection } from "./parameter.js";
export type SqlCommandOperation = "select" | "insert" | "update" | "delete";
export type SqlCommandHandler = (command: string, parameters: Record<string, unknown>, operation: SqlCommandOperation, selectArgs?: DataSourceSelectArguments | undefined) => Promise<unknown>;
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
export declare class SqlDataSource extends DataSourceControl {
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
    constructor(options: SqlDataSourceOptions);
    select(selectArgs?: DataSourceSelectArguments): Promise<unknown>;
    insert(values: Record<string, unknown>): Promise<number>;
    update(keys: Record<string, unknown>, values: Record<string, unknown>, oldValues?: Record<string, unknown> | undefined): Promise<number>;
    delete(keys: Record<string, unknown>, oldValues?: Record<string, unknown> | undefined): Promise<number>;
    private execute;
    private defaultRestHandler;
}
