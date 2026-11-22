import { EventDispatcher } from "../events.js";

export interface ModalBehaviorOptions {
  id?: string;
  targetControlId?: string;
  popupControlId?: string;
  okControlId?: string;
  cancelControlId?: string;
  backgroundCssClass?: string;
  dropShadow?: boolean;
  onOk?: () => Promise<void> | void;
  onCancel?: () => void;
}

export class ModalBehavior {
  private _isOpen = false;
  readonly shown = new EventDispatcher<this, void>();
  readonly hidden = new EventDispatcher<this, void>();
  readonly ok = new EventDispatcher<this, void>();
  readonly cancel = new EventDispatcher<this, void>();

  constructor(public options: ModalBehaviorOptions = {}) {}

  get isOpen(): boolean {
    return this._isOpen;
  }

  async show(): Promise<void> {
    if (!this._isOpen) {
      this._isOpen = true;
      await this.shown.emit(this, undefined);
    }
  }

  async hide(): Promise<void> {
    if (this._isOpen) {
      this._isOpen = false;
      await this.hidden.emit(this, undefined);
    }
  }

  async handleOk(): Promise<void> {
    if (this.options.onOk) {
      await this.options.onOk();
    }
    await this.ok.emit(this, undefined);
    await this.hide();
  }

  async handleCancel(): Promise<void> {
    if (this.options.onCancel) {
      this.options.onCancel();
    }
    await this.cancel.emit(this, undefined);
    await this.hide();
  }
}
