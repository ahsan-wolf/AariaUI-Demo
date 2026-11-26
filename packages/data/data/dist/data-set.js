import { DataColumn } from "./data-column.js";
import { DataTable } from "./data-table.js";
export class DataRelation {
    relationName;
    parentTable;
    childTable;
    parentColumnNames;
    childColumnNames;
    constructor(relationName, parentTable, childTable, parentColumns, childColumns) {
        this.relationName = relationName;
        this.parentTable = parentTable;
        this.childTable = childTable;
        this.parentColumnNames = Array.isArray(parentColumns) ? parentColumns : [parentColumns];
        this.childColumnNames = Array.isArray(childColumns) ? childColumns : [childColumns];
        if (this.parentColumnNames.length !== this.childColumnNames.length) {
            throw new Error("Parent and child columns count must match in DataRelation.");
        }
    }
    getChildRows(parentRow) {
        if (parentRow.table !== this.parentTable) {
            throw new Error(`Row does not belong to parent table '${this.parentTable.tableName}'.`);
        }
        return this.childTable.rows.toArray().filter((childRow) => {
            for (let i = 0; i < this.parentColumnNames.length; i++) {
                const pCol = this.parentColumnNames[i];
                const cCol = this.childColumnNames[i];
                if (pCol && cCol && parentRow.item(pCol) !== childRow.item(cCol)) {
                    return false;
                }
            }
            return true;
        });
    }
    getParentRow(childRow) {
        if (childRow.table !== this.childTable) {
            throw new Error(`Row does not belong to child table '${this.childTable.tableName}'.`);
        }
        return this.parentTable.rows.toArray().find((parentRow) => {
            for (let i = 0; i < this.childColumnNames.length; i++) {
                const cCol = this.childColumnNames[i];
                const pCol = this.parentColumnNames[i];
                if (cCol && pCol && childRow.item(cCol) !== parentRow.item(pCol)) {
                    return false;
                }
            }
            return true;
        });
    }
}
export class DataTableCollection {
    items = [];
    nameIndex = new Map();
    get count() {
        return this.items.length;
    }
    add(tableOrName) {
        const table = typeof tableOrName === "string" ? new DataTable(tableOrName) : tableOrName;
        const lower = table.tableName.toLowerCase();
        if (this.nameIndex.has(lower)) {
            throw new Error(`A table named '${table.tableName}' already exists in this DataSet.`);
        }
        const idx = this.items.length;
        this.items.push(table);
        this.nameIndex.set(lower, idx);
        return table;
    }
    get(nameOrIndex) {
        if (typeof nameOrIndex === "number") {
            return this.items[nameOrIndex];
        }
        const idx = this.nameIndex.get(nameOrIndex.toLowerCase());
        return idx !== undefined ? this.items[idx] : undefined;
    }
    indexOf(tableOrName) {
        if (typeof tableOrName === "string") {
            const idx = this.nameIndex.get(tableOrName.toLowerCase());
            return idx !== undefined ? idx : -1;
        }
        return this.items.indexOf(tableOrName);
    }
    contains(name) {
        return this.nameIndex.has(name.toLowerCase());
    }
    remove(tableOrName) {
        const idx = this.indexOf(tableOrName);
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
            const tbl = this.items[i];
            if (tbl) {
                this.nameIndex.set(tbl.tableName.toLowerCase(), i);
            }
        }
    }
}
export class DataSet {
    dataSetName;
    tables;
    relations = [];
    constructor(dataSetName = "NewDataSet") {
        this.dataSetName = dataSetName;
        this.tables = new DataTableCollection();
    }
    acceptChanges() {
        for (const table of this.tables) {
            table.acceptChanges();
        }
    }
    rejectChanges() {
        for (const table of this.tables) {
            table.rejectChanges();
        }
    }
    clear() {
        for (const table of this.tables) {
            table.clear();
        }
    }
    clone() {
        const cloned = new DataSet(this.dataSetName);
        for (const table of this.tables) {
            cloned.tables.add(table.clone());
        }
        for (const rel of this.relations) {
            const pTable = cloned.tables.get(rel.parentTable.tableName);
            const cTable = cloned.tables.get(rel.childTable.tableName);
            if (pTable && cTable) {
                cloned.relations.push(new DataRelation(rel.relationName, pTable, cTable, rel.parentColumnNames, rel.childColumnNames));
            }
        }
        return cloned;
    }
    copy() {
        const copied = new DataSet(this.dataSetName);
        for (const table of this.tables) {
            copied.tables.add(table.copy());
        }
        for (const rel of this.relations) {
            const pTable = copied.tables.get(rel.parentTable.tableName);
            const cTable = copied.tables.get(rel.childTable.tableName);
            if (pTable && cTable) {
                copied.relations.push(new DataRelation(rel.relationName, pTable, cTable, rel.parentColumnNames, rel.childColumnNames));
            }
        }
        return copied;
    }
    toJson() {
        const root = {
            dataSetName: this.dataSetName,
            tables: this.tables.toArray().map((t) => ({
                tableName: t.tableName,
                columns: t.columns.toArray().map((c) => ({
                    columnName: c.columnName,
                    dataType: c.dataType,
                    allowDBNull: c.allowDBNull,
                    defaultValue: c.defaultValue,
                })),
                rows: t.toObjects(),
            })),
        };
        return JSON.stringify(root, null, 2);
    }
    static fromJson(jsonStr) {
        const parsed = JSON.parse(jsonStr);
        const ds = new DataSet(parsed.dataSetName || "NewDataSet");
        if (Array.isArray(parsed.tables)) {
            for (const tData of parsed.tables) {
                const table = new DataTable(tData.tableName || "Table");
                if (Array.isArray(tData.columns)) {
                    for (const col of tData.columns) {
                        table.columns.add(new DataColumn(col));
                    }
                }
                if (Array.isArray(tData.rows)) {
                    for (const rData of tData.rows) {
                        const row = table.newRow();
                        row.setValues(rData);
                        table.rows.add(row);
                        row.acceptChanges();
                    }
                }
                ds.tables.add(table);
            }
        }
        return ds;
    }
    toXml() {
        let xml = `<?xml version="1.0" encoding="utf-8"?>\n<${this.dataSetName}>\n`;
        for (const table of this.tables) {
            for (const row of table.rows) {
                xml += `  <${table.tableName}>\n`;
                for (const col of table.columns) {
                    const val = row.item(col.columnName);
                    if (val !== null && val !== undefined) {
                        xml += `    <${col.columnName}>${escapeXml(String(val))}</${col.columnName}>\n`;
                    }
                }
                xml += `  </${table.tableName}>\n`;
            }
        }
        xml += `</${this.dataSetName}>`;
        return xml;
    }
    static fromXml(xmlStr, dataSetName) {
        // Strip XML declaration
        const clean = xmlStr.replace(/<\?xml[\s\S]*?\?>/i, "").trim();
        // Find root element
        const rootMatch = clean.match(/^<([a-zA-Z0-9_]+)>([\s\S]*)<\/\1>$/);
        const rootTag = rootMatch ? rootMatch[1] : (dataSetName || "NewDataSet");
        const content = rootMatch ? (rootMatch[2] ?? "") : clean;
        const ds = new DataSet(rootTag || "NewDataSet");
        const tableData = new Map();
        // Match each child row tag
        const elementRegex = /<([a-zA-Z0-9_]+)>([\s\S]*?)<\/\1>/g;
        let match;
        while ((match = elementRegex.exec(content)) !== null) {
            const tag = match[1];
            const inner = match[2];
            if (!tag || !inner)
                continue;
            const subRegex = /<([a-zA-Z0-9_]+)>([\s\S]*?)<\/\1>/g;
            let fieldMatch;
            const record = {};
            let hasFields = false;
            while ((fieldMatch = subRegex.exec(inner)) !== null) {
                const fName = fieldMatch[1];
                const fVal = fieldMatch[2];
                if (fName && fVal !== undefined) {
                    record[fName] = unescapeXml(fVal.trim());
                    hasFields = true;
                }
            }
            if (hasFields) {
                if (!tableData.has(tag)) {
                    tableData.set(tag, []);
                }
                tableData.get(tag).push(record);
            }
        }
        for (const [tableName, records] of tableData.entries()) {
            const table = DataTable.fromObjects(tableName, records);
            ds.tables.add(table);
        }
        return ds;
    }
}
function escapeXml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
function unescapeXml(safe) {
    return safe
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
}
//# sourceMappingURL=data-set.js.map