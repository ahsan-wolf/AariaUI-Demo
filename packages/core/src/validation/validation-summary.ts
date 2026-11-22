import { ValidatorManager } from "./validator-manager.js";

export type ValidationSummaryDisplayMode = "BulletList" | "List" | "SingleParagraph";

export interface ValidationSummaryOptions {
  id: string;
  validationGroup?: string | undefined;
  headerText?: string | undefined;
  displayMode?: ValidationSummaryDisplayMode | undefined;
  showSummary?: boolean | undefined;
  showMessageBox?: boolean | undefined;
}

export class ValidationSummaryController {
  readonly id: string;
  validationGroup: string;
  headerText: string;
  displayMode: ValidationSummaryDisplayMode;
  showSummary: boolean;
  showMessageBox: boolean;

  constructor(options: ValidationSummaryOptions) {
    this.id = options.id;
    this.validationGroup = options.validationGroup ?? "";
    this.headerText = options.headerText ?? "";
    this.displayMode = options.displayMode ?? "BulletList";
    this.showSummary = options.showSummary ?? true;
    this.showMessageBox = options.showMessageBox ?? false;
  }

  getErrorMessages(): string[] {
    const invalid = ValidatorManager.getInvalidValidators(this.validationGroup);
    return invalid
      .map((v) => v.errorMessage)
      .filter((msg) => Boolean(msg && msg.trim() !== ""));
  }

  getFormattedErrors(): string {
    const messages = this.getErrorMessages();
    if (messages.length === 0) return "";

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

  showPopupIfConfigured(): void {
    if (this.showMessageBox && typeof window !== "undefined" && typeof window.alert === "function") {
      const text = this.getFormattedErrors();
      if (text) {
        window.alert(text);
      }
    }
  }
}

