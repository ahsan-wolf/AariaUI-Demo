import React from 'react';
import type { SiteMapPathController, SiteMapPathItem } from '@wf-controls/core';
export interface BreadcrumbItem {
    text?: string | undefined;
    title?: string | undefined;
    url?: string | undefined;
    navigateUrl?: string | undefined;
}
/**
 * ASP.NET SiteMapPath-faithful markup, compatible with the aspnet-ui-css-kit sheets (`span.nv-<theme>`):
 *
 *   <nav aria-label="breadcrumb" class="wf-breadcrumb">
 *     <span class="{className}"><a>Home</a><span class="sep"></span><span class="current" aria-current="page">Now</span></span>
 *   </nav>
 *
 * The kit's span structure replaced the former Bootstrap `ol.breadcrumb > li` (Bootstrap breadcrumb classes are gone).
 * `className` goes on the inner span (put `nv-modern` etc. there). The separator glyph is drawn by the sheet via
 * `.sep::before`, so the span stays empty; the configured `separator` (or the controller's `pathSeparator`) is
 * exposed on `data-separator` and the span is `aria-hidden`.
 * Provide `controller` (a SiteMapPathController, honoring pathDirection / parentLevelsDisplayed / showToolTips /
 * renderCurrentNodeAsLink through `controller.getItems()`) or plain `items` (the last item is the current page).
 * `controller` wins when both are given.
 */
export interface BreadcrumbProps {
    items?: BreadcrumbItem[] | undefined;
    controller?: SiteMapPathController | undefined;
    separator?: React.ReactNode | undefined;
    className?: string | undefined;
    ariaLabel?: string | undefined;
    onItemClick?: ((item: BreadcrumbItem | SiteMapPathItem) => void) | undefined;
}
export declare const Breadcrumb: React.FC<BreadcrumbProps>;
