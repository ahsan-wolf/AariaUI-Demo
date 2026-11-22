export class DataRow {
    table;
    rowState = "Detached";
    originalValues = new Map();
    currentValues = new Map();
    proposedValues = null;
    inEditMode = false;
    constructor(table) {
        this.table = table;
        this.initializeDefaults();
    }
    initializeDefaults() {
        for (const column of this.table.columns) {
            const key = column.columnName.toLowerCase();
            let initialVal = column.defaultValue;
            if (column.autoIncrement) {
                initialVal = column.getNextAutoIncrementValue();
            }
            this.currentValues.set(key, initialVal);
        }
    }
    hasVersion(version) {
        switch (version) {
            case "Original":
                return this.rowState !== "Added" && this.rowState !== "Detached" && this.originalValues.size > 0;
            case "Current":
                return this.rowState !== "Deleted";
            case "Proposed":
                return this.inEditMode && this.proposedValues !== null;
            case "Default":
                return this.rowState !== "Deleted" || this.hasVersion("Original");
        }
    }
    item(columnNameOrIndex, version) {
        const col = this.resolveColumn(columnNameOrIndex);
        const key = col.columnName.toLowerCase();
        const targetVersion = version ?? (this.inEditMode && this.proposedValues ? "Proposed" : "Default");
        if (targetVersion === "Proposed") {
            if (this.proposedValues && this.proposedValues.has(key)) {
                return this.proposedValues.get(key);
            }
            return this.currentValues.get(key);
        }
        if (targetVersion === "Original") {
            if (!this.hasVersion("Original")) {
                throw new Error(`Row in state '${this.rowState}' has no Original version.`);
            }
            return this.originalValues.get(key);
        }
        if (targetVersion === "Current") {
            if (this.rowState === "Deleted") {
                throw new Error("Cannot access Current version of a deleted row. Use Original version instead.");
            }
            return this.currentValues.get(key);
        }
        // Default version
        if (this.rowState === "Deleted") {
            return this.originalValues.get(key);
        }
        return this.currentValues.get(key);
    }
    setItem(columnNameOrIndex, value) {
        if (this.rowState === "Deleted") {
            throw new Error("Cannot modify a deleted row.");
        }
        const col = this.resolveColumn(columnNameOrIndex);
        if (col.readOnly && this.rowState !== "Detached") {
            throw new Error(`Column '${col.columnName}' is read-only.`);
        }
        const validated = col.coerceAndValidate(value);
        const key = col.columnName.toLowerCase();
        if (this.inEditMode) {
            if (!this.proposedValues) {
                this.proposedValues = new Map(this.currentValues);
            }
            this.proposedValues.set(key, validated);
            return;
        }
        const prev = this.currentValues.get(key);
        if (prev !== validated) {
            this.currentValues.set(key, validated);
            if (this.rowState === "Unchanged") {
                this.rowState = "Modified";
            }
        }
    }
    getValue(columnName) {
        return this.item(columnName);
    }
    setValue(columnName, value) {
        this.setItem(columnName, value);
    }
    beginEdit() {
        if (!this.inEditMode) {
            this.inEditMode = true;
            this.proposedValues = new Map(this.currentValues);
        }
    }
    endEdit() {
        if (this.inEditMode) {
            if (this.proposedValues) {
                let changed = false;
                for (const [k, v] of this.proposedValues.entries()) {
                    if (this.currentValues.get(k) !== v) {
                        this.currentValues.set(k, v);
                        changed = true;
                    }
                }
                if (changed && this.rowState === "Unchanged") {
                    this.rowState = "Modified";
                }
            }
            this.proposedValues = null;
            this.inEditMode = false;
        }
    }
    cancelEdit() {
        if (this.inEditMode) {
            this.proposedValues = null;
            this.inEditMode = false;
        }
    }
    delete() {
        if (this.rowState === "Deleted") {
            return;
        }
        if (this.rowState === "Added" || this.rowState === "Detached") {
            this.table.rows.remove(this);
            this.rowState = "Detached";
        }
        else {
            this.rowState = "Deleted";
        }
    }
    acceptChanges() {
        if (this.rowState === "Deleted") {
            this.table.rows.remove(this);
            this.rowState = "Detached";
            return;
        }
        this.endEdit();
        this.originalValues.clear();
        for (const [k, v] of this.currentValues.entries()) {
            this.originalValues.set(k, v);
        }
        this.rowState = "Unchanged";
    }
    rejectChanges() {
        this.cancelEdit();
        if (this.rowState === "Added") {
            this.table.rows.remove(this);
            this.rowState = "Detached";
            return;
        }
        if (this.rowState === "Modified" || this.rowState === "Deleted") {
            this.currentValues.clear();
            for (const [k, v] of this.originalValues.entries()) {
                this.currentValues.set(k, v);
            }
            this.rowState = "Unchanged";
        }
    }
    toObject() {
        const obj = {};
        for (const col of this.table.columns) {
            obj[col.columnName] = this.item(col.columnName);
        }
        return obj;
    }
    setValues(values) {
        for (const [k, v] of Object.entries(values)) {
            if (this.table.columns.contains(k)) {
                this.setItem(k, v);
            }
        }
    }
    resolveColumn(columnNameOrIndex) {
        const col = this.table.columns.get(columnNameOrIndex);
        if (!col) {
            throw new Error(`Column '${String(columnNameOrIndex)}' does not belong to table '${this.table.tableName}'.`);
        }
        return col;
    }
}
export class DataRowCollection {
    items = [];
    table;
    constructor(table) {
        this.table = table;
    }
    get count() {
        let active = 0;
        for (let i = 0; i < this.items.length; i++) {
            const row = this.items[i];
            if (row && row.rowState !== "Deleted") {
                active++;
            }
        }
        return active;
    }
    get totalCount() {
        return this.items.length;
    }
    add(rowOrValues) {
        let row;
        if (rowOrValues instanceof DataRow) {
            row = rowOrValues;
            if (row.table !== this.table) {
                throw new Error("Cannot add a DataRow that belongs to a different DataTable.");
            }
        }
        else {
            row = this.table.newRow();
            if (rowOrValues) {
                row.setValues(rowOrValues);
            }
        }
        this.items.push(row);
        row.rowState = "Added";
        return row;
    }
    insertAt(row, index) {
        if (row.table !== this.table) {
            throw new Error("Cannot insert a DataRow that belongs to a different DataTable.");
        }
        this.items.splice(index, 0, row);
        row.rowState = "Added";
    }
    remove(row) {
        const idx = this.items.indexOf(row);
        if (idx >= 0) {
            this.items.splice(idx, 1);
            return true;
        }
        return false;
    }
    removeAt(index) {
        if (index < 0 || index >= this.items.length) {
            return false;
        }
        this.items.splice(index, 1);
        return true;
    }
    get(index) {
        // Returns active row at active index
        let activeIndex = 0;
        for (let i = 0; i < this.items.length; i++) {
            const row = this.items[i];
            if (row && row.rowState !== "Deleted") {
                if (activeIndex === index) {
                    return row;
                }
                activeIndex++;
            }
        }
        return undefined;
    }
    getRaw(index) {
        return this.items[index];
    }
    indexOf(row) {
        return this.items.indexOf(row);
    }
    clear() {
        this.items.length = 0;
    }
    toArray(includeDeleted = false) {
        if (includeDeleted) {
            return [...this.items];
        }
        return this.items.filter((r) => r.rowState !== "Deleted");
    }
    [Symbol.iterator]() {
        return this.toArray()[Symbol.iterator]();
    }
}
//# sourceMappingURL=data-row.js.map