export class ValidatorManager {
    static validators = new Set();
    static accessors = new Map();
    static globalValueResolver;
    static register(validator) {
        this.validators.add(validator);
    }
    static unregister(validator) {
        this.validators.delete(validator);
    }
    static registerValueAccessor(controlId, accessor) {
        this.accessors.set(controlId, accessor);
        return () => {
            this.accessors.delete(controlId);
        };
    }
    static getControlValue(controlId) {
        const accessor = this.accessors.get(controlId);
        if (accessor) {
            return accessor();
        }
        if (this.globalValueResolver) {
            const val = this.globalValueResolver(controlId);
            if (val !== undefined)
                return val;
        }
        // Browser DOM fallback
        if (typeof document !== "undefined") {
            const el = document.getElementById(controlId) || document.querySelector(`[name="${controlId}"]`);
            if (el) {
                if ("type" in el && el.type === "checkbox") {
                    return el.checked;
                }
                if ("value" in el) {
                    return el.value;
                }
            }
        }
        return "";
    }
    static getValidators(validationGroup) {
        const targetGroup = validationGroup ?? "";
        const list = [];
        for (const v of this.validators) {
            if (v.validationGroup === targetGroup) {
                list.push(v);
            }
        }
        return list;
    }
    static getInvalidValidators(validationGroup) {
        return this.getValidators(validationGroup).filter((v) => !v.isValid);
    }
    static async validate(validationGroup) {
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
    static isValid(validationGroup) {
        const matching = this.getValidators(validationGroup);
        return matching.every((v) => v.isValid);
    }
    static reset(validationGroup) {
        const matching = this.getValidators(validationGroup);
        for (const v of matching) {
            v.isValid = true;
        }
    }
    static clear() {
        this.validators.clear();
        this.accessors.clear();
        this.globalValueResolver = undefined;
    }
}
//# sourceMappingURL=validator-manager.js.map