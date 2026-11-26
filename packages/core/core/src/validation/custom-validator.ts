import { BaseValidatorController, type BaseValidatorOptions } from "./base-validator.js";

export interface ServerValidateEventArgs {
  value: string;
  isValid: boolean;
}

export type ClientValidationFunction = (
  source: CustomValidatorController,
  args: ServerValidateEventArgs
) => boolean | void | undefined;

export type ServerValidateFunction = (
  source: CustomValidatorController,
  args: ServerValidateEventArgs
) => Promise<boolean | void> | boolean | void;

export interface CustomValidatorOptions extends BaseValidatorOptions {
  clientValidationFunction?: ClientValidationFunction | undefined;
  serverValidate?: ServerValidateFunction | undefined;
  validateEmptyText?: boolean | undefined;
}

export class CustomValidatorController extends BaseValidatorController {
  clientValidationFunction?: ClientValidationFunction | undefined;
  serverValidate?: ServerValidateFunction | undefined;
  validateEmptyText: boolean;

  constructor(options: CustomValidatorOptions) {
    super(options);
    this.clientValidationFunction = options.clientValidationFunction;
    this.serverValidate = options.serverValidate;
    this.validateEmptyText = options.validateEmptyText ?? false;
  }

  override async evaluateIsValid(): Promise<boolean> {
    const rawVal = this.getControlValue();
    const str = rawVal !== undefined && rawVal !== null ? String(rawVal) : "";

    if (!this.validateEmptyText && str.trim() === "") {
      return true;
    }

    const args: ServerValidateEventArgs = {
      value: str,
      isValid: true
    };

    if (this.clientValidationFunction) {
      const res = this.clientValidationFunction(this, args);
      if (typeof res === "boolean") {
        args.isValid = res;
      }
      if (!args.isValid) {
        return false;
      }
    }

    if (this.serverValidate) {
      const res = await this.serverValidate(this, args);
      if (typeof res === "boolean") {
        args.isValid = res;
      }
      if (!args.isValid) {
        return false;
      }
    }

    return args.isValid;
  }
}

