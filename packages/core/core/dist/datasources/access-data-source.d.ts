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
export declare class AccessDataSource extends DataSourceControl {
    dataFilePath?: string | undefined;
    table: DataTable;
    filterExpression?: string | undefined;
    sortExpression?: string | undefined;
    constructor(options: AccessDataSourceOptions);
    select(selectArgs?: DataSourceSelectArguments): Promise<unknown[]>;
    insert(values: Record<string, unknown>): Promise<number>;
    update(keys: Record<string, unknown>, values: Record<string, unknown>, oldValues?: Record<string, unknown> | undefined): Promise<number>;
    delete(keys: Record<string, unknown>, oldValues?: Record<string, unknown> | undefined): Promise<number>;
}
