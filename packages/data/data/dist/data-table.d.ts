import { DataColumn, DataColumnCollection } from "./data-column.js";
import { DataRow, DataRowCollection } from "./data-row.js";
export declare class DataTable {
    tableName: string;
    readonly columns: DataColumnCollection;
    readonly rows: DataRowCollection;
    primaryKey: DataColumn[];
    constructor(tableName?: string);
    newRow(): DataRow;
    newRowFrom(values: Record<string, unknown>): DataRow;
    acceptChanges(): void;
    rejectChanges(): void;
    clear(): void;
    clone(): DataTable;
    copy(): DataTable;
    find(primaryKeyValues: unknown | unknown[]): DataRow | undefined;
    select(filter?: string | ((row: DataRow) => boolean), sort?: string): DataRow[];
    toObjects(): Record<string, unknown>[];
    static fromObjects(tableName: string, data: readonly Record<string, unknown>[]): DataTable;
    private compileFilterExpression;
    private sortRows;
}
