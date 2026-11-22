import { BaseValidatorController } from "./base-validator.js";
export class RequiredFieldValidatorController extends BaseValidatorController {
    initialValue;
    constructor(options) {
        super(options);
        this.initialValue = options.initialValue ?? "";
        if (!options.errorMessage && !options.text) {
            this.errorMessage = "This field is required.";
            this.text = this.errorMessage;
        }
    }
    evaluateIsValid() {
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
//# sourceMappingURL=required-field-validator.js.map