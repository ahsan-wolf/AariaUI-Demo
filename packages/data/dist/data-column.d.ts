export type DataColumnDataType = "string" | "number" | "boolean" | "date" | "object";
export interface DataColumnOptions {
    columnName: string;
    dataType?: DataColumnDataType;
    allowDBNull?: boolean;
    defaultValue?: unknown;
    autoIncrement?: boolean;
    autoIncrementSeed?: number;
    autoIncrementStep?: number;
    readOnly?: boolean;
    maxLength?: number;
    caption?: string;
    unique?: boolean;
}
export declare class DataColumn {
    readonly columnName: string;
    readonly dataType: DataColumnDataType;
    readonly allowDBNull: boolean;
    readonly defaultValue: unknown;
    readonly autoIncrement: boolean;
    readonly autoIncrementSeed: number;
    readonly autoIncrementStep: number;
    readonly readOnly: boolean;
    readonly maxLength: number;
    caption: string;
    unique: boolean;
    private currentAutoIncrementValue;
    constructor(options: DataColumnOptions | string, dataType?: DataColumnDataType);
    getNextAutoIncrementValue(): number;
    resetAutoIncrement(seed?: number): void;
    coerceAndValidate(value: unknown): unknown;
}
export declare class DataColumnCollection {
    private readonly items;
    private readonly nameIndex;
    get count(): number;
    add(columnOrName: DataColumn | string, dataType?: DataColumnDataType): DataColumn;
    get(nameOrIndex: string | number): DataColumn | undefined;
    indexOf(columnOrName: DataColumn | string): number;
    contains(name: string): boolean;
    remove(columnOrName: DataColumn | string): boolean;
    removeAt(index: number): boolean;
    clear(): void;
    toArray(): readonly DataColumn[];
    [Symbol.iterator](): Iterator<DataColumn>;
    private rebuildIndex;
}
