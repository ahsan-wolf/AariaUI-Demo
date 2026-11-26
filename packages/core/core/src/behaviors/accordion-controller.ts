import { EventDispatcher } from "../events.js";

export interface AccordionPaneItem {
  id: string;
  headerText: string;
}

export interface AccordionOptions {
  selectedIndex?: number;
  panes?: AccordionPaneItem[];
}

export class AccordionController {
  private _selectedIndex: number;
  private _panes: AccordionPaneItem[] = [];
  readonly selectionChanged = new EventDispatcher<this, { selectedIndex: number }>();

  constructor(options: AccordionOptions = {}) {
    this._selectedIndex = options.selectedIndex ?? 0;
    this._panes = options.panes ?? [];
  }

  get selectedIndex(): number {
    return this._selectedIndex;
  }

  get panes(): readonly AccordionPaneItem[] {
    return this._panes;
  }

  setPanes(panes: AccordionPaneItem[]): void {
    this._panes = [...panes];
  }

  async setSelectedIndex(index: number): Promise<void> {
    if (this._selectedIndex !== index) {
      this._selectedIndex = index;
      await this.selectionChanged.emit(this, { selectedIndex: index });
    }
  }

  async togglePane(index: number): Promise<void> {
    const target = this._selectedIndex === index ? -1 : index;
    await this.setSelectedIndex(target);
  }
}
