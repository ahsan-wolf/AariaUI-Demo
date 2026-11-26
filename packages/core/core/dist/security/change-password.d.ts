import { CancelEventArgs, EventDispatcher } from "../events.js";
import { IMembershipProvider } from "./membership-provider.js";
export type ChangePasswordViewType = "ChangePassword" | "Success";
export interface ChangePasswordCancelEventArgs extends CancelEventArgs {
    userName: string;
    currentPassword: string;
    newPassword: string;
}
export interface ChangePasswordOptions {
    id?: string | undefined;
    userName?: string | undefined;
    currentPassword?: string | undefined;
    newPassword?: string | undefined;
    confirmNewPassword?: string | undefined;
    successText?: string | undefined;
    continueDestinationPageUrl?: string | undefined;
    newPasswordRegularExpression?: RegExp | string | undefined;
    newPasswordRegularExpressionErrorMessage?: string | undefined;
    confirmPasswordCompareErrorMessage?: string | undefined;
    changePasswordFailureText?: string | undefined;
    provider?: IMembershipProvider | undefined;
}
export interface ChangePasswordState {
    activeView: ChangePasswordViewType;
    userName: string;
    successText: string;
    continueDestinationPageUrl?: string | undefined;
    failureMessage: string | null;
    validationErrors: string[];
    isValid: boolean;
    isSuccess: boolean;
}
export declare class ChangePasswordController {
    readonly id: string;
    userName?: string | undefined;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    successText: string;
    continueDestinationPageUrl?: string | undefined;
    newPasswordRegularExpression?: RegExp | string | undefined;
    newPasswordRegularExpressionErrorMessage: string;
    confirmPasswordCompareErrorMessage: string;
    changePasswordFailureText: string;
    private _activeView;
    private _failureMessage;
    private _validationErrors;
    private readonly provider;
    readonly changingPassword: EventDispatcher<ChangePasswordController, ChangePasswordCancelEventArgs>;
    readonly changedPassword: EventDispatcher<ChangePasswordController, void>;
    readonly changePasswordError: EventDispatcher<ChangePasswordController, string>;
    readonly continueButtonClick: EventDispatcher<ChangePasswordController, void>;
    readonly stateChanged: EventDispatcher<ChangePasswordController, ChangePasswordState>;
    constructor(options?: ChangePasswordOptions);
    get activeView(): ChangePasswordViewType;
    get failureMessage(): string | null;
    get validationErrors(): string[];
    get isSuccess(): boolean;
    get effectiveUserName(): string;
    setCurrentPassword(value: string): void;
    setNewPassword(value: string): void;
    setConfirmNewPassword(value: string): void;
    validate(): boolean;
    changePassword(): Promise<boolean>;
    continue(): void;
    reset(): void;
    getState(): ChangePasswordState;
    private emitState;
}
