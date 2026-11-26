import { type ReactNode } from "react";
import { RepeaterController } from "@wf-controls/pro-data";
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
export declare function WebFormsRepeater<T extends object>({ controller, className, createItem, editItemTemplate, headerTemplate, itemTemplate, alternatingItemTemplate, separatorTemplate, footerTemplate, emptyTemplate }: WebFormsRepeaterProps<T>): import("react").JSX.Element | null;
