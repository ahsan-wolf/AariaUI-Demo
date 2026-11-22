import { BaseValidatorController, type BaseValidatorOptions } from "./base-validator.js";

export interface RequiredFieldValidatorOptions extends BaseValidatorOptions {
  initialValue?: string | undefined;
}

export class RequiredFieldValidatorController extends BaseValidatorController {
  initialValue: string;

  constructor(options: RequiredFieldValidatorOptions) {
    super(options);
    this.initialValue = options.initialValue ?? "";
    if (!options.errorMessage && !options.text) {
      this.errorMessage = "This field is required.";
      this.text = this.errorMessage;
    }
  }

  override evaluateIsValid(): boolean {
    const raw = this.getControlValue();
    if (raw === undefined || raw === null) {
      return false;
    }

    if (typeof raw === "boolean") {
      return raw;
    }

    const str = String(raw).trim();
    const init = this.initialValue.trim();

    return str !== init && str.length > 0;
  }
}

