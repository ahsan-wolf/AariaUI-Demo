import { BaseValidatorController, type BaseValidatorOptions } from "./base-validator.js";

export interface RegularExpressionValidatorOptions extends BaseValidatorOptions {
  validationExpression: string;
}

export class RegularExpressionValidatorController extends BaseValidatorController {
  validationExpression: string;

  constructor(options: RegularExpressionValidatorOptions) {
    super(options);
    this.validationExpression = options.validationExpression;
  }

  override evaluateIsValid(): boolean {
    const rawVal = this.getControlValue();
    if (rawVal === undefined || rawVal === null) {
      return true;
    }

    const str = String(rawVal);
    if (str.trim() === "") {
      // Empty input passes regex validator (RequiredFieldValidator handles empty)
      return true;
    }

    try {
      // Web Forms implicitly anchors regular expressions
      let pattern = this.validationExpression;
      if (!pattern.startsWith("^") && !pattern.endsWith("$")) {
        pattern = `^(?:${pattern})$`;
      }
      const regex = new RegExp(pattern);
      return regex.test(str);
    } catch {
      return false;
    }
  }
}

