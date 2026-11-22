export class DataColumn {
    columnName;
    dataType;
    allowDBNull;
    defaultValue;
    autoIncrement;
    autoIncrementSeed;
    autoIncrementStep;
    readOnly;
    maxLength;
    caption;
    unique;
    currentAutoIncrementValue;
    constructor(options, dataType) {
        if (typeof options === "string") {
            this.columnName = options;
            this.dataType = dataType ?? "string";
            this.allowDBNull = true;
            this.defaultValue = null;
            this.autoIncrement = false;
            this.autoIncrementSeed = 1;
            this.autoIncrementStep = 1;
            this.readOnly = false;
            this.maxLength = -1;
            this.caption = options;
            this.unique = false;
        }
        else {
            this.columnName = options.columnName;
            this.dataType = options.dataType ?? "string";
            this.allowDBNull = options.allowDBNull ?? true;
            this.defaultValue = options.defaultValue !== undefined ? options.defaultValue : null;
            this.autoIncrement = options.autoIncrement ?? false;
            this.autoIncrementSeed = options.autoIncrementSeed ?? 1;
            this.autoIncrementStep = options.autoIncrementStep ?? 1;
            this.readOnly = options.readOnly ?? false;
            this.maxLength = options.maxLength ?? -1;
            this.caption = options.caption ?? options.columnName;
            this.unique = options.unique ?? false;
        }
        this.currentAutoIncrementValue = this.autoIncrementSeed;
    }
    getNextAutoIncrementValue() {
        const val = this.currentAutoIncrementValue;
        this.currentAutoIncrementValue += this.autoIncrementStep;
        return val;
    }
    resetAutoIncrement(seed) {
        this.currentAutoIncrementValue = seed ?? this.autoIncrementSeed;
    }
    coerceAndValidate(value) {
        if (value === null || value === undefined) {
            if (!this.allowDBNull && !this.autoIncrement) {
                throw new Error(`Column '${this.columnName}' does not allow null or undefined values.`);
            }
            return null;
        }
        switch (this.dataType) {
            case "string": {
                const str = String(value);
                if (this.maxLength > -1 && str.length > this.maxLength) {
                    throw new Error(`Value for column '${this.columnName}' exceeds maxLength of ${this.maxLength}.`);
                }
                return str;
            }
            case "number": {
                const num = Number(value);
                if (Number.isNaN(num)) {
                    throw new Error(`Value '${String(value)}' cannot be converted to number for column '${this.columnName}'.`);
                }
                return num;
            }
            case "boolean":
                return Boolean(value);
            case "date": {
                const d = value instanceof Date ? value : new Date(String(value));
                if (Number.isNaN(d.getTime())) {
                    throw new Error(`Value '${String(value)}' cannot be converted to Date for column '${this.columnName}'.`);
                }
                return d;
            }
            case "object":
                return value;
            default:
                return value;
        }
    }
}
export class DataColumnCollection {
    items = [];
    nameIndex = new Map();
    get count() {
        return this.items.length;
    }
    add(columnOrName, dataType) {
        const column = typeof columnOrName === "string" ? new DataColumn(columnOrName, dataType) : columnOrName;
        const lower = column.columnName.toLowerCase();
        if (this.nameIndex.has(lower)) {
            throw new Error(`A column with name '${column.columnName}' already exists in this collection.`);
        }
        const idx = this.items.length;
        this.items.push(column);
        this.nameIndex.set(lower, idx);
        return column;
    }
    get(nameOrIndex) {
        if (typeof nameOrIndex === "number") {
            return this.items[nameOrIndex];
        }
        const idx = this.nameIndex.get(nameOrIndex.toLowerCase());
        return idx !== undefined ? this.items[idx] : undefined;
    }
    indexOf(columnOrName) {
        if (typeof columnOrName === "string") {
            const idx = this.nameIndex.get(columnOrName.toLowerCase());
            return idx !== undefined ? idx : -1;
        }
        return this.items.indexOf(columnOrName);
    }
    contains(name) {
        return this.nameIndex.has(name.toLowerCase());
    }
    remove(columnOrName) {
        const idx = this.indexOf(columnOrName);
        if (idx >= 0) {
            this.removeAt(idx);
            return true;
        }
        return false;
    }
    removeAt(index) {
        if (index < 0 || index >= this.items.length) {
            return false;
        }
        this.items.splice(index, 1);
        this.rebuildIndex();
        return true;
    }
    clear() {
        this.items.length = 0;
        this.nameIndex.clear();
    }
    toArray() {
        return [...this.items];
    }
    [Symbol.iterator]() {
        return this.items[Symbol.iterator]();
    }
    rebuildIndex() {
        this.nameIndex.clear();
        for (let i = 0; i < this.items.length; i++) {
            const col = this.items[i];
            if (col) {
                this.nameIndex.set(col.columnName.toLowerCase(), i);
            }
        }
    }
}
//# sourceMappingURL=data-column.js.map