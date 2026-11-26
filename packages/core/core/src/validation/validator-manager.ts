import type { BaseValidatorController } from "./base-validator.js";

export type ControlValueAccessor = () => unknown;
export type GlobalValueResolver = (controlId: string) => unknown;

export class ValidatorManager {
  private static readonly validators = new Set<BaseValidatorController>();
  private static readonly accessors = new Map<string, ControlValueAccessor>();
  static globalValueResolver?: GlobalValueResolver | undefined;

  static register(validator: BaseValidatorController): void {
    this.validators.add(validator);
  }

  static unregister(validator: BaseValidatorController): void {
    this.validators.delete(validator);
  }

  static registerValueAccessor(controlId: string, accessor: ControlValueAccessor): () => void {
    this.accessors.set(controlId, accessor);
    return () => {
      this.accessors.delete(controlId);
    };
  }

  static getControlValue(controlId: string): unknown {
    const accessor = this.accessors.get(controlId);
    if (accessor) {
      return accessor();
    }

    if (this.globalValueResolver) {
      const val = this.globalValueResolver(controlId);
      if (val !== undefined) return val;
    }

    // Browser DOM fallback
    if (typeof document !== "undefined") {
      const el = document.getElementById(controlId) || document.querySelector(`[name="${controlId}"]`);
      if (el) {
        if ("type" in el && (el as HTMLInputElement).type === "checkbox") {
          return (el as HTMLInputElement).checked;
        }
        if ("value" in el) {
          return (el as HTMLInputElement).value;
        }
      }
    }

    return "";
  }

  static getValidators(validationGroup?: string | undefined): BaseValidatorController[] {
    const targetGroup = validationGroup ?? "";
    const list: BaseValidatorController[] = [];
    for (const v of this.validators) {
      if (v.validationGroup === targetGroup) {
        list.push(v);
      }
    }
    return list;
  }

  static getInvalidValidators(validationGroup?: string | undefined): BaseValidatorController[] {
    return this.getValidators(validationGroup).filter((v) => !v.isValid);
  }

  static async validate(validationGroup?: string | undefined): Promise<boolean> {
    const matching = this.getValidators(validationGroup);
    let allValid = true;

    for (const validator of matching) {
      const valid = await validator.validate();
      if (!valid) {
        allValid = false;
      }
    }

    return allValid;
  }

  static isValid(validationGroup?: string | undefined): boolean {
    const matching = this.getValidators(validationGroup);
    return matching.every((v) => v.isValid);
  }

  static reset(validationGroup?: string | undefined): void {
    const matching = this.getValidators(validationGroup);
    for (const v of matching) {
      v.isValid = true;
    }
  }

  static clear(): void {
    this.validators.clear();
    this.accessors.clear();
    this.globalValueResolver = undefined;
  }
}

