import { ValidatorManager } from "./validator-manager.js";
export class ValidationSummaryController {
    id;
    validationGroup;
    headerText;
    displayMode;
    showSummary;
    showMessageBox;
    constructor(options) {
        this.id = options.id;
        this.validationGroup = options.validationGroup ?? "";
        this.headerText = options.headerText ?? "";
        this.displayMode = options.displayMode ?? "BulletList";
        this.showSummary = options.showSummary ?? true;
        this.showMessageBox = options.showMessageBox ?? false;
    }
    getErrorMessages() {
        const invalid = ValidatorManager.getInvalidValidators(this.validationGroup);
        return invalid
            .map((v) => v.errorMessage)
            .filter((msg) => Boolean(msg && msg.trim() !== ""));
    }
    getFormattedErrors() {
        const messages = this.getErrorMessages();
        if (messages.length === 0)
            return "";
        const header = this.headerText ? `${this.headerText}\n` : "";
        switch (this.displayMode) {
            case "BulletList":
                return header + messages.map((m) => `• ${m}`).join("\n");
            case "List":
                return header + messages.join("\n");
            case "SingleParagraph":
                return header + messages.join(" ");
            default:
                return header + messages.join("\n");
        }
    }
    showPopupIfConfigured() {
        if (this.showMessageBox && typeof window !== "undefined" && typeof window.alert === "function") {
            const text = this.getFormattedErrors();
            if (text) {
                window.alert(text);
            }
        }
    }
}
//# sourceMappingURL=validation-summary.js.map