import { BaseValidatorController, type BaseValidatorOptions } from "./base-validator.js";
export interface RegularExpressionValidatorOptions extends BaseValidatorOptions {
    validationExpression: string;
}
export declare class RegularExpressionValidatorController extends BaseValidatorController {
    validationExpression: string;
    constructor(options: RegularExpressionValidatorOptions);
    evaluateIsValid(): boolean;
}
