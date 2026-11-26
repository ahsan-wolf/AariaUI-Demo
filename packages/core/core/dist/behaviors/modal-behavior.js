import { EventDispatcher } from "../events.js";
export class ModalBehavior {
    options;
    _isOpen = false;
    shown = new EventDispatcher();
    hidden = new EventDispatcher();
    ok = new EventDispatcher();
    cancel = new EventDispatcher();
    constructor(options = {}) {
        this.options = options;
    }
    get isOpen() {
        return this._isOpen;
    }
    async show() {
        if (!this._isOpen) {
            this._isOpen = true;
            await this.shown.emit(this, undefined);
        }
    }
    async hide() {
        if (this._isOpen) {
            this._isOpen = false;
            await this.hidden.emit(this, undefined);
        }
    }
    async handleOk() {
        if (this.options.onOk) {
            await this.options.onOk();
        }
        await this.ok.emit(this, undefined);
        await this.hide();
    }
    async handleCancel() {
        if (this.options.onCancel) {
            this.options.onCancel();
        }
        await this.cancel.emit(this, undefined);
        await this.hide();
    }
}
//# sourceMappingURL=modal-behavior.js.map