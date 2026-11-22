import type { DataTable } from "./data-table.js";
export type DataRowState = "Detached" | "Unchanged" | "Added" | "Deleted" | "Modified";
export type DataRowVersion = "Original" | "Current" | "Proposed" | "Default";
export declare class DataRow {
    readonly table: DataTable;
    rowState: DataRowState;
    private readonly originalValues;
    private readonly currentValues;
    private proposedValues;
    private inEditMode;
    constructor(table: DataTable);
    private initializeDefaults;
    hasVersion(version: DataRowVersion): boolean;
    item(columnNameOrIndex: string | number, version?: DataRowVersion): unknown;
    setItem(columnNameOrIndex: string | number, value: unknown): void;
    getValue<V = unknown>(columnName: string): V;
    setValue(columnName: string, value: unknown): void;
    beginEdit(): void;
    endEdit(): void;
    cancelEdit(): void;
    delete(): void;
    acceptChanges(): void;
    rejectChanges(): void;
    toObject(): Record<string, unknown>;
    setValues(values: Record<string, unknown>): void;
    private resolveColumn;
}
export declare class DataRowCollection {
    private readonly items;
    private readonly table;
    constructor(table: DataTable);
    get count(): number;
    get totalCount(): number;
    add(rowOrValues?: DataRow | Record<string, unknown>): DataRow;
    insertAt(row: DataRow, index: number): void;
    remove(row: DataRow): boolean;
    removeAt(index: number): boolean;
    get(index: number): DataRow | undefined;
    getRaw(index: number): DataRow | undefined;
    indexOf(row: DataRow): number;
    clear(): void;
    toArray(includeDeleted?: boolean): readonly DataRow[];
    [Symbol.iterator](): Iterator<DataRow>;
}
