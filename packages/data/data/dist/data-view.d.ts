import { DataRow, type DataRowState } from "./data-row.js";
import { DataTable } from "./data-table.js";
export declare class DataView {
    readonly table: DataTable;
    rowFilter: string | ((row: DataRow) => boolean) | null;
    sort: string | null;
    rowStateFilter: DataRowState[];
    constructor(table: DataTable);
    get count(): number;
    toRows(): DataRow[];
    toObjects(): Record<string, unknown>[];
    get(index: number): DataRow | undefined;
    find(keyOrValues: unknown | unknown[]): number;
    findRows(keyOrValues: unknown | unknown[]): DataRow[];
    toTable(tableName?: string, distinct?: boolean, columnNames?: string[]): DataTable;
    [Symbol.iterator](): Iterator<DataRow>;
    private getSortColumns;
    private sortTableRows;
}
