import { DataSourceControl, DataSourceSelectArguments } from "@wf-controls/core";
import { Parameter, ParameterCollection } from "@wf-controls/core";
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
export declare class ObjectDataSource extends DataSourceControl {
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
    constructor(options: ObjectDataSourceOptions);
    private getInstance;
    select(selectArgs?: DataSourceSelectArguments): Promise<unknown>;
    insert(values: Record<string, unknown>): Promise<number>;
    update(keys: Record<string, unknown>, values: Record<string, unknown>, oldValues?: Record<string, unknown> | undefined): Promise<number>;
    delete(keys: Record<string, unknown>, oldValues?: Record<string, unknown> | undefined): Promise<number>;
}
