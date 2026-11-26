import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useReducer } from "react";
/** Joins class names, skipping empty values; returns undefined when nothing remains. */
function cx(...names) {
    const joined = names.filter(Boolean).join(" ");
    return joined || undefined;
}
export function WebFormsRepeater({ controller, className, createItem, editItemTemplate, headerTemplate, itemTemplate, alternatingItemTemplate, separatorTemplate, footerTemplate, emptyTemplate }) {
    const [, refresh] = useReducer((value) => value + 1, 0);
    useEffect(() => controller.stateChanged.subscribe(() => refresh()), [controller]);
    const addItem = async () => {
        if (createItem)
            await controller.addItem(await createItem());
    };
    if (controller.isResetting)
        return null;
    if (!controller.items.length)
        return _jsx(_Fragment, { children: emptyTemplate?.() ?? _jsx("div", { className: "empty", children: controller.options.emptyText ?? "No records found." }) });
    const renderTemplate = (item, index) => {
        if (controller.editItemIndex === index && editItemTemplate) {
            return editItemTemplate(item, index, (values) => controller.updateItem(index, values), () => controller.cancelEdit());
        }
        if (index % 2 === 1 && alternatingItemTemplate) {
            return alternatingItemTemplate(item, index, (name, argument) => controller.executeCommand(index, name, argument));
        }
        return itemTemplate(item, index, (name, argument) => controller.executeCommand(index, name, argument));
    };
    return (_jsxs("div", { className: cx("wf-repeater", className ?? controller.options.cssClass), children: [controller.evaluationNotice && _jsx("div", { className: "wf-evaluation", role: "note", children: controller.evaluationNotice }), controller.options.allowUserToAddItems && _jsx("button", { type: "button", className: "add", onClick: () => void addItem(), children: "Add item" }), headerTemplate?.(), controller.items.map((item, index) => (_jsxs("div", { className: cx("wf-item", controller.options.itemCssClass, index % 2 === 1 && "alt", index % 2 === 1 && controller.options.alternatingItemCssClass, controller.currentItemIndex === index && "active", controller.editItemIndex === index && !!editItemTemplate && "edit"), onClick: () => void controller.setCurrentItemIndex(index), children: [controller.options.itemHeaderVisible !== false && (_jsxs("header", { className: "wf-item-header", children: [_jsxs("span", { children: ["Item ", index + 1] }), controller.options.allowUserToDeleteItems && (_jsx("button", { type: "button", onClick: (event) => { event.stopPropagation(); void controller.deleteItem(index); }, children: "Delete" }))] })), renderTemplate(item, index), index < controller.items.length - 1 && separatorTemplate?.()] }, String(controller.getDataKey(item, index))))), footerTemplate?.()] }));
}
//# sourceMappingURL=WebFormsRepeater.js.map