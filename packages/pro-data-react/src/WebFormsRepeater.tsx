import { useEffect, useReducer, type ReactNode } from "react";
import { RepeaterController } from "@wf-controls/pro-data";

/** Joins class names, skipping empty values; returns undefined when nothing remains. */
function cx(...names: Array<string | undefined | false>): string | undefined {
  const joined = names.filter(Boolean).join(" ");
  return joined || undefined;
}

/**
 * Repeater adapter. Markup hooks for the CSS kit (`rp-<theme>`):
 * - root `div.wf-repeater.<className ?? options.cssClass>`
 * - each item `div.wf-item.<itemCssClass>`; odd items add `alt` + `alternatingItemCssClass`; the current item adds
 *   `active`; the item rendered through `editItemTemplate` adds `edit`
 * - item header `header.wf-item-header` (when `itemHeaderVisible !== false`)
 * - "Add item" button `button.add`; default empty message `div.empty`
 */
export interface WebFormsRepeaterProps<T extends object> {
  controller: RepeaterController<T>;
  className?: string;
  createItem?: () => T | Promise<T>;
  editItemTemplate?: (item: T, index: number, save: (values: Partial<T>) => Promise<boolean>, cancel: () => Promise<boolean>) => ReactNode;
  headerTemplate?: () => ReactNode;
  itemTemplate: (item: T, index: number, command: (name: string, argument?: unknown) => Promise<void>) => ReactNode;
  alternatingItemTemplate?: (item: T, index: number, command: (name: string, argument?: unknown) => Promise<void>) => ReactNode;
  separatorTemplate?: () => ReactNode;
  footerTemplate?: () => ReactNode;
  emptyTemplate?: () => ReactNode;
}

export function WebFormsRepeater<T extends object>({
  controller,
  className,
  createItem,
  editItemTemplate,
  headerTemplate,
  itemTemplate,
  alternatingItemTemplate,
  separatorTemplate,
  footerTemplate,
  emptyTemplate
}: WebFormsRepeaterProps<T>) {
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  useEffect(() => controller.stateChanged.subscribe(() => refresh()), [controller]);

  const addItem = async () => {
    if (createItem) await controller.addItem(await createItem());
  };

  if (controller.isResetting) return null;
  if (!controller.items.length) return <>{emptyTemplate?.() ?? <div className="empty">{controller.options.emptyText ?? "No records found."}</div>}</>;

  const renderTemplate = (item: T, index: number) => {
    if (controller.editItemIndex === index && editItemTemplate) {
      return editItemTemplate(item, index, (values) => controller.updateItem(index, values), () => controller.cancelEdit());
    }
    if (index % 2 === 1 && alternatingItemTemplate) {
      return alternatingItemTemplate(item, index, (name, argument) => controller.executeCommand(index, name, argument));
    }
    return itemTemplate(item, index, (name, argument) => controller.executeCommand(index, name, argument));
  };

  return (
    <div className={cx("wf-repeater", className ?? controller.options.cssClass)}>
      {controller.evaluationNotice && <div className="wf-evaluation" role="note">{controller.evaluationNotice}</div>}
      {controller.options.allowUserToAddItems && <button type="button" className="add" onClick={() => void addItem()}>Add item</button>}
      {headerTemplate?.()}
      {controller.items.map((item, index) => (
        <div
          key={String(controller.getDataKey(item, index))}
          className={cx(
            "wf-item",
            controller.options.itemCssClass,
            index % 2 === 1 && "alt",
            index % 2 === 1 && controller.options.alternatingItemCssClass,
            controller.currentItemIndex === index && "active",
            controller.editItemIndex === index && !!editItemTemplate && "edit"
          )}
          onClick={() => void controller.setCurrentItemIndex(index)}
        >
          {controller.options.itemHeaderVisible !== false && (
            <header className="wf-item-header">
              <span>Item {index + 1}</span>
              {controller.options.allowUserToDeleteItems && (
                <button type="button" onClick={(event) => { event.stopPropagation(); void controller.deleteItem(index); }}>
                  Delete
                </button>
              )}
            </header>
          )}
          {renderTemplate(item, index)}
          {index < controller.items.length - 1 && separatorTemplate?.()}
        </div>
      ))}
      {footerTemplate?.()}
    </div>
  );
}