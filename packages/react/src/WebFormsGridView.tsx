import { useEffect, useReducer, useState, type ReactNode, type CSSProperties } from "react";
import { GridColumn, GridViewController } from "@wf-controls/core";

/** Joins class names, skipping empty values; returns undefined when nothing remains. */
function cx(...names: Array<string | undefined | false>): string | undefined {
  const joined = names.filter(Boolean).join(" ");
  return joined || undefined;
}

/** Page numbers (1-based) shown in the pager: a window of at most 10 around the current page. */
function pageWindow(pageIndex: number, pageCount: number): number[] {
  const size = Math.min(10, pageCount);
  let first = Math.max(0, pageIndex - Math.floor(size / 2));
  first = Math.min(first, pageCount - size);
  return Array.from({ length: size }, (_, i) => first + i + 1);
}

const visuallyHidden: CSSProperties = {
  position: "absolute", width: 1, height: 1, margin: -1, padding: 0, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0
};

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
  editCellTemplate?: (
    key: string,
    row: T,
    index: number,
    editValues: Partial<T>,
    setEditValue: (field: string, val: unknown) => void,
    save: () => Promise<boolean>,
    cancel: () => Promise<boolean>
  ) => ReactNode;
  editTemplate?: (row: T, index: number, save: (values: Partial<T>) => Promise<boolean>, cancel: () => Promise<boolean>) => ReactNode;
}

