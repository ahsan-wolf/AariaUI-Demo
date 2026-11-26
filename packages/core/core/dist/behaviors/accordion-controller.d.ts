import { EventDispatcher } from "../events.js";
export interface AccordionPaneItem {
    id: string;
    headerText: string;
}
export interface AccordionOptions {
    selectedIndex?: number;
    panes?: AccordionPaneItem[];
}
export declare class AccordionController {
    private _selectedIndex;
    private _panes;
    readonly selectionChanged: EventDispatcher<this, {
        selectedIndex: number;
    }>;
    constructor(options?: AccordionOptions);
    get selectedIndex(): number;
    get panes(): readonly AccordionPaneItem[];
    setPanes(panes: AccordionPaneItem[]): void;
    setSelectedIndex(index: number): Promise<void>;
    togglePane(index: number): Promise<void>;
}
