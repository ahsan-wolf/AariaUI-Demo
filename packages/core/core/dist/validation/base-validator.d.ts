import { EventDispatcher } from "../events.js";
export type ValidatorDisplay = "Static" | "Dynamic" | "None";
export interface ValidationEventArgs {
    validator: BaseValidatorController;
    isValid: boolean;
    value: unknown;
}
export interface BaseValidatorOptions {
    id: string;
    controlToValidate: string;
    errorMessage?: string | undefined;
    text?: string | undefined;
    validationGroup?: string | undefined;
    enabled?: boolean | undefined;
    display?: ValidatorDisplay | undefined;
    setFocusOnError?: boolean | undefined;
}
export declare abstract class BaseValidatorController {
    readonly id: string;
    controlToValidate: string;
    errorMessage: string;
    text: string;
    validationGroup: string;
    enabled: boolean;
    display: ValidatorDisplay;
    setFocusOnError: boolean;
    isValid: boolean;
    readonly validating: EventDispatcher<this, {
        validator: BaseValidatorController;
    }>;
    readonly validated: EventDispatcher<this, ValidationEventArgs>;
    constructor(options: BaseValidatorOptions);
    dispose(): void;
    getControlValue(): unknown;
    abstract evaluateIsValid(): boolean | Promise<boolean>;
    validate(): Promise<boolean>;
}
