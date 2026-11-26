import { useEffect, useReducer, type ReactNode } from "react";
import { DataListController, DataListItem } from "@wf-controls/pro-data";

/** Semantic hook class for an item type: alt, selected, edit, header, footer, separator (none for plain Item). */
function semanticClass(itemType: string): string {
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

function join(...names: Array<string | undefined>): string | undefined {
  const joined = names.filter(Boolean).join(" ");
  return joined || undefined;
}

/**
 * DataList adapter. Markup hooks for the CSS kit (`dl-<theme>`):
 * - Flow: root `div.wf-datalist.<className>`; items `div.datalist-item.datalist-<type>` plus `alt` / `selected` / `edit`
 *   (`header` / `footer` / `separator` for those item types)
 * - Table: wrapper `div.<className>` and `table.datalist-table.wf-datalist.<className>`; cells
 *   `td.datalist-cell.datalist-<type>` plus the same semantic class
 * - empty state: `p.empty`
 */
export interface WebFormsDataListProps<T extends object> {
  controller: DataListController<T>;
  className?: string;
  headerTemplate?: () => ReactNode;
  footerTemplate?: () => ReactNode;
  itemTemplate: (item: T, index: number, command: (name: string, argument?: unknown) => Promise<void>) => ReactNode;
  alternatingItemTemplate?: (item: T, index: number, command: (name: string, argument?: unknown) => Promise<void>) => ReactNode;
  selectedItemTemplate?: (item: T, index: number, command: (name: string, argument?: unknown) => Promise<void>) => ReactNode;
  editItemTemplate?: (item: T, index: number, save: (values: Partial<T>) => Promise<boolean>, cancel: () => Promise<boolean>) => ReactNode;
  separatorTemplate?: () => ReactNode;
  emptyTemplate?: () => ReactNode;
}

export function WebFormsDataList<T extends object>({
  controller,
  className,
  headerTemplate,
  footerTemplate,
  itemTemplate,
  alternatingItemTemplate,
  selectedItemTemplate,
  editItemTemplate,
  separatorTemplate,
  emptyTemplate
}: WebFormsDataListProps<T>) {
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  useEffect(() => controller.stateChanged.subscribe(() => refresh()), [controller]);

  if (!controller.itemCount) {
    return <>{emptyTemplate?.() ?? <p className="empty">{controller.emptyText}</p>}</>;
  }

  const renderItemContent = (item: DataListItem<T>) => {
    const { dataItem, itemIndex, itemType } = item;
    if (itemType === "EditItem" && editItemTemplate) {
      return editItemTemplate(
        dataItem,
        itemIndex,
        (values) => controller.updateItem(itemIndex, values),
        () => controller.cancelEdit()
      );
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
    return (
      <div className={join("wf-datalist", className)}>
        {controller.evaluationNotice && <div className="wf-evaluation" role="note">{controller.evaluationNotice}</div>}
        {controller.showHeader && headerTemplate?.()}
        {controller.items.map((item, idx) => (
          <div key={idx} className={join("datalist-item", `datalist-${item.itemType.toLowerCase()}`, semanticClass(item.itemType))}>
            {renderItemContent(item)}
            {idx < controller.items.length - 1 && separatorTemplate?.()}
          </div>
        ))}
        {controller.showFooter && footerTemplate?.()}
      </div>
    );
  }

  return (
    <div className={className}>
      {controller.evaluationNotice && <div className="wf-evaluation" role="note">{controller.evaluationNotice}</div>}
      <table className={join("datalist-table", "wf-datalist", className)}border={controller.showTableBorder ? 1 : 0}>
        {controller.showHeader && headerTemplate && (
          <thead>
            <tr>
              <th colSpan={controller.repeatColumns || 1}>{headerTemplate()}</th>
            </tr>
          </thead>
        )}
        <tbody>
          {matrix.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} className={cell ? join("datalist-cell", `datalist-${cell.itemType.toLowerCase()}`, semanticClass(cell.itemType)) : "datalist-cell-empty"}>
                  {cell ? renderItemContent(cell) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {controller.showFooter && footerTemplate && (
          <tfoot>
            <tr>
              <td colSpan={controller.repeatColumns || 1}>{footerTemplate()}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

