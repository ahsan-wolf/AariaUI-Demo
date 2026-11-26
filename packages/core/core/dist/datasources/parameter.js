export class Parameter {
    name;
    type;
    defaultValue;
    direction;
    size;
    _value;
    constructor(options, defaultValue) {
        if (typeof options === "string") {
            this.name = options;
            this.type = "String";
            this.defaultValue = defaultValue;
            this.direction = "Input";
        }
        else {
            this.name = options.name;
            this.type = options.type ?? "String";
            this.defaultValue = options.defaultValue;
            this.direction = options.direction ?? "Input";
            this.size = options.size;
        }
    }
    get value() {
        return this._value;
    }
    set value(val) {
        this._value = val;
    }
    getValue(context) {
        const raw = this._value !== undefined ? this._value : this.defaultValue;
        return this.coerceValue(raw);
    }
    coerceValue(val) {
        if (val === undefined || val === null)
            return val;
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
                if (typeof val === "boolean")
                    return val;
                const str = String(val).trim().toLowerCase();
                return str === "true" || str === "1" || str === "yes";
            }
            case "DateTime": {
                if (val instanceof Date)
                    return val;
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
export class ControlParameter extends Parameter {
    controlId;
    propertyName;
    constructor(options) {
        super(options);
        this.controlId = options.controlId;
        this.propertyName = options.propertyName ?? "value";
    }
    getValue(context) {
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
                    const val = ctrl[this.propertyName];
                    return this.coerceValue(typeof val === "function" ? val() : val);
                }
                return this.coerceValue(ctrl);
            }
        }
        return this.coerceValue(this.defaultValue);
    }
}
export class QueryStringParameter extends Parameter {
    queryStringField;
    constructor(options) {
        super(options);
        this.queryStringField = options.queryStringField;
    }
    getValue(context) {
        if (this.value !== undefined) {
            return this.coerceValue(this.value);
        }
        let searchParams;
        if (context?.queryString) {
            if (context.queryString instanceof URLSearchParams) {
                searchParams = context.queryString;
            }
            else if (typeof context.queryString === "string") {
                const query = context.queryString.startsWith("?")
                    ? context.queryString.slice(1)
                    : context.queryString;
                searchParams = new URLSearchParams(query);
            }
            else if (typeof context.queryString === "object") {
                const val = context.queryString[this.queryStringField];
                if (val !== undefined)
                    return this.coerceValue(val);
            }
        }
        else if (typeof window !== "undefined" && window.location?.search) {
            searchParams = new URLSearchParams(window.location.search);
        }
        if (searchParams) {
            const val = searchParams.get(this.queryStringField);
            if (val !== null)
                return this.coerceValue(val);
        }
        return this.coerceValue(this.defaultValue);
    }
}
export class SessionParameter extends Parameter {
    sessionField;
    constructor(options) {
        super(options);
        this.sessionField = options.sessionField;
    }
    getValue(context) {
        if (this.value !== undefined) {
            return this.coerceValue(this.value);
        }
        if (context?.session) {
            const session = context.session;
            if (typeof session.getItem === "function") {
                const val = session.getItem(this.sessionField);
                if (val !== null)
                    return this.coerceValue(val);
            }
            else if (typeof session === "object" && this.sessionField in session) {
                return this.coerceValue(session[this.sessionField]);
            }
        }
        else if (typeof sessionStorage !== "undefined") {
            const val = sessionStorage.getItem(this.sessionField);
            if (val !== null)
                return this.coerceValue(val);
        }
        return this.coerceValue(this.defaultValue);
    }
}
export class FormParameter extends Parameter {
    formField;
    constructor(options) {
        super(options);
        this.formField = options.formField;
    }
    getValue(context) {
        if (this.value !== undefined) {
            return this.coerceValue(this.value);
        }
        if (context?.form) {
            const form = context.form;
            if (typeof form.get === "function") {
                const val = form.get(this.formField);
                if (val !== null)
                    return this.coerceValue(val);
            }
            else if (typeof form === "object" && this.formField in form) {
                return this.coerceValue(form[this.formField]);
            }
        }
        return this.coerceValue(this.defaultValue);
    }
}
export class ParameterCollection {
    _params = new Map();
    constructor(parameters) {
        if (parameters) {
            for (const p of parameters) {
                this.add(p);
            }
        }
    }
    get count() {
        return this._params.size;
    }
    add(nameOrParam, value) {
        const param = typeof nameOrParam === "string"
            ? new Parameter(nameOrParam, value)
            : nameOrParam;
        if (value !== undefined && typeof nameOrParam === "string") {
            param.value = value;
        }
        this._params.set(param.name, param);
        return param;
    }
    get(name) {
        return this._params.get(name);
    }
    has(name) {
        return this._params.has(name);
    }
    remove(name) {
        return this._params.delete(name);
    }
    clear() {
        this._params.clear();
    }
    evaluate(context) {
        const result = {};
        for (const [name, param] of this._params) {
            result[name] = param.getValue(context);
        }
        return result;
    }
    toArray() {
        return Array.from(this._params.values());
    }
    [Symbol.iterator]() {
        return this._params.values()[Symbol.iterator]();
    }
}
//# sourceMappingURL=parameter.js.map