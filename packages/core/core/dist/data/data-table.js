import { DataColumn, DataColumnCollection } from "./data-column.js";
import { DataRow, DataRowCollection } from "./data-row.js";
export class DataTable {
    tableName;
    columns;
    rows;
    primaryKey = [];
    constructor(tableName = "Table1") {
        this.tableName = tableName;
        this.columns = new DataColumnCollection();
        this.rows = new DataRowCollection(this);
    }
    newRow() {
        return new DataRow(this);
    }
    newRowFrom(values) {
        const row = this.newRow();
        row.setValues(values);
        return row;
    }
    acceptChanges() {
        const all = this.rows.toArray(true);
        for (const row of all) {
            row.acceptChanges();
        }
    }
    rejectChanges() {
        const all = this.rows.toArray(true);
        for (const row of all) {
            row.rejectChanges();
        }
    }
    clear() {
        this.rows.clear();
    }
    clone() {
        const cloneTable = new DataTable(this.tableName);
        for (const col of this.columns) {
            cloneTable.columns.add(new DataColumn({
                columnName: col.columnName,
                dataType: col.dataType,
                allowDBNull: col.allowDBNull,
                defaultValue: col.defaultValue,
                autoIncrement: col.autoIncrement,
                autoIncrementSeed: col.autoIncrementSeed,
                autoIncrementStep: col.autoIncrementStep,
                readOnly: col.readOnly,
                maxLength: col.maxLength,
                caption: col.caption,
                unique: col.unique,
            }));
        }
        cloneTable.primaryKey = this.primaryKey.map((pk) => {
            const found = cloneTable.columns.get(pk.columnName);
            if (!found)
                throw new Error(`Primary key column ${pk.columnName} not found in cloned table.`);
            return found;
        });
        return cloneTable;
    }
    copy() {
        const copyTable = this.clone();
        for (const row of this.rows.toArray(true)) {
            const newRow = copyTable.newRow();
            for (const col of this.columns) {
                if (row.rowState !== "Detached") {
                    try {
                        newRow.setItem(col.columnName, row.item(col.columnName));
                    }
                    catch {
                        // pass
                    }
                }
            }
            copyTable.rows.add(newRow);
            if (row.rowState === "Unchanged") {
                newRow.acceptChanges();
            }
            else if (row.rowState === "Deleted") {
                newRow.acceptChanges();
                newRow.delete();
            }
        }
        return copyTable;
    }
    find(primaryKeyValues) {
        if (this.primaryKey.length === 0) {
            throw new Error(`Table '${this.tableName}' does not have a primary key defined.`);
        }
        const keys = Array.isArray(primaryKeyValues) ? primaryKeyValues : [primaryKeyValues];
        if (keys.length !== this.primaryKey.length) {
            throw new Error(`Table '${this.tableName}' primary key requires ${this.primaryKey.length} value(s), but ${keys.length} were provided.`);
        }
        for (const row of this.rows) {
            let match = true;
            for (let i = 0; i < this.primaryKey.length; i++) {
                const pkCol = this.primaryKey[i];
                if (pkCol && row.item(pkCol.columnName) !== keys[i]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                return row;
            }
        }
        return undefined;
    }
    select(filter, sort) {
        let result = [...this.rows.toArray()];
        if (filter) {
            const predicate = typeof filter === "function" ? filter : this.compileFilterExpression(filter);
            result = result.filter(predicate);
        }
        if (sort) {
            result = this.sortRows(result, sort);
        }
        return result;
    }
    toObjects() {
        return this.rows.toArray().map((r) => r.toObject());
    }
    static fromObjects(tableName, data) {
        const table = new DataTable(tableName);
        if (!data || data.length === 0) {
            return table;
        }
        const first = data[0];
        if (first) {
            for (const [key, value] of Object.entries(first)) {
                let type = "string";
                if (typeof value === "number")
                    type = "number";
                else if (typeof value === "boolean")
                    type = "boolean";
                else if (value instanceof Date)
                    type = "date";
                else if (typeof value === "object" && value !== null)
                    type = "object";
                table.columns.add(new DataColumn(key, type));
            }
        }
        for (const item of data) {
            const row = table.newRow();
            row.setValues(item);
            table.rows.add(row);
            row.acceptChanges();
        }
        return table;
    }
    compileFilterExpression(expression) {
        const trimmed = expression.trim();
        if (!trimmed)
            return () => true;
        // Support AND / OR chaining
        const orParts = trimmed.split(/\s+OR\s+/i);
        if (orParts.length > 1) {
            const funcs = orParts.map((p) => this.compileFilterExpression(p));
            return (row) => funcs.some((fn) => fn(row));
        }
        const andParts = trimmed.split(/\s+AND\s+/i);
        if (andParts.length > 1) {
            const funcs = andParts.map((p) => this.compileFilterExpression(p));
            return (row) => funcs.every((fn) => fn(row));
        }
        // Match single condition: Field operator Value
        const match = trimmed.match(/^([a-zA-Z0-9_]+)\s*(<=|>=|<>|!=|=|<|>|LIKE)\s*(.+)$/i);
        if (!match) {
            throw new Error(`Unsupported filter expression syntax: '${expression}'`);
        }
        const field = match[1];
        const op = match[2]?.toUpperCase();
        let rawVal = match[3]?.trim();
        if (!field || !op || rawVal === undefined) {
            throw new Error(`Malformed filter expression: '${expression}'`);
        }
        // Parse value literal
        let targetVal = rawVal;
        if ((rawVal.startsWith("'") && rawVal.endsWith("'")) || (rawVal.startsWith('"') && rawVal.endsWith('"'))) {
            targetVal = rawVal.substring(1, rawVal.length - 1);
        }
        else if (rawVal.toLowerCase() === "null") {
            targetVal = null;
        }
        else if (rawVal.toLowerCase() === "true") {
            targetVal = true;
        }
        else if (rawVal.toLowerCase() === "false") {
            targetVal = false;
        }
        else if (!Number.isNaN(Number(rawVal))) {
            targetVal = Number(rawVal);
        }
        return (row) => {
            const actualVal = row.item(field);
            if (op === "=")
                return actualVal === targetVal;
            if (op === "<>" || op === "!=")
                return actualVal !== targetVal;
            if (op === "<")
                return actualVal < targetVal;
            if (op === "<=")
                return actualVal <= targetVal;
            if (op === ">")
                return actualVal > targetVal;
            if (op === ">=")
                return actualVal >= targetVal;
            if (op === "LIKE") {
                const pattern = String(targetVal).replace(/%/g, ".*").replace(/_/g, ".");
                const regex = new RegExp(`^${pattern}$`, "i");
                return regex.test(String(actualVal ?? ""));
            }
            return false;
        };
    }
    sortRows(rows, sortExpression) {
        const clauses = sortExpression.split(",").map((c) => {
            const parts = c.trim().split(/\s+/);
            const colName = parts[0] ?? "";
            const dir = (parts[1]?.toUpperCase() ?? "ASC");
            return { colName, dir };
        });
        return [...rows].sort((a, b) => {
            for (const clause of clauses) {
                const valA = a.item(clause.colName);
                const valB = b.item(clause.colName);
                if (valA === valB)
                    continue;
                if (valA === null || valA === undefined)
                    return clause.dir === "ASC" ? -1 : 1;
                if (valB === null || valB === undefined)
                    return clause.dir === "ASC" ? 1 : -1;
                let cmp = 0;
                if (typeof valA === "number" && typeof valB === "number") {
                    cmp = valA - valB;
                }
                else if (valA instanceof Date && valB instanceof Date) {
                    cmp = valA.getTime() - valB.getTime();
                }
                else {
                    cmp = String(valA).localeCompare(String(valB));
                }
                if (cmp !== 0) {
                    return clause.dir === "ASC" ? cmp : -cmp;
                }
            }
            return 0;
        });
    }
}
//# sourceMappingURL=data-table.js.map