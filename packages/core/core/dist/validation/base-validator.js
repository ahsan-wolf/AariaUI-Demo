import { EventDispatcher } from "../events.js";
import { ValidatorManager } from "./validator-manager.js";
export class BaseValidatorController {
    id;
    controlToValidate;
    errorMessage;
    text;
    validationGroup;
    enabled;
    display;
    setFocusOnError;
    isValid;
    validating = new EventDispatcher();
    validated = new EventDispatcher();
    constructor(options) {
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
    dispose() {
        ValidatorManager.unregister(this);
    }
    getControlValue() {
        return ValidatorManager.getControlValue(this.controlToValidate);
    }
    async validate() {
        if (!this.enabled) {
            this.isValid = true;
            return true;
        }
        await this.validating.emit(this, { validator: this });
        try {
            this.isValid = await this.evaluateIsValid();
        }
        catch {
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
//# sourceMappingURL=base-validator.js.map