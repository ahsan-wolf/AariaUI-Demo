import { BaseValidatorController, type BaseValidatorOptions } from "./base-validator.js";
export interface RequiredFieldValidatorOptions extends BaseValidatorOptions {
    initialValue?: string | undefined;
}
export declare class RequiredFieldValidatorController extends BaseValidatorController {
    initialValue: string;
    constructor(options: RequiredFieldValidatorOptions);
    evaluateIsValid(): boolean;
}
