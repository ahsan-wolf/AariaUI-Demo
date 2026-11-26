import { BaseValidatorController, type BaseValidatorOptions } from "./base-validator.js";
import { type ValidationDataType } from "./compare-validator.js";
export interface RangeValidatorOptions extends BaseValidatorOptions {
    minimumValue: string | number | Date;
    maximumValue: string | number | Date;
    type?: ValidationDataType | undefined;
}
export declare class RangeValidatorController extends BaseValidatorController {
    minimumValue: string | number | Date;
    maximumValue: string | number | Date;
    type: ValidationDataType;
    constructor(options: RangeValidatorOptions);
    evaluateIsValid(): boolean;
}
