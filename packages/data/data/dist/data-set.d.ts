import { DataRow } from "./data-row.js";
import { DataTable } from "./data-table.js";
export declare class DataRelation {
    readonly relationName: string;
    readonly parentTable: DataTable;
    readonly childTable: DataTable;
    readonly parentColumnNames: string[];
    readonly childColumnNames: string[];
    constructor(relationName: string, parentTable: DataTable, childTable: DataTable, parentColumns: string[] | string, childColumns: string[] | string);
    getChildRows(parentRow: DataRow): DataRow[];
    getParentRow(childRow: DataRow): DataRow | undefined;
}
export declare class DataTableCollection {
    private readonly items;
    private readonly nameIndex;
    get count(): number;
    add(tableOrName: DataTable | string): DataTable;
    get(nameOrIndex: string | number): DataTable | undefined;
    indexOf(tableOrName: DataTable | string): number;
    contains(name: string): boolean;
    remove(tableOrName: DataTable | string): boolean;
    removeAt(index: number): boolean;
    clear(): void;
    toArray(): readonly DataTable[];
    [Symbol.iterator](): Iterator<DataTable>;
    private rebuildIndex;
}
export declare class DataSet {
    dataSetName: string;
    readonly tables: DataTableCollection;
    readonly relations: DataRelation[];
    constructor(dataSetName?: string);
    acceptChanges(): void;
    rejectChanges(): void;
    clear(): void;
    clone(): DataSet;
    copy(): DataSet;
    toJson(): string;
    static fromJson(jsonStr: string): DataSet;
    toXml(): string;
    static fromXml(xmlStr: string, dataSetName?: string): DataSet;
}
