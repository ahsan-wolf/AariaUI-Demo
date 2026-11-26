import { type ReactNode, type CSSProperties } from "react";
import { GridViewController } from "@wf-controls/pro-data";
/**
 * ASP.NET-faithful GridView markup, compatible with the aspnet-ui-css-kit sheets (`table.gv-<theme>`).
 * - The `<table>` carries `className` (or `tableCssClass` / `cssClass`); the wrapper div carries `cssClass`.
 * - Row classes: edit > selected > alternating > row. The kit defaults `edit`, `selected`, `footer`,
 *   `pager` and `empty` are always present; user classes are appended.
 * - The row hosting the edit UI always has `tr.edit` (+ `editRowCssClass`), whether it is the in-place edit
 *   row (default inputs / `editCellTemplate`) or the single-cell `editTemplate` row (`td[colspan]`); both
 *   carry `aria-selected` when they are the selected row.
 * - Sortable headers are `<a href="#" role="button">`; `th` gets `aria-sort`.
 * - The pager is the last row of a `<tfoot>` (`tr.pager`) whenever `allowPaging` is on: Previous,
 *   numbered links (`<a>`, current page is a `<span>`), Next (disabled ones are `span.aspNetDisabled`),
 *   plus a visually hidden "Page X of Y" for assistive tech.
 * - `showFooter` renders `tr.footer` in the `<tfoot>` before the pager row.
 */
export interface WebFormsGridViewProps<T extends object> {
    controller: GridViewController<T>;
    className?: string;
    style?: CSSProperties;
    template?: (key: string, row: T, index: number) => ReactNode;
    editCellTemplate?: (key: string, row: T, index: number, editValues: Partial<T>, setEditValue: (field: string, val: unknown) => void, save: () => Promise<boolean>, cancel: () => Promise<boolean>) => ReactNode;
    editTemplate?: (row: T, index: number, save: (values: Partial<T>) => Promise<boolean>, cancel: () => Promise<boolean>) => ReactNode;
}
export declare function WebFormsGridView<T extends object>({ controller, className, style, template, editCellTemplate, editTemplate }: WebFormsGridViewProps<T>): import("react").JSX.Element;
