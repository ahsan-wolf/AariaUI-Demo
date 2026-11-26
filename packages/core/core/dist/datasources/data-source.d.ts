import { CancelEventArgs, EventDispatcher } from "../events.js";
import { ParameterCollection, ParameterContext } from "./parameter.js";
export interface DataSourceSelectArguments {
    startRowIndex?: number | undefined;
    maximumRows?: number | undefined;
    sortExpression?: string | undefined;
    retrieveTotalRowCount?: boolean | undefined;
    totalRowCount?: number | undefined;
}
export interface DataSourceSelectingEventArgs extends CancelEventArgs {
    arguments: DataSourceSelectArguments;
    parameters: Record<string, unknown>;
}
export interface DataSourceSelectedEventArgs {
    data: unknown;
    totalRowCount?: number | undefined;
}
export interface DataSourceInsertingEventArgs extends CancelEventArgs {
    values: Record<string, unknown>;
}
export interface DataSourceInsertedEventArgs {
    affectedRows: number;
    returnValue?: unknown;
    exception?: Error | undefined;
    exceptionHandled: boolean;
}
export interface DataSourceUpdatingEventArgs extends CancelEventArgs {
    keys: Record<string, unknown>;
    values: Record<string, unknown>;
    oldValues?: Record<string, unknown> | undefined;
}
export interface DataSourceUpdatedEventArgs {
    affectedRows: number;
    returnValue?: unknown;
    exception?: Error | undefined;
    exceptionHandled: boolean;
}
export interface DataSourceDeletingEventArgs extends CancelEventArgs {
    keys: Record<string, unknown>;
    oldValues?: Record<string, unknown> | undefined;
}
export interface DataSourceDeletedEventArgs {
    affectedRows: number;
    returnValue?: unknown;
    exception?: Error | undefined;
    exceptionHandled: boolean;
}
export interface IDataSourceControl {
    readonly id: string;
    readonly selecting: EventDispatcher<this, DataSourceSelectingEventArgs>;
    readonly selected: EventDispatcher<this, DataSourceSelectedEventArgs>;
    readonly inserting: EventDispatcher<this, DataSourceInsertingEventArgs>;
    readonly inserted: EventDispatcher<this, DataSourceInsertedEventArgs>;
    readonly updating: EventDispatcher<this, DataSourceUpdatingEventArgs>;
    readonly updated: EventDispatcher<this, DataSourceUpdatedEventArgs>;
    readonly deleting: EventDispatcher<this, DataSourceDeletingEventArgs>;
    readonly deleted: EventDispatcher<this, DataSourceDeletedEventArgs>;
    select(selectArgs?: DataSourceSelectArguments | undefined): Promise<unknown>;
    insert(values: Record<string, unknown>): Promise<number>;
    update(keys: Record<string, unknown>, values: Record<string, unknown>, oldValues?: Record<string, unknown> | undefined): Promise<number>;
    delete(keys: Record<string, unknown>, oldValues?: Record<string, unknown> | undefined): Promise<number>;
}
export declare abstract class DataSourceControl implements IDataSourceControl {
    readonly id: string;
    parameterContext?: ParameterContext | undefined;
    readonly selecting: EventDispatcher<this, DataSourceSelectingEventArgs>;
    readonly selected: EventDispatcher<this, DataSourceSelectedEventArgs>;
    readonly inserting: EventDispatcher<this, DataSourceInsertingEventArgs>;
    readonly inserted: EventDispatcher<this, DataSourceInsertedEventArgs>;
    readonly updating: EventDispatcher<this, DataSourceUpdatingEventArgs>;
    readonly updated: EventDispatcher<this, DataSourceUpdatedEventArgs>;
    readonly deleting: EventDispatcher<this, DataSourceDeletingEventArgs>;
    readonly deleted: EventDispatcher<this, DataSourceDeletedEventArgs>;
    constructor(id: string);
    abstract select(selectArgs?: DataSourceSelectArguments | undefined): Promise<unknown>;
    abstract insert(values: Record<string, unknown>): Promise<number>;
    abstract update(keys: Record<string, unknown>, values: Record<string, unknown>, oldValues?: Record<string, unknown> | undefined): Promise<number>;
    abstract delete(keys: Record<string, unknown>, oldValues?: Record<string, unknown> | undefined): Promise<number>;
    protected evaluateParameters(params: ParameterCollection): Record<string, unknown>;
}
