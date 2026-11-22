import { BaseValidatorController } from "./base-validator.js";
export class CustomValidatorController extends BaseValidatorController {
    clientValidationFunction;
    serverValidate;
    validateEmptyText;
    constructor(options) {
        super(options);
        this.clientValidationFunction = options.clientValidationFunction;
        this.serverValidate = options.serverValidate;
        this.validateEmptyText = options.validateEmptyText ?? false;
    }
    async evaluateIsValid() {
        const rawVal = this.getControlValue();
        const str = rawVal !== undefined && rawVal !== null ? String(rawVal) : "";
        if (!this.validateEmptyText && str.trim() === "") {
            return true;
        }
        const args = {
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
//# sourceMappingURL=custom-validator.js.map