import React from 'react';
import type { MenuController, MenuItem } from '@wf-controls/core';
export interface NavigationMenuProps {
    items?: MenuItem[] | Array<{
        text: string;
        value?: string;
        navigateUrl?: string;
        childItems?: any[];
    }> | undefined;
    /** Optional MenuController; when given it wins over `items` (orientation, flyout levels and disappearAfter come from it). */
    controller?: MenuController | undefined;
    orientation?: 'horizontal' | 'vertical' | undefined;
    /** Extra class(es) for the root element, e.g. the kit theme "mn-modern". "mn-vertical" is added automatically when vertical. */
    className?: string | undefined;
    ariaLabel?: string | undefined;
    onItemClick?: ((item: any) => void) | undefined;
}
export declare const NavigationMenu: React.FC<NavigationMenuProps>;
