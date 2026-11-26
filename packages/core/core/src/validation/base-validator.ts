import { EventDispatcher } from "../events.js";
import { ValidatorManager } from "./validator-manager.js";

export type ValidatorDisplay = "Static" | "Dynamic" | "None";

export interface ValidationEventArgs {
  validator: BaseValidatorController;
  isValid: boolean;
  value: unknown;
}

export interface BaseValidatorOptions {
  id: string;
  controlToValidate: string;
  errorMessage?: string | undefined;
  text?: string | undefined;
  validationGroup?: string | undefined;
  enabled?: boolean | undefined;
  display?: ValidatorDisplay | undefined;
  setFocusOnError?: boolean | undefined;
}

export abstract class BaseValidatorController {
  readonly id: string;
  controlToValidate: string;
  errorMessage: string;
  text: string;
  validationGroup: string;
  enabled: boolean;
  display: ValidatorDisplay;
  setFocusOnError: boolean;
  isValid: boolean;

  readonly validating = new EventDispatcher<this, { validator: BaseValidatorController }>();
  readonly validated = new EventDispatcher<this, ValidationEventArgs>();

  constructor(options: BaseValidatorOptions) {
    this.id = options.id;
    this.controlToValidate = options.controlToValidate;
    this.errorMessage = options.errorMessage ?? "Input is invalid.";
    this.text = options.text ?? this.errorMessage;
    this.validationGroup = options.validationGroup ?? "";
    this.enabled = options.enabled ?? true;
    this.display = options.display ?? "Static";
    this.setFocusOnError = options.setFocusOnError ?? false;
    this.isValid = true;

    // Automatically register with ValidatorManager
    ValidatorManager.register(this);
  }

  dispose(): void {
    ValidatorManager.unregister(this);
  }

  getControlValue(): unknown {
    return ValidatorManager.getControlValue(this.controlToValidate);
  }

  abstract evaluateIsValid(): boolean | Promise<boolean>;

  async validate(): Promise<boolean> {
    if (!this.enabled) {
      this.isValid = true;
      return true;
    }

    await this.validating.emit(this, { validator: this });

    try {
      this.isValid = await this.evaluateIsValid();
    } catch {
      this.isValid = false;
    }

    const value = this.getControlValue();
    await this.validated.emit(this, {
      validator: this,
      isValid: this.isValid,
      value
    });

    return this.isValid;
  }
}

