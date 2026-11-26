import React from 'react';
import type { TabsController, TabItem } from '@wf-controls/core';
export interface TabDefinition extends TabItem {
    content?: React.ReactNode | undefined;
}
export interface WebFormsTabsProps {
    controller?: TabsController | undefined;
    tabs?: TabDefinition[] | undefined;
    activeTabIndex?: number | undefined;
    onActiveTabChanged?: ((newIndex: number) => void) | undefined;
    className?: string | undefined;
    children?: React.ReactNode | undefined;
}
export declare const WebFormsTabs: React.FC<WebFormsTabsProps>;
