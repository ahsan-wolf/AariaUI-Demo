import { BaseValidatorController, type BaseValidatorOptions } from "./base-validator.js";
export interface ServerValidateEventArgs {
    value: string;
    isValid: boolean;
}
export type ClientValidationFunction = (source: CustomValidatorController, args: ServerValidateEventArgs) => boolean | void | undefined;
export type ServerValidateFunction = (source: CustomValidatorController, args: ServerValidateEventArgs) => Promise<boolean | void> | boolean | void;
export interface CustomValidatorOptions extends BaseValidatorOptions {
    clientValidationFunction?: ClientValidationFunction | undefined;
    serverValidate?: ServerValidateFunction | undefined;
    validateEmptyText?: boolean | undefined;
}
export declare class CustomValidatorController extends BaseValidatorController {
    clientValidationFunction?: ClientValidationFunction | undefined;
    serverValidate?: ServerValidateFunction | undefined;
    validateEmptyText: boolean;
    constructor(options: CustomValidatorOptions);
    evaluateIsValid(): Promise<boolean>;
}
