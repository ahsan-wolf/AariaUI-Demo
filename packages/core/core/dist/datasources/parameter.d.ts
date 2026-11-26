export type ParameterType = "String" | "Int32" | "Decimal" | "Double" | "Boolean" | "DateTime" | "Object";
export type ParameterDirection = "Input" | "Output" | "InputOutput" | "ReturnValue";
export interface ParameterContext {
    controls?: Record<string, unknown | (() => unknown)> | undefined;
    queryString?: string | URLSearchParams | Record<string, string> | undefined;
    session?: Record<string, unknown> | Storage | undefined;
    form?: Record<string, unknown> | FormData | undefined;
    [key: string]: unknown;
}
export interface ParameterOptions {
    name: string;
    type?: ParameterType | undefined;
    defaultValue?: unknown;
    direction?: ParameterDirection | undefined;
    size?: number | undefined;
}
export declare class Parameter {
    readonly name: string;
    readonly type: ParameterType;
    readonly defaultValue?: unknown;
    readonly direction: ParameterDirection;
    readonly size?: number | undefined;
    private _value?;
    constructor(options: ParameterOptions | string, defaultValue?: unknown);
    get value(): unknown;
    set value(val: unknown);
    getValue(context?: ParameterContext | undefined): unknown;
    protected coerceValue(val: unknown): unknown;
}
export interface ControlParameterOptions extends ParameterOptions {
    controlId: string;
    propertyName?: string | undefined;
}
export declare class ControlParameter extends Parameter {
    readonly controlId: string;
    readonly propertyName: string;
    constructor(options: ControlParameterOptions);
    getValue(context?: ParameterContext | undefined): unknown;
}
export interface QueryStringParameterOptions extends ParameterOptions {
    queryStringField: string;
}
export declare class QueryStringParameter extends Parameter {
    readonly queryStringField: string;
    constructor(options: QueryStringParameterOptions);
    getValue(context?: ParameterContext | undefined): unknown;
}
export interface SessionParameterOptions extends ParameterOptions {
    sessionField: string;
}
export declare class SessionParameter extends Parameter {
    readonly sessionField: string;
    constructor(options: SessionParameterOptions);
    getValue(context?: ParameterContext | undefined): unknown;
}
export interface FormParameterOptions extends ParameterOptions {
    formField: string;
}
export declare class FormParameter extends Parameter {
    readonly formField: string;
    constructor(options: FormParameterOptions);
    getValue(context?: ParameterContext | undefined): unknown;
}
export declare class ParameterCollection implements Iterable<Parameter> {
    private readonly _params;
    constructor(parameters?: Parameter[] | undefined);
    get count(): number;
    add(parameter: Parameter): Parameter;
    add(name: string, value: unknown): Parameter;
    get(name: string): Parameter | undefined;
    has(name: string): boolean;
    remove(name: string): boolean;
    clear(): void;
    evaluate(context?: ParameterContext | undefined): Record<string, unknown>;
    toArray(): Parameter[];
    [Symbol.iterator](): Iterator<Parameter>;
}
