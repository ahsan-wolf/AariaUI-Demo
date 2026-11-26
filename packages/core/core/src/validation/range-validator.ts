import { BaseValidatorController, type BaseValidatorOptions } from "./base-validator.js";
import { convert, type ValidationDataType } from "./compare-validator.js";

export interface RangeValidatorOptions extends BaseValidatorOptions {
  minimumValue: string | number | Date;
  maximumValue: string | number | Date;
  type?: ValidationDataType | undefined;
}

export class RangeValidatorController extends BaseValidatorController {
  minimumValue: string | number | Date;
  maximumValue: string | number | Date;
  type: ValidationDataType;

  constructor(options: RangeValidatorOptions) {
    super(options);
    this.minimumValue = options.minimumValue;
    this.maximumValue = options.maximumValue;
    this.type = options.type ?? "String";
  }

  override evaluateIsValid(): boolean {
    const rawVal = this.getControlValue();
    if (rawVal === undefined || rawVal === null || String(rawVal).trim() === "") {
      // Empty input passes RangeValidator (RequiredFieldValidator handles empty)
      return true;
    }

    const val = convert(rawVal, this.type);
    const min = convert(this.minimumValue, this.type);
    const max = convert(this.maximumValue, this.type);

    if (val === null || min === null || max === null) {
      return false;
    }

    return val >= min && val <= max;
  }
}

