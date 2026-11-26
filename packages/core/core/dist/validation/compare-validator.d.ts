import { BaseValidatorController, type BaseValidatorOptions } from "./base-validator.js";
export type ValidationCompareOperator = "Equal" | "NotEqual" | "GreaterThan" | "GreaterThanEqual" | "LessThan" | "LessThanEqual" | "DataTypeCheck";
export type ValidationDataType = "String" | "Integer" | "Double" | "Date" | "Currency";
export interface CompareValidatorOptions extends BaseValidatorOptions {
    controlToCompare?: string | undefined;
    valueToCompare?: string | undefined;
    operator?: ValidationCompareOperator | undefined;
    type?: ValidationDataType | undefined;
}
export declare class CompareValidatorController extends BaseValidatorController {
    controlToCompare?: string | undefined;
    valueToCompare?: string | undefined;
    operator: ValidationCompareOperator;
    type: ValidationDataType;
    constructor(options: CompareValidatorOptions);
    evaluateIsValid(): boolean;
}
export declare function canConvert(val: unknown, type: ValidationDataType): boolean;
export declare function convert(val: unknown, type: ValidationDataType): string | number | null;
