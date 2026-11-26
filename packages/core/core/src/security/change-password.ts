import { CancelEventArgs, EventDispatcher } from "../events.js";
import { IMembershipProvider, SecurityManager } from "./membership-provider.js";

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

export class ChangePasswordController {
  public readonly id: string;
  public userName?: string | undefined;
  public currentPassword: string;
  public newPassword: string;
  public confirmNewPassword: string;
  public successText: string;
  public continueDestinationPageUrl?: string | undefined;
  public newPasswordRegularExpression?: RegExp | string | undefined;
  public newPasswordRegularExpressionErrorMessage: string;
  public confirmPasswordCompareErrorMessage: string;
  public changePasswordFailureText: string;

  private _activeView: ChangePasswordViewType = "ChangePassword";
  private _failureMessage: string | null = null;
  private _validationErrors: string[] = [];
  private readonly provider: IMembershipProvider;

  public readonly changingPassword = new EventDispatcher<ChangePasswordController, ChangePasswordCancelEventArgs>();
  public readonly changedPassword = new EventDispatcher<ChangePasswordController, void>();
  public readonly changePasswordError = new EventDispatcher<ChangePasswordController, string>();
  public readonly continueButtonClick = new EventDispatcher<ChangePasswordController, void>();
  public readonly stateChanged = new EventDispatcher<ChangePasswordController, ChangePasswordState>();

  constructor(options: ChangePasswordOptions = {}) {
    this.id = options.id ?? `ChangePassword_${Math.random().toString(36).substring(2, 9)}`;
    this.userName = options.userName;
    this.currentPassword = options.currentPassword ?? "";
    this.newPassword = options.newPassword ?? "";
    this.confirmNewPassword = options.confirmNewPassword ?? "";
    this.successText = options.successText ?? "Your password has been changed.";
    this.continueDestinationPageUrl = options.continueDestinationPageUrl;
    this.newPasswordRegularExpression = options.newPasswordRegularExpression;
    this.newPasswordRegularExpressionErrorMessage =
      options.newPasswordRegularExpressionErrorMessage ?? "Password does not meet complexity requirements.";
    this.confirmPasswordCompareErrorMessage =
      options.confirmPasswordCompareErrorMessage ?? "The Confirm New Password must match the New Password entry.";
    this.changePasswordFailureText =
      options.changePasswordFailureText ?? "Password change failed. Please re-enter your values and try again.";
    this.provider = options.provider ?? SecurityManager.defaultProvider;
  }

  get activeView(): ChangePasswordViewType {
    return this._activeView;
  }

  get failureMessage(): string | null {
    return this._failureMessage;
  }

  get validationErrors(): string[] {
    return [...this._validationErrors];
  }

  get isSuccess(): boolean {
    return this._activeView === "Success";
  }

  get effectiveUserName(): string {
    if (this.userName && this.userName.trim().length > 0) {
      return this.userName.trim();
    }
    return this.provider.getCurrentUser()?.userName ?? "";
  }

  setCurrentPassword(value: string): void {
    this.currentPassword = value;
    this.emitState();
  }

  setNewPassword(value: string): void {
    this.newPassword = value;
    this.emitState();
  }

  setConfirmNewPassword(value: string): void {
    this.confirmNewPassword = value;
    this.emitState();
  }

  validate(): boolean {
    this._validationErrors = [];

    if (!this.effectiveUserName) {
      this._validationErrors.push("User Name is required.");
    }
    if (!this.currentPassword) {
      this._validationErrors.push("Current Password is required.");
    }
    if (!this.newPassword) {
      this._validationErrors.push("New Password is required.");
    } else if (this.newPassword.length < 4) {
      this._validationErrors.push("New Password must be at least 4 characters.");
    }

    if (this.newPassword && this.newPasswordRegularExpression) {
      const regex =
        typeof this.newPasswordRegularExpression === "string"
          ? new RegExp(this.newPasswordRegularExpression)
          : this.newPasswordRegularExpression;
      if (!regex.test(this.newPassword)) {
        this._validationErrors.push(this.newPasswordRegularExpressionErrorMessage);
      }
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this._validationErrors.push(this.confirmPasswordCompareErrorMessage);
    }

    return this._validationErrors.length === 0;
  }

  async changePassword(): Promise<boolean> {
    this._failureMessage = null;

    if (!this.validate()) {
      this.emitState();
      return false;
    }

    const targetUser = this.effectiveUserName;
    const cancelArgs: ChangePasswordCancelEventArgs = {
      userName: targetUser,
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
      cancel: false,
    };

    await this.changingPassword.emit(this, cancelArgs);
    if (cancelArgs.cancel) {
      return false;
    }

    const success = await this.provider.changePassword(targetUser, this.currentPassword, this.newPassword);

    if (success) {
      this._activeView = "Success";
      this._failureMessage = null;
      this.currentPassword = "";
      this.newPassword = "";
      this.confirmNewPassword = "";
      await this.changedPassword.emit(this, undefined);
      this.emitState();
      return true;
    } else {
      this._failureMessage = this.changePasswordFailureText;
      await this.changePasswordError.emit(this, this.changePasswordFailureText);
      this.emitState();
      return false;
    }
  }

  continue(): void {
    this.continueButtonClick.emit(this, undefined);
  }

  reset(): void {
    this._activeView = "ChangePassword";
    this._failureMessage = null;
    this._validationErrors = [];
    this.currentPassword = "";
    this.newPassword = "";
    this.confirmNewPassword = "";
    this.emitState();
  }

  getState(): ChangePasswordState {
    const isVal = this.validate();
    return {
      activeView: this._activeView,
      userName: this.effectiveUserName,
      successText: this.successText,
      continueDestinationPageUrl: this.continueDestinationPageUrl,
      failureMessage: this._failureMessage,
      validationErrors: [...this._validationErrors],
      isValid: isVal,
      isSuccess: this._activeView === "Success",
    };
  }

  private emitState(): void {
    this.stateChanged.emit(this, this.getState());
  }
}
