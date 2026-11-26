import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useReducer, useState } from "react";
/** Joins class names, skipping empty values; returns undefined when nothing remains. */
function cx(...names) {
    const joined = names.filter(Boolean).join(" ");
    return joined || undefined;
}
/** Page numbers (1-based) shown in the pager: a window of at most 10 around the current page. */
function pageWindow(pageIndex, pageCount) {
    const size = Math.min(10, pageCount);
    let first = Math.max(0, pageIndex - Math.floor(size / 2));
    first = Math.min(first, pageCount - size);
    return Array.from({ length: size }, (_, i) => first + i + 1);
}
const visuallyHidden = {
    position: "absolute", width: 1, height: 1, margin: -1, padding: 0, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0
};
export function WebFormsGridView({ controller, className, style, template, editCellTemplate, editTemplate }) {
    const [, refresh] = useReducer((value) => value + 1, 0);
    useEffect(() => controller.stateChanged.subscribe(() => refresh()), [controller]);
    const [editRowValues, setEditRowValues] = useState(null);
    const columns = controller.options.columns.filter((column) => column.visible !== false);
    const tableClass = className ?? cx(controller.options.cssClass, controller.options.tableCssClass);
    const currentEditIndex = controller.options.editIndex;
    const currentEditValues = (editRowValues && editRowValues.rowIndex === currentEditIndex)
        ? editRowValues.values
        : {};
    const setEditValue = (field, val) => {
        setEditRowValues((prev) => {
            const base = (prev && prev.rowIndex === currentEditIndex) ? prev.values : {};
            return {
                rowIndex: currentEditIndex,
                values: { ...base, [field]: val }
            };
        });
    };
    // The buffer belongs to one edit session: drop it whenever no row is being edited
    // (after update, cancel, or a delete that ends the edit), so it never leaks into a later edit.
    useEffect(() => {
        if (controller.options.editIndex < 0)
            setEditRowValues(null);
    });
    const saveEdit = async (rowIndex) => {
        const ok = await controller.updateRow(rowIndex, currentEditValues);
        if (ok)
            setEditRowValues(null);
        return ok;
    };
    const cancelEdit = () => {
        setEditRowValues(null);
        return controller.cancelEdit();
    };
    const renderCell = (column, row, visibleIndex) => {
        if (column.type === "template")
            return template?.(column.key, row, controller.getAbsoluteRowIndex(visibleIndex));
        const value = row[column.dataField];
        return column.format ? column.format(value, row) : String(value ?? "");
    };
    const renderEditCell = (column, row, rowIndex, visibleIndex) => {
        if (editCellTemplate) {
            const customNode = editCellTemplate(column.key, row, rowIndex, currentEditValues, setEditValue, () => saveEdit(rowIndex), cancelEdit);
            if (customNode !== undefined && customNode !== null) {
                return customNode;
            }
        }
        if (column.type === "bound") {
            const fieldKey = column.dataField;
            const currentVal = currentEditValues[fieldKey] !== undefined
                ? currentEditValues[fieldKey]
                : (row[column.dataField] ?? "");
            return (_jsx("input", { type: "text", className: "form-control form-control-sm", value: String(currentVal ?? ""), onChange: (e) => setEditValue(fieldKey, e.target.value) }));
        }
        return renderCell(column, row, visibleIndex);
    };
    const o = controller.options;
    const pageCount = controller.pageCount;
    const sort = controller.currentSort;
    const goPage = (e, index) => {
        e.preventDefault();
        void controller.changePage(index);
    };
    const hasPrev = o.pageIndex > 0;
    const hasNext = o.pageIndex < pageCount - 1;
    return (_jsx("div", { className: o.cssClass, children: _jsxs("table", { className: cx(tableClass), style: style, children: [o.showHeader && (_jsx("thead", { className: o.headerCssClass, children: _jsx("tr", { className: o.headerCssClass, children: columns.map((column) => {
                            const sortable = column.type === "bound" && column.sortable && o.allowSorting;
                            const sortedHere = column.type === "bound" && sort?.field === column.dataField;
                            return (_jsx("th", { scope: "col", "aria-sort": sortable ? (sortedHere ? (sort?.direction === "desc" ? "descending" : "ascending") : "none") : undefined, children: sortable && column.type === "bound"
                                    ? _jsx("a", { href: "#", role: "button", onClick: (e) => { e.preventDefault(); void controller.sort(column.dataField); }, children: column.headerText })
                                    : column.headerText }, column.key));
                        }) }) })), _jsx("tbody", { children: controller.visibleRows.length === 0 ? (_jsx("tr", { className: "empty", children: _jsx("td", { className: "empty", colSpan: columns.length, children: o.emptyDataText }) })) : (controller.visibleRows.map((row, visibleIndex) => {
                        const rowIndex = controller.getAbsoluteRowIndex(visibleIndex);
                        const isEditing = currentEditIndex === rowIndex;
                        if (isEditing && editTemplate) {
                            return (_jsx("tr", { className: cx("edit", o.editRowCssClass), "aria-selected": rowIndex === o.selectedIndex || undefined, children: _jsx("td", { colSpan: columns.length, children: editTemplate(row, rowIndex, async (values) => {
                                        const ok = await controller.updateRow(rowIndex, values);
                                        if (ok)
                                            setEditRowValues(null);
                                        return ok;
                                    }, cancelEdit) }) }, String(controller.getDataKey(row))));
                        }
                        const isSelected = rowIndex === o.selectedIndex;
                        const rowClass = isEditing
                            ? cx("edit", o.editRowCssClass)
                            : isSelected
                                ? cx("selected", o.selectedRowCssClass)
                                : (visibleIndex % 2 === 1 && o.alternatingRowCssClass)
                                    ? o.alternatingRowCssClass
                                    : o.rowCssClass;
                        return (_jsx("tr", { className: rowClass || undefined, "aria-selected": isSelected || undefined, children: columns.map((column) => (_jsx("td", { children: isEditing
                                    ? renderEditCell(column, row, rowIndex, visibleIndex)
                                    : renderCell(column, row, visibleIndex) }, column.key))) }, String(controller.getDataKey(row))));
                    })) }), (o.showFooter || o.allowPaging) && (_jsxs("tfoot", { children: [o.showFooter && (_jsx("tr", { className: cx("footer", o.footerCssClass), children: columns.map((column) => _jsx("td", {}, column.key)) })), o.allowPaging && (_jsx("tr", { className: cx("pager", o.pagerCssClass), children: _jsxs("td", { colSpan: columns.length, children: [hasPrev
                                        ? _jsx("a", { href: "#", role: "button", onClick: (e) => goPage(e, o.pageIndex - 1), children: "Previous" })
                                        : _jsx("span", { className: "aspNetDisabled", children: "Previous" }), pageWindow(o.pageIndex, pageCount).map((n) => n - 1 === o.pageIndex
                                        ? _jsx("span", { "aria-current": "page", children: n }, n)
                                        : _jsx("a", { href: "#", onClick: (e) => goPage(e, n - 1), children: n }, n)), hasNext
                                        ? _jsx("a", { href: "#", role: "button", onClick: (e) => goPage(e, o.pageIndex + 1), children: "Next" })
                                        : _jsx("span", { className: "aspNetDisabled", children: "Next" }), _jsxs("span", { style: visuallyHidden, children: ["Page ", pageCount === 0 ? 0 : o.pageIndex + 1, " of ", pageCount] })] }) }))] }))] }) }));
}
//# sourceMappingURL=WebFormsGridView.js.map