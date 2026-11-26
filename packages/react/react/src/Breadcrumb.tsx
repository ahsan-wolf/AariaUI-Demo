import React, { useEffect, useReducer } from 'react';
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

interface Crumb {
  text: string;
  title: string | undefined;
  href: string | undefined;
  current: boolean;
  source: BreadcrumbItem | SiteMapPathItem;
}

const DEFAULT_ITEMS: BreadcrumbItem[] = [
  { text: 'Home', url: '/' },
  { text: 'Section', url: '#' },
  { text: 'Current Page' }
];

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items = DEFAULT_ITEMS,
  controller,
  separator,
  className = '',
  ariaLabel = 'breadcrumb',
  onItemClick
}) => {
  const [, refresh] = useReducer((n: number) => n + 1, 0);
  useEffect(() => (controller ? controller.stateChanged.subscribe(() => refresh()) : undefined), [controller]);

  let crumbs: Crumb[];
  if (controller) {
    crumbs = controller.getItems().map(item => ({
      text: item.text,
      title: controller.showToolTips ? item.node.description || undefined : undefined,
      href: item.isLink && item.url ? item.url : undefined,
      current: item.itemType === 'Current',
      source: item
    }));
  } else {
    crumbs = items.map((item, idx) => ({
      text: item.text ?? item.title ?? `Page ${idx + 1}`,
      title: item.title && item.text ? item.title : undefined,
      href: item.url ?? item.navigateUrl,
      current: idx === items.length - 1,
      source: item
    }));
  }

  const sepValue =
    typeof separator === 'string' || typeof separator === 'number'
      ? String(separator)
      : controller
        ? controller.pathSeparator
        : ' / ';

  const elements: React.ReactNode[] = [];
  crumbs.forEach((crumb, idx) => {
    if (idx > 0) {
      elements.push(<span key={`sep${idx}`} className="sep" aria-hidden="true" data-separator={sepValue}></span>);
    }
    if (crumb.href && (!crumb.current || controller)) {
      elements.push(
        <a
          key={idx}
          href={crumb.href}
          className={crumb.current ? 'current' : undefined}
          aria-current={crumb.current ? 'page' : undefined}
          title={crumb.title}
          onClick={e => {
            if (onItemClick) {
              e.preventDefault();
              onItemClick(crumb.source);
            }
          }}
        >
          {crumb.text}
        </a>
      );
    } else {
      elements.push(
        <span key={idx} className={crumb.current ? 'current' : undefined} aria-current={crumb.current ? 'page' : undefined} title={crumb.title}>
          {crumb.text}
        </span>
      );
    }
  });

  return (
    <nav aria-label={ariaLabel} className="wf-breadcrumb">
      <span className={className || undefined}>{elements}</span>
    </nav>
  );
};
