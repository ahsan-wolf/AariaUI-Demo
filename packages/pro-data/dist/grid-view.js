import { EventDispatcher } from "@wf-controls/core";
import { DataTable, DataView } from "@wf-controls/core";
import { ValidatorManager } from "@wf-controls/core";
import { requireFeature } from "@wf-controls/license";
import { blockUnlicensed, evaluationNotice, rowLimit } from "./evaluation.js";
function isDataSourceControl(obj) {
    return (typeof obj === "object" &&
        obj !== null &&
        !(obj instanceof DataTable) &&
        !(obj instanceof DataView) &&
        "select" in obj &&
        typeof obj.select === "function");
}
export class GridViewController {
    source = [];
    /** Set when a data source returns `{ items, total }`: the source then holds only the current page. */
    serverTotal;
    /** Absolute index of `source[0]` (non-zero only for server-side paging). */
    sourceOffset = 0;
    sortState;
    dataBinding = new EventDispatcher();
    dataBound = new EventDispatcher();
    rowCreated = new EventDispatcher();
    rowDataBound = new EventDispatcher();
    rowCommand = new EventDispatcher();
    rowEditing = new EventDispatcher();
    rowUpdating = new EventDispatcher();
    rowUpdated = new EventDispatcher();
    rowCancelingEdit = new EventDispatcher();
    rowDeleting = new EventDispatcher();
    rowDeleted = new EventDispatcher();
    selectedIndexChanging = new EventDispatcher();
    selectedIndexChanged = new EventDispatcher();
    pageIndexChanging = new EventDispatcher();
    pageIndexChanged = new EventDispatcher();
    sorting = new EventDispatcher();
    sorted = new EventDispatcher();
    stateChanged = new EventDispatcher();
    /** False when "data.gridView" is not licensed: rows are capped and editing is disabled (evaluation mode). */
    licensed = requireFeature("data.gridView");
    /** Text for the adapter to show (watermark / evaluation limit), or undefined when fully licensed. */
    get evaluationNotice() { return evaluationNotice("data.gridView"); }
    options;
    constructor(options) {
        this.options = {
            allowPaging: false,
            allowSorting: false,
            pageSize: 10,
            pageIndex: 0,
            selectedIndex: -1,
            editIndex: -1,
            emptyDataText: "No records found.",
            showHeader: true,
            showFooter: false,
            causesValidation: false,
            ...options
        };
    }
    get dataSource() {
        return this.source;
    }
    get totalRecords() {
        return this.serverTotal ?? this.source.length;
    }
    get pageCount() {
        const total = this.totalRecords;
        return total === 0
            ? 0
            : this.options.allowPaging
                ? Math.ceil(total / this.options.pageSize)
                : 1;
    }
    get visibleRows() {
        if (!this.options.allowPaging || this.serverTotal !== undefined)
            return this.source;
        const start = this.options.pageIndex * this.options.pageSize;
        return this.source.slice(start, start + this.options.pageSize);
    }
    get currentSort() {
        return this.sortState;
    }
    async dataBind(data) {
        if (data !== undefined) {
            this.options.dataSource = data;
        }
        const sourceToBind = this.options.dataSource;
        let rows = [];
        let serverTotal;
        if (sourceToBind) {
            if (Array.isArray(sourceToBind)) {
                rows = [...sourceToBind];
            }
            else if (sourceToBind instanceof DataTable) {
                rows = sourceToBind.rows.toArray().map((r) => r.toObject());
            }
            else if (sourceToBind instanceof DataView) {
                rows = sourceToBind.toRows().map((r) => r.toObject());
            }
            else if (isDataSourceControl(sourceToBind)) {
                const selectArgs = {
                    startRowIndex: this.options.allowPaging
                        ? this.options.pageIndex * this.options.pageSize
                        : undefined,
                    maximumRows: this.options.allowPaging ? this.options.pageSize : undefined,
                    sortExpression: this.sortState
                        ? `${String(this.sortState.field)} ${this.sortState.direction.toUpperCase()}`
                        : undefined
                };
                const res = await sourceToBind.select(selectArgs);
                if (Array.isArray(res)) {
                    rows = [...res];
                }
                else if (res instanceof DataTable) {
                    rows = res.rows.toArray().map((r) => r.toObject());
                }
                else if (res instanceof DataView) {
                    rows = res.toRows().map((r) => r.toObject());
                }
                else if (res &&
                    typeof res === "object" &&
                    "items" in res) {
                    const items = res.items;
                    if (Array.isArray(items))
                        rows = [...items];
                    // `{ items, total }` means server-side paging: `items` is only the requested page.
                    const total = res.total;
                    if (typeof total === "number" && this.options.allowPaging)
                        serverTotal = total;
                }
            }
        }
        const cap = rowLimit("data.gridView");
        if (cap !== undefined) {
            if (serverTotal !== undefined) {
                const start = this.options.pageIndex * this.options.pageSize;
                rows = rows.slice(0, Math.max(0, cap - start));
                serverTotal = Math.min(serverTotal, cap);
            }
            else {
                rows = rows.slice(0, cap);
            }
        }
        await this.dataBinding.emit(this, { itemCount: rows.length });
        this.source = rows;
        this.serverTotal = serverTotal;
        this.clampPageIndex();
        this.sourceOffset = serverTotal !== undefined ? this.options.pageIndex * this.options.pageSize : 0;
        for (let i = 0; i < this.source.length; i++) {
            const dataItem = this.requireRow(i + this.sourceOffset);
            const args = { rowIndex: i + this.sourceOffset, dataItem };
            await this.rowCreated.emit(this, args);
            await this.rowDataBound.emit(this, args);
        }
        await this.dataBound.emit(this, { itemCount: this.totalRecords });
        await this.notify("dataBind");
    }
    getDataKey(row) {
        return row[this.options.dataKeyField];
    }
    getAbsoluteRowIndex(visibleIndex) {
        return this.options.allowPaging
            ? this.options.pageIndex * this.options.pageSize + visibleIndex
            : visibleIndex;
    }
    async executeCommand(rowIndex, commandName, commandArgument) {
        const dataItem = this.requireRow(rowIndex);
        await this.rowCommand.emit(this, {
            rowIndex,
            dataItem,
            commandName,
            ...(commandArgument === undefined ? {} : { commandArgument })
        });
        switch (commandName.toLowerCase()) {
            case "edit":
                await this.beginEdit(rowIndex);
                break;
            case "delete":
                await this.deleteRow(rowIndex);
                break;
            case "select":
                await this.selectRow(rowIndex);
                break;
            case "cancel":
                await this.cancelEdit();
                break;
        }
    }
    resolveRowIndex(rowOrIndex) {
        if (typeof rowOrIndex === "number")
            return rowOrIndex;
        const i = this.source.indexOf(rowOrIndex);
        return i < 0 ? i : i + this.sourceOffset;
    }
    async beginEdit(rowOrIndex) {
        if (blockUnlicensed("data.gridView", "editing"))
            return false;
        const rowIndex = this.resolveRowIndex(rowOrIndex);
        const args = { rowIndex, dataItem: this.requireRow(rowIndex), cancel: false };
        await this.rowEditing.emit(this, args);
        if (args.cancel)
            return false;
        this.options.editIndex = rowIndex;
        await this.notify("beginEdit");
        return true;
    }
    async updateRow(rowOrIndex, values) {
        if (blockUnlicensed("data.gridView", "updating"))
            return false;
        const rowIndex = this.resolveRowIndex(rowOrIndex);
        if (this.options.causesValidation) {
            const valid = await ValidatorManager.validate(this.options.validationGroup);
            if (!valid) {
                return false;
            }
        }
        const args = { rowIndex, dataItem: this.requireRow(rowIndex), values, cancel: false };
        await this.rowUpdating.emit(this, args);
        if (args.cancel)
            return false;
        if (isDataSourceControl(this.options.dataSource)) {
            const keyVal = this.getDataKey(args.dataItem);
            await this.options.dataSource.update({ [this.options.dataKeyField]: keyVal }, values, args.dataItem);
        }
        Object.assign(args.dataItem, values);
        this.options.editIndex = -1;
        await this.rowUpdated.emit(this, { rowIndex, dataItem: args.dataItem });
        await this.notify("updateRow");
        return true;
    }
    async cancelEdit() {
        const rowIndex = this.options.editIndex;
        if (rowIndex < 0)
            return false;
        const args = { rowIndex, dataItem: this.requireRow(rowIndex), cancel: false };
        await this.rowCancelingEdit.emit(this, args);
        if (args.cancel)
            return false;
        this.options.editIndex = -1;
        await this.notify("cancelEdit");
        return true;
    }
    async deleteRow(rowOrIndex) {
        if (blockUnlicensed("data.gridView", "deleting"))
            return false;
        const rowIndex = this.resolveRowIndex(rowOrIndex);
        const dataItem = this.requireRow(rowIndex);
        const args = { rowIndex, dataItem, cancel: false };
        await this.rowDeleting.emit(this, args);
        if (args.cancel)
            return false;
        if (isDataSourceControl(this.options.dataSource)) {
            const keyVal = this.getDataKey(dataItem);
            await this.options.dataSource.delete({ [this.options.dataKeyField]: keyVal }, dataItem);
        }
        this.source.splice(rowIndex - this.sourceOffset, 1);
        if (this.serverTotal !== undefined)
            this.serverTotal -= 1;
        this.clampPageIndex();
        await this.rowDeleted.emit(this, { rowIndex, dataItem });
        await this.notify("deleteRow");
        return true;
    }
    async selectRow(rowOrIndex) {
        const rowIndex = this.resolveRowIndex(rowOrIndex);
        const dataItem = this.requireRow(rowIndex);
        const args = { rowIndex, dataItem, cancel: false };
        await this.selectedIndexChanging.emit(this, args);
        if (args.cancel)
            return false;
        this.options.selectedIndex = rowIndex;
        await this.selectedIndexChanged.emit(this, { rowIndex, dataItem });
        await this.notify("selectRow");
        return true;
    }
    async changePage(newPageIndex) {
        const maximum = Math.max(0, this.pageCount - 1);
        const safeIndex = Math.min(Math.max(0, newPageIndex), maximum);
        const args = { oldPageIndex: this.options.pageIndex, newPageIndex: safeIndex, cancel: false };
        await this.pageIndexChanging.emit(this, args);
        if (args.cancel)
            return false;
        this.options.pageIndex = safeIndex;
        if (isDataSourceControl(this.options.dataSource)) {
            await this.dataBind();
        }
        await this.pageIndexChanged.emit(this, args);
        await this.notify("changePage");
        return true;
    }
    async sort(field, direction) {
        if (!this.options.allowSorting)
            return false;
        const nextDirection = direction ??
            (this.sortState?.field === field && this.sortState.direction === "asc" ? "desc" : "asc");
        const args = { sortExpression: String(field), direction: nextDirection, cancel: false };
        await this.sorting.emit(this, args);
        if (args.cancel)
            return false;
        this.sortState = { field, direction: nextDirection };
        if (isDataSourceControl(this.options.dataSource)) {
            await this.dataBind();
        }
        else {
            this.source.sort((a, b) => compare(a[field], b[field]) * (nextDirection === "asc" ? 1 : -1));
        }
        await this.sorted.emit(this, args);
        await this.notify("sort");
        return true;
    }
    requireRow(index) {
        const row = this.source[index - this.sourceOffset];
        if (!row)
            throw new RangeError(`Grid row ${index} does not exist.`);
        return row;
    }
    clampPageIndex() {
        this.options.pageIndex = Math.min(this.options.pageIndex, Math.max(0, this.pageCount - 1));
    }
    async notify(reason) {
        await this.stateChanged.emit(this, { reason });
    }
}
function compare(a, b) {
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
//# sourceMappingURL=grid-view.js.map