export function WebFormsGridView<T extends object>({
  controller,
  className,
  style,
  template,
  editCellTemplate,
  editTemplate
}: WebFormsGridViewProps<T>) {
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  useEffect(() => controller.stateChanged.subscribe(() => refresh()), [controller]);

  const [editRowValues, setEditRowValues] = useState<{ rowIndex: number; values: Record<string, unknown> } | null>(null);

  const columns = controller.options.columns.filter((column) => column.visible !== false);
  const tableClass = className ?? cx(controller.options.cssClass, controller.options.tableCssClass);

  const currentEditIndex = controller.options.editIndex;
  const currentEditValues = (editRowValues && editRowValues.rowIndex === currentEditIndex)
    ? editRowValues.values
    : {};

  const setEditValue = (field: string, val: unknown) => {
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
    if (controller.options.editIndex < 0) setEditRowValues(null);
  });

  const saveEdit = async (rowIndex: number) => {
    const ok = await controller.updateRow(rowIndex, currentEditValues as Partial<T>);
    if (ok) setEditRowValues(null);
    return ok;
  };
  const cancelEdit = () => {
    setEditRowValues(null);
    return controller.cancelEdit();
  };

  const renderCell = (column: GridColumn<T>, row: T, visibleIndex: number) => {
    if (column.type === "template") return template?.(column.key, row, controller.getAbsoluteRowIndex(visibleIndex));
    const value = row[column.dataField];
    return column.format ? column.format(value, row) : String(value ?? "");
  };

  const renderEditCell = (column: GridColumn<T>, row: T, rowIndex: number, visibleIndex: number) => {
    if (editCellTemplate) {
      const customNode = editCellTemplate(
        column.key,
        row,
        rowIndex,
        currentEditValues as Partial<T>,
        setEditValue,
        () => saveEdit(rowIndex),
        cancelEdit
      );
      if (customNode !== undefined && customNode !== null) {
        return customNode;
      }
    }

    if (column.type === "bound") {
      const fieldKey = column.dataField as string;
      const currentVal = currentEditValues[fieldKey] !== undefined
        ? currentEditValues[fieldKey]
        : (row[column.dataField] ?? "");
      return (
        <input
          type="text"
          className="form-control form-control-sm"
          value={String(currentVal ?? "")}
          onChange={(e) => setEditValue(fieldKey, e.target.value)}
        />
      );
    }

    return renderCell(column, row, visibleIndex);
  };

  const o = controller.options;
  const pageCount = controller.pageCount;
  const sort = controller.currentSort;
  const goPage = (e: { preventDefault(): void }, index: number) => {
    e.preventDefault();
    void controller.changePage(index);
  };
  const hasPrev = o.pageIndex > 0;
  const hasNext = o.pageIndex < pageCount - 1;

  return (
    <div className={o.cssClass}>
      <table className={cx(tableClass)} style={style}>
        {o.showHeader && (
          <thead className={o.headerCssClass}>
            <tr className={o.headerCssClass}>
              {columns.map((column) => {
                const sortable = column.type === "bound" && column.sortable && o.allowSorting;
                const sortedHere = column.type === "bound" && sort?.field === column.dataField;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={sortable ? (sortedHere ? (sort?.direction === "desc" ? "descending" : "ascending") : "none") : undefined}
                  >
                    {sortable && column.type === "bound"
                      ? <a href="#" role="button" onClick={(e) => { e.preventDefault(); void controller.sort(column.dataField); }}>{column.headerText}</a>
                      : column.headerText}
                  </th>
                );
              })}
            </tr>
          </thead>
        )}
        <tbody>
          {controller.visibleRows.length === 0 ? (
            <tr className="empty"><td className="empty" colSpan={columns.length}>{o.emptyDataText}</td></tr>
          ) : (
            controller.visibleRows.map((row, visibleIndex) => {
              const rowIndex = controller.getAbsoluteRowIndex(visibleIndex);
              const isEditing = currentEditIndex === rowIndex;

              if (isEditing && editTemplate) {
                return (
                  <tr key={String(controller.getDataKey(row))} className={cx("edit", o.editRowCssClass)} aria-selected={rowIndex === o.selectedIndex || undefined}>
                    <td colSpan={columns.length}>
                      {editTemplate(row, rowIndex, async (values) => {
                        const ok = await controller.updateRow(rowIndex, values);
                        if (ok) setEditRowValues(null);
                        return ok;
                      }, cancelEdit)}
                    </td>
                  </tr>
                );
              }

              const isSelected = rowIndex === o.selectedIndex;
              const rowClass = isEditing
                ? cx("edit", o.editRowCssClass)
                : isSelected
                ? cx("selected", o.selectedRowCssClass)
                : (visibleIndex % 2 === 1 && o.alternatingRowCssClass)
                ? o.alternatingRowCssClass
                : o.rowCssClass;

              return (
                <tr key={String(controller.getDataKey(row))} className={rowClass || undefined} aria-selected={isSelected || undefined}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      {isEditing
                        ? renderEditCell(column, row, rowIndex, visibleIndex)
                        : renderCell(column, row, visibleIndex)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
        {(o.showFooter || o.allowPaging) && (
          <tfoot>
            {o.showFooter && (
              <tr className={cx("footer", o.footerCssClass)}>
                {columns.map((column) => <td key={column.key} />)}
              </tr>
            )}
            {o.allowPaging && (
              <tr className={cx("pager", o.pagerCssClass)}>
                <td colSpan={columns.length}>
                  {hasPrev
                    ? <a href="#" role="button" onClick={(e) => goPage(e, o.pageIndex - 1)}>Previous</a>
                    : <span className="aspNetDisabled">Previous</span>}
                  {pageWindow(o.pageIndex, pageCount).map((n) =>
                    n - 1 === o.pageIndex
                      ? <span key={n} aria-current="page">{n}</span>
                      : <a key={n} href="#" onClick={(e) => goPage(e, n - 1)}>{n}</a>
                  )}
                  {hasNext
                    ? <a href="#" role="button" onClick={(e) => goPage(e, o.pageIndex + 1)}>Next</a>
                    : <span className="aspNetDisabled">Next</span>}
                  <span style={visuallyHidden}>Page {pageCount === 0 ? 0 : o.pageIndex + 1} of {pageCount}</span>
                </td>
              </tr>
            )}
          </tfoot>
        )}
      </table>
    </div>
  );
}
