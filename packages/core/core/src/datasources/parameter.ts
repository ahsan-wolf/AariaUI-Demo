export type ParameterType =
  | "String"
  | "Int32"
  | "Decimal"
  | "Double"
  | "Boolean"
  | "DateTime"
  | "Object";

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

export class Parameter {
  readonly name: string;
  readonly type: ParameterType;
  readonly defaultValue?: unknown;
  readonly direction: ParameterDirection;
  readonly size?: number | undefined;
  private _value?: unknown;

  constructor(options: ParameterOptions | string, defaultValue?: unknown) {
    if (typeof options === "string") {
      this.name = options;
      this.type = "String";
      this.defaultValue = defaultValue;
      this.direction = "Input";
    } else {
      this.name = options.name;
      this.type = options.type ?? "String";
      this.defaultValue = options.defaultValue;
      this.direction = options.direction ?? "Input";
      this.size = options.size;
    }
  }

  get value(): unknown {
    return this._value;
  }

  set value(val: unknown) {
    this._value = val;
  }

  getValue(context?: ParameterContext | undefined): unknown {
    const raw = this._value !== undefined ? this._value : this.defaultValue;
    return this.coerceValue(raw);
  }

  protected coerceValue(val: unknown): unknown {
    if (val === undefined || val === null) return val;
    switch (this.type) {
      case "Int32": {
        const parsed = parseInt(String(val), 10);
        return isNaN(parsed) ? val : parsed;
      }
      case "Decimal":
      case "Double": {
        const parsed = parseFloat(String(val));
        return isNaN(parsed) ? val : parsed;
      }
      case "Boolean": {
        if (typeof val === "boolean") return val;
        const str = String(val).trim().toLowerCase();
        return str === "true" || str === "1" || str === "yes";
      }
      case "DateTime": {
        if (val instanceof Date) return val;
        const d = new Date(String(val));
        return isNaN(d.getTime()) ? val : d;
      }
      case "String":
        return String(val);
      case "Object":
      default:
        return val;
    }
  }
}

export interface ControlParameterOptions extends ParameterOptions {
  controlId: string;
  propertyName?: string | undefined;
}

export class ControlParameter extends Parameter {
  readonly controlId: string;
  readonly propertyName: string;

  constructor(options: ControlParameterOptions) {
    super(options);
    this.controlId = options.controlId;
    this.propertyName = options.propertyName ?? "value";
  }

  override getValue(context?: ParameterContext | undefined): unknown {
    if (this.value !== undefined) {
      return this.coerceValue(this.value);
    }
    if (context?.controls) {
      const ctrl = context.controls[this.controlId];
      if (ctrl !== undefined) {
        if (typeof ctrl === "function") {
          return this.coerceValue(ctrl());
        }
        if (typeof ctrl === "object" && ctrl !== null && this.propertyName in ctrl) {
          const val = (ctrl as Record<string, unknown>)[this.propertyName];
          return this.coerceValue(typeof val === "function" ? val() : val);
        }
        return this.coerceValue(ctrl);
      }
    }
    return this.coerceValue(this.defaultValue);
  }
}

export interface QueryStringParameterOptions extends ParameterOptions {
  queryStringField: string;
}

export class QueryStringParameter extends Parameter {
  readonly queryStringField: string;

  constructor(options: QueryStringParameterOptions) {
    super(options);
    this.queryStringField = options.queryStringField;
  }

  override getValue(context?: ParameterContext | undefined): unknown {
    if (this.value !== undefined) {
      return this.coerceValue(this.value);
    }

    let searchParams: URLSearchParams | undefined;
    if (context?.queryString) {
      if (context.queryString instanceof URLSearchParams) {
        searchParams = context.queryString;
      } else if (typeof context.queryString === "string") {
        const query = context.queryString.startsWith("?")
          ? context.queryString.slice(1)
          : context.queryString;
        searchParams = new URLSearchParams(query);
      } else if (typeof context.queryString === "object") {
        const val = (context.queryString as Record<string, string>)[this.queryStringField];
        if (val !== undefined) return this.coerceValue(val);
      }
    } else if (typeof window !== "undefined" && window.location?.search) {
      searchParams = new URLSearchParams(window.location.search);
    }

    if (searchParams) {
      const val = searchParams.get(this.queryStringField);
      if (val !== null) return this.coerceValue(val);
    }

    return this.coerceValue(this.defaultValue);
  }
}

export interface SessionParameterOptions extends ParameterOptions {
  sessionField: string;
}

export class SessionParameter extends Parameter {
  readonly sessionField: string;

  constructor(options: SessionParameterOptions) {
    super(options);
    this.sessionField = options.sessionField;
  }

  override getValue(context?: ParameterContext | undefined): unknown {
    if (this.value !== undefined) {
      return this.coerceValue(this.value);
    }

    if (context?.session) {
      const session = context.session;
      if (typeof (session as Storage).getItem === "function") {
        const val = (session as Storage).getItem(this.sessionField);
        if (val !== null) return this.coerceValue(val);
      } else if (typeof session === "object" && this.sessionField in session) {
        return this.coerceValue((session as Record<string, unknown>)[this.sessionField]);
      }
    } else if (typeof sessionStorage !== "undefined") {
      const val = sessionStorage.getItem(this.sessionField);
      if (val !== null) return this.coerceValue(val);
    }

    return this.coerceValue(this.defaultValue);
  }
}

export interface FormParameterOptions extends ParameterOptions {
  formField: string;
}

export class FormParameter extends Parameter {
  readonly formField: string;

  constructor(options: FormParameterOptions) {
    super(options);
    this.formField = options.formField;
  }

  override getValue(context?: ParameterContext | undefined): unknown {
    if (this.value !== undefined) {
      return this.coerceValue(this.value);
    }

    if (context?.form) {
      const form = context.form;
      if (typeof (form as FormData).get === "function") {
        const val = (form as FormData).get(this.formField);
        if (val !== null) return this.coerceValue(val);
      } else if (typeof form === "object" && this.formField in form) {
        return this.coerceValue((form as Record<string, unknown>)[this.formField]);
      }
    }

    return this.coerceValue(this.defaultValue);
  }
}

export class ParameterCollection implements Iterable<Parameter> {
  private readonly _params = new Map<string, Parameter>();

  constructor(parameters?: Parameter[] | undefined) {
    if (parameters) {
      for (const p of parameters) {
        this.add(p);
      }
    }
  }

  get count(): number {
    return this._params.size;
  }

  add(parameter: Parameter): Parameter;
  add(name: string, value: unknown): Parameter;
  add(nameOrParam: string | Parameter, value?: unknown): Parameter {
    const param = typeof nameOrParam === "string"
      ? new Parameter(nameOrParam, value)
      : nameOrParam;
    if (value !== undefined && typeof nameOrParam === "string") {
      param.value = value;
    }
    this._params.set(param.name, param);
    return param;
  }

  get(name: string): Parameter | undefined {
    return this._params.get(name);
  }

  has(name: string): boolean {
    return this._params.has(name);
  }

  remove(name: string): boolean {
    return this._params.delete(name);
  }

  clear(): void {
    this._params.clear();
  }

  evaluate(context?: ParameterContext | undefined): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [name, param] of this._params) {
      result[name] = param.getValue(context);
    }
    return result;
  }

  toArray(): Parameter[] {
    return Array.from(this._params.values());
  }

  [Symbol.iterator](): Iterator<Parameter> {
    return this._params.values()[Symbol.iterator]();
  }
}

