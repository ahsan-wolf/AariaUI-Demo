import { EventDispatcher } from "../events.js";
export class AccordionController {
    _selectedIndex;
    _panes = [];
    selectionChanged = new EventDispatcher();
    constructor(options = {}) {
        this._selectedIndex = options.selectedIndex ?? 0;
        this._panes = options.panes ?? [];
    }
    get selectedIndex() {
        return this._selectedIndex;
    }
    get panes() {
        return this._panes;
    }
    setPanes(panes) {
        this._panes = [...panes];
    }
    async setSelectedIndex(index) {
        if (this._selectedIndex !== index) {
            this._selectedIndex = index;
            await this.selectionChanged.emit(this, { selectedIndex: index });
        }
    }
    async togglePane(index) {
        const target = this._selectedIndex === index ? -1 : index;
        await this.setSelectedIndex(target);
    }
}
//# sourceMappingURL=accordion-controller.js.map