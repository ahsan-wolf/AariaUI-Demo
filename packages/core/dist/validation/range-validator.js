import { BaseValidatorController } from "./base-validator.js";
import { convert } from "./compare-validator.js";
export class RangeValidatorController extends BaseValidatorController {
    minimumValue;
    maximumValue;
    type;
    constructor(options) {
        super(options);
        this.minimumValue = options.minimumValue;
        this.maximumValue = options.maximumValue;
        this.type = options.type ?? "String";
    }
    evaluateIsValid() {
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
//# sourceMappingURL=range-validator.js.map