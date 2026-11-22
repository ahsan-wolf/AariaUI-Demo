import { BaseValidatorController, type BaseValidatorOptions } from "./base-validator.js";
import { ValidatorManager } from "./validator-manager.js";

export type ValidationCompareOperator =
  | "Equal"
  | "NotEqual"
  | "GreaterThan"
  | "GreaterThanEqual"
  | "LessThan"
  | "LessThanEqual"
  | "DataTypeCheck";

export type ValidationDataType = "String" | "Integer" | "Double" | "Date" | "Currency";

export interface CompareValidatorOptions extends BaseValidatorOptions {
  controlToCompare?: string | undefined;
  valueToCompare?: string | undefined;
  operator?: ValidationCompareOperator | undefined;
  type?: ValidationDataType | undefined;
}

export class CompareValidatorController extends BaseValidatorController {
  controlToCompare?: string | undefined;
  valueToCompare?: string | undefined;
  operator: ValidationCompareOperator;
  type: ValidationDataType;

  constructor(options: CompareValidatorOptions) {
    super(options);
    this.controlToCompare = options.controlToCompare;
    this.valueToCompare = options.valueToCompare;
    this.operator = options.operator ?? "Equal";
    this.type = options.type ?? "String";
  }

  override evaluateIsValid(): boolean {
    const rawVal = this.getControlValue();
    if (rawVal === undefined || rawVal === null || String(rawVal).trim() === "") {
      // In Web Forms, empty input passes CompareValidator (RequiredFieldValidator handles empty)
      return true;
    }

    if (this.operator === "DataTypeCheck") {
      return canConvert(rawVal, this.type);
    }

    let compareVal: unknown = this.valueToCompare;
    if (this.controlToCompare) {
      compareVal = ValidatorManager.getControlValue(this.controlToCompare);
    }

    if (compareVal === undefined || compareVal === null || String(compareVal).trim() === "") {
      return true;
    }

    const valA = convert(rawVal, this.type);
    const valB = convert(compareVal, this.type);

    if (valA === null || valB === null) {
      return false;
    }

    switch (this.operator) {
      case "Equal":
        return valA === valB;
      case "NotEqual":
        return valA !== valB;
      case "GreaterThan":
        return valA > valB;
      case "GreaterThanEqual":
        return valA >= valB;
      case "LessThan":
        return valA < valB;
      case "LessThanEqual":
        return valA <= valB;
      default:
        return false;
    }
  }
}

export function canConvert(val: unknown, type: ValidationDataType): boolean {
  return convert(val, type) !== null;
}

export function convert(val: unknown, type: ValidationDataType): string | number | null {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  if (str === "") return null;

  switch (type) {
    case "Integer": {
      const parsed = parseInt(str, 10);
      return !isNaN(parsed) && String(parsed) === str ? parsed : null;
    }
    case "Double": {
      const parsed = parseFloat(str);
      return !isNaN(parsed) ? parsed : null;
    }
    case "Currency": {
      const clean = str.replace(/^[$\xA3\u20AC]/, "").replace(/,/g, "");
      const parsed = parseFloat(clean);
      return !isNaN(parsed) ? parsed : null;
    }
    case "Date": {
      const d = val instanceof Date ? val : new Date(str);
      return !isNaN(d.getTime()) ? d.getTime() : null;
    }
    case "String":
    default:
      return str;
  }
}

