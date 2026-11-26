import { EventDispatcher } from "./events.js";
import { DataTable, DataView } from "@wf-controls/data";
function isDataSourceControl(obj) {
    return (typeof obj === "object" &&
        obj !== null &&
        !(obj instanceof DataTable) &&
        !(obj instanceof DataView) &&
        "select" in obj &&
        typeof obj.select === "function");
}
export class DataGridController {
    id;
    dataKeyField;
    autoGenerateColumns;
    allowPaging;
    pageSize;
    currentPageIndex;
    allowSorting;
    editItemIndex;
    selectedItemIndex;
    showHeader;
    showFooter;
    emptyText;
    _columns = [];
    source = [];
    sortState;
    dataSource;
    dataBinding = new EventDispatcher();
    dataBound = new EventDispatcher();
    itemCreated = new EventDispatcher();
    itemDataBound = new EventDispatcher();
    itemCommand = new EventDispatcher();
    editCommand = new EventDispatcher();
    updateCommand = new EventDispatcher();
    cancelCommand = new EventDispatcher();
    deleteCommand = new EventDispatcher();
    pageIndexChanged = new EventDispatcher();
    sortCommand = new EventDispatcher();
    selectedItemIndexChanged = new EventDispatcher();
    stateChanged = new EventDispatcher();
    constructor(options) {
        this.id = options.id;
        this.dataKeyField = options.dataKeyField;
        this.autoGenerateColumns = options.autoGenerateColumns ?? true;
        this.allowPaging = options.allowPaging ?? false;
        this.pageSize = Math.max(1, options.pageSize ?? 10);
        this.currentPageIndex = Math.max(0, options.currentPageIndex ?? 0);
        this.allowSorting = options.allowSorting ?? false;
        this.editItemIndex = options.editItemIndex ?? -1;
        this.selectedItemIndex = options.selectedItemIndex ?? -1;
        this.showHeader = options.showHeader ?? true;
        this.showFooter = options.showFooter ?? false;
        this.emptyText = options.emptyText ?? "No records found.";
        this.dataSource = options.dataSource;
        if (options.columns) {
            this._columns = [...options.columns];
        }
    }
    get columns() {
        return this._columns;
    }
    set columns(cols) {
        this._columns = [...cols];
    }
    get totalRecords() {
        return this.source.length;
    }
    get pageCount() {
        if (this.source.length === 0)
            return 0;
        return this.allowPaging ? Math.ceil(this.source.length / this.pageSize) : 1;
    }
    get visibleItems() {
        if (!this.allowPaging) {
            return this.source;
        }
        const start = this.currentPageIndex * this.pageSize;
        return this.source.slice(start, start + this.pageSize);
    }
    async dataBind(source) {
        const ds = source ?? this.dataSource;
        await this.dataBinding.emit(this, { itemCount: 0 });
        if (ds === undefined || ds === null) {
            this.source = [];
        }
        else if (ds instanceof DataTable) {
            this.source = ds.rows.toArray().map((r) => r.toObject());
            if (this.autoGenerateColumns && this._columns.length === 0) {
                this.generateColumnsFromDataTable(ds);
            }
        }
        else if (ds instanceof DataView) {
            const tbl = ds.toTable();
            this.source = tbl.rows.toArray().map((r) => r.toObject());
            if (this.autoGenerateColumns && this._columns.length === 0) {
                this.generateColumnsFromDataTable(tbl);
            }
        }
        else if (Array.isArray(ds)) {
            this.source = [...ds];
            if (this.autoGenerateColumns && this._columns.length === 0 && this.source.length > 0) {
                this.generateColumnsFromObject(this.source[0]);
            }
        }
        else if (isDataSourceControl(ds)) {
            const result = await ds.select();
            this.source = Array.isArray(result) ? result : [];
            if (this.autoGenerateColumns && this._columns.length === 0 && this.source.length > 0) {
                this.generateColumnsFromObject(this.source[0]);
            }
        }
        else {
            this.source = [];
        }
        this.clampPageIndex();
        const itemsToNotify = this.visibleItems;
        for (let i = 0; i < itemsToNotify.length; i++) {
            const dataItem = itemsToNotify[i];
            await this.itemCreated.emit(this, { itemIndex: i, dataItem });
            await this.itemDataBound.emit(this, { itemIndex: i, dataItem });
        }
        await this.dataBound.emit(this, { itemCount: this.source.length });
        await this.stateChanged.emit(this, { reason: "dataBind" });
    }
    generateColumnsFromDataTable(table) {
        const generated = [];
        for (const col of table.columns.toArray()) {
            generated.push({
                type: "bound",
                key: col.columnName,
                dataField: col.columnName,
                headerText: col.caption || col.columnName,
                sortExpression: col.columnName,
                readOnly: col.readOnly
            });
        }
        this._columns = generated;
    }
    generateColumnsFromObject(sample) {
        const generated = [];
        for (const key of Object.keys(sample)) {
            generated.push({
                type: "bound",
                key,
                dataField: key,
                headerText: formatHeaderText(key),
                sortExpression: key
            });
        }
        this._columns = generated;
    }
    async changePage(newPageIndex) {
        const maxPage = Math.max(0, this.pageCount - 1);
        const safeIndex = Math.min(Math.max(0, newPageIndex), maxPage);
        const args = {
            oldPageIndex: this.currentPageIndex,
            newPageIndex: safeIndex,
            cancel: false
        };
        await this.pageIndexChanged.emit(this, args);
        if (args.cancel)
            return false;
        this.currentPageIndex = safeIndex;
        if (isDataSourceControl(this.dataSource)) {
            await this.dataBind();
        }
        await this.stateChanged.emit(this, { reason: "changePage" });
        return true;
    }
    async sort(sortExpression, direction) {
        if (!this.allowSorting)
            return false;
        const nextDir = direction ??
            (this.sortState?.field === sortExpression && this.sortState.direction === "asc" ? "desc" : "asc");
        const args = {
            sortExpression,
            direction: nextDir,
            cancel: false
        };
        await this.sortCommand.emit(this, args);
        if (args.cancel)
            return false;
        this.sortState = { field: sortExpression, direction: nextDir };
        if (isDataSourceControl(this.dataSource)) {
            await this.dataBind();
        }
        else {
            const field = sortExpression;
            this.source.sort((a, b) => compareValues(a[field], b[field]) * (nextDir === "asc" ? 1 : -1));
        }
        await this.stateChanged.emit(this, { reason: "sort" });
        return true;
    }
    async selectItem(itemIndex) {
        const dataItem = this.requireItem(itemIndex);
        this.selectedItemIndex = itemIndex;
        await this.selectedItemIndexChanged.emit(this, { itemIndex, dataItem });
        await this.stateChanged.emit(this, { reason: "selectItem" });
        return true;
    }
    async beginEdit(itemIndex) {
        const dataItem = this.requireItem(itemIndex);
        const args = {
            itemIndex,
            dataItem,
            cancel: false
        };
        await this.editCommand.emit(this, args);
        if (args.cancel)
            return false;
        this.editItemIndex = itemIndex;
        await this.stateChanged.emit(this, { reason: "beginEdit" });
        return true;
    }
    async cancelEdit() {
        if (this.editItemIndex < 0)
            return false;
        const dataItem = this.requireItem(this.editItemIndex);
        const args = {
            itemIndex: this.editItemIndex,
            dataItem,
            cancel: false
        };
        await this.cancelCommand.emit(this, args);
        if (args.cancel)
            return false;
        this.editItemIndex = -1;
        await this.stateChanged.emit(this, { reason: "cancelEdit" });
        return true;
    }
    async updateItem(itemIndex, values) {
        const dataItem = this.requireItem(itemIndex);
        const args = {
            itemIndex,
            dataItem,
            values,
            cancel: false
        };
        await this.updateCommand.emit(this, args);
        if (args.cancel)
            return false;
        if (isDataSourceControl(this.dataSource)) {
            const keyVal = this.dataKeyField ? dataItem[this.dataKeyField] : undefined;
            await this.dataSource.update(keyVal !== undefined ? { [this.dataKeyField]: keyVal } : {}, values, dataItem);
        }
        Object.assign(dataItem, values);
        this.editItemIndex = -1;
        await this.stateChanged.emit(this, { reason: "updateItem" });
        return true;
    }
    async deleteItem(itemIndex) {
        const dataItem = this.requireItem(itemIndex);
        const args = {
            itemIndex,
            dataItem,
            cancel: false
        };
        await this.deleteCommand.emit(this, args);
        if (args.cancel)
            return false;
        if (isDataSourceControl(this.dataSource)) {
            const keyVal = this.dataKeyField ? dataItem[this.dataKeyField] : undefined;
            await this.dataSource.delete(keyVal !== undefined ? { [this.dataKeyField]: keyVal } : {}, dataItem);
        }
        this.source.splice(itemIndex, 1);
        this.clampPageIndex();
        if (this.editItemIndex === itemIndex)
            this.editItemIndex = -1;
        if (this.selectedItemIndex === itemIndex)
            this.selectedItemIndex = -1;
        await this.stateChanged.emit(this, { reason: "deleteItem" });
        return true;
    }
    async executeCommand(itemIndex, commandName, commandArgument) {
        const dataItem = this.requireItem(itemIndex);
        await this.itemCommand.emit(this, {
            itemIndex,
            dataItem,
            commandName,
            ...(commandArgument === undefined ? {} : { commandArgument })
        });
        switch (commandName.toLowerCase()) {
            case "edit":
                await this.beginEdit(itemIndex);
                break;
            case "cancel":
                await this.cancelEdit();
                break;
            case "delete":
                await this.deleteItem(itemIndex);
                break;
            case "select":
                await this.selectItem(itemIndex);
                break;
        }
    }
    requireItem(index) {
        const item = this.source[index];
        if (!item) {
            throw new RangeError(`DataGrid item index ${index} out of bounds.`);
        }
        return item;
    }
    clampPageIndex() {
        if (!this.allowPaging) {
            this.currentPageIndex = 0;
            return;
        }
        this.currentPageIndex = Math.min(this.currentPageIndex, Math.max(0, this.pageCount - 1));
    }
}
function formatHeaderText(propName) {
    // Convert camelCase or PascalCase to "Title Case"
    return propName
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
}
function compareValues(a, b) {
    if (Object.is(a, b))
        return 0;
    if (a == null)
        return 1;
    if (b == null)
        return -1;
    if (typeof a === "number" && typeof b === "number")
        return a - b;
    if (a instanceof Date && b instanceof Date)
        return a.getTime() - b.getTime();
    return String(a).localeCompare(String(b), undefined, {
        numeric: true,
        sensitivity: "base"
    });
}
//# sourceMappingURL=data-grid.js.map