import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useReducer } from "react";
/** Semantic hook class for an item type: alt, selected, edit, header, footer, separator (none for plain Item). */
function semanticClass(itemType) {
    switch (itemType) {
        case "AlternatingItem": return "alt";
        case "SelectedItem": return "selected";
        case "EditItem": return "edit";
        case "Header": return "header";
        case "Footer": return "footer";
        case "Separator": return "separator";
        default: return "";
    }
}
function join(...names) {
    const joined = names.filter(Boolean).join(" ");
    return joined || undefined;
}
export function WebFormsDataList({ controller, className, headerTemplate, footerTemplate, itemTemplate, alternatingItemTemplate, selectedItemTemplate, editItemTemplate, separatorTemplate, emptyTemplate }) {
    const [, refresh] = useReducer((value) => value + 1, 0);
    useEffect(() => controller.stateChanged.subscribe(() => refresh()), [controller]);
    if (!controller.itemCount) {
        return _jsx(_Fragment, { children: emptyTemplate?.() ?? _jsx("p", { className: "empty", children: controller.emptyText }) });
    }
    const renderItemContent = (item) => {
        const { dataItem, itemIndex, itemType } = item;
        if (itemType === "EditItem" && editItemTemplate) {
            return editItemTemplate(dataItem, itemIndex, (values) => controller.updateItem(itemIndex, values), () => controller.cancelEdit());
        }
        if (itemType === "SelectedItem" && selectedItemTemplate) {
            return selectedItemTemplate(dataItem, itemIndex, (name, arg) => controller.executeCommand(itemIndex, name, arg));
        }
        if (itemType === "AlternatingItem" && alternatingItemTemplate) {
            return alternatingItemTemplate(dataItem, itemIndex, (name, arg) => controller.executeCommand(itemIndex, name, arg));
        }
        return itemTemplate(dataItem, itemIndex, (name, arg) => controller.executeCommand(itemIndex, name, arg));
    };
    const matrix = controller.getLayoutMatrix();
    if (controller.repeatLayout === "Flow") {
        return (_jsxs("div", { className: join("wf-datalist", className), children: [controller.evaluationNotice && _jsx("div", { className: "wf-evaluation", role: "note", children: controller.evaluationNotice }), controller.showHeader && headerTemplate?.(), controller.items.map((item, idx) => (_jsxs("div", { className: join("datalist-item", `datalist-${item.itemType.toLowerCase()}`, semanticClass(item.itemType)), children: [renderItemContent(item), idx < controller.items.length - 1 && separatorTemplate?.()] }, idx))), controller.showFooter && footerTemplate?.()] }));
    }
    return (_jsxs("div", { className: className, children: [controller.evaluationNotice && _jsx("div", { className: "wf-evaluation", role: "note", children: controller.evaluationNotice }), _jsxs("table", { className: join("datalist-table", "wf-datalist", className), border: controller.showTableBorder ? 1 : 0, children: [controller.showHeader && headerTemplate && (_jsx("thead", { children: _jsx("tr", { children: _jsx("th", { colSpan: controller.repeatColumns || 1, children: headerTemplate() }) }) })), _jsx("tbody", { children: matrix.map((row, rIdx) => (_jsx("tr", { children: row.map((cell, cIdx) => (_jsx("td", { className: cell ? join("datalist-cell", `datalist-${cell.itemType.toLowerCase()}`, semanticClass(cell.itemType)) : "datalist-cell-empty", children: cell ? renderItemContent(cell) : null }, cIdx))) }, rIdx))) }), controller.showFooter && footerTemplate && (_jsx("tfoot", { children: _jsx("tr", { children: _jsx("td", { colSpan: controller.repeatColumns || 1, children: footerTemplate() }) }) }))] })] }));
}
//# sourceMappingURL=WebFormsDataList.js.map