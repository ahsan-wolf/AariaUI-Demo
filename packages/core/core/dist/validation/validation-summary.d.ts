export type ValidationSummaryDisplayMode = "BulletList" | "List" | "SingleParagraph";
export interface ValidationSummaryOptions {
    id: string;
    validationGroup?: string | undefined;
    headerText?: string | undefined;
    displayMode?: ValidationSummaryDisplayMode | undefined;
    showSummary?: boolean | undefined;
    showMessageBox?: boolean | undefined;
}
export declare class ValidationSummaryController {
    readonly id: string;
    validationGroup: string;
    headerText: string;
    displayMode: ValidationSummaryDisplayMode;
    showSummary: boolean;
    showMessageBox: boolean;
    constructor(options: ValidationSummaryOptions);
    getErrorMessages(): string[];
    getFormattedErrors(): string;
    showPopupIfConfigured(): void;
}
