import { type ReactNode } from "react";
import { DataListController } from "@wf-controls/pro-data";
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
export declare function WebFormsDataList<T extends object>({ controller, className, headerTemplate, footerTemplate, itemTemplate, alternatingItemTemplate, selectedItemTemplate, editItemTemplate, separatorTemplate, emptyTemplate }: WebFormsDataListProps<T>): import("react").JSX.Element;
