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
export declare class ModalBehavior {
    options: ModalBehaviorOptions;
    private _isOpen;
    readonly shown: EventDispatcher<this, void>;
    readonly hidden: EventDispatcher<this, void>;
    readonly ok: EventDispatcher<this, void>;
    readonly cancel: EventDispatcher<this, void>;
    constructor(options?: ModalBehaviorOptions);
    get isOpen(): boolean;
    show(): Promise<void>;
    hide(): Promise<void>;
    handleOk(): Promise<void>;
    handleCancel(): Promise<void>;
}
