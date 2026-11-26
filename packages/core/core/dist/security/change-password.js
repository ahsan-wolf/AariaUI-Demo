import { EventDispatcher } from "../events.js";
import { SecurityManager } from "./membership-provider.js";
export class ChangePasswordController {
    id;
    userName;
    currentPassword;
    newPassword;
    confirmNewPassword;
    successText;
    continueDestinationPageUrl;
    newPasswordRegularExpression;
    newPasswordRegularExpressionErrorMessage;
    confirmPasswordCompareErrorMessage;
    changePasswordFailureText;
    _activeView = "ChangePassword";
    _failureMessage = null;
    _validationErrors = [];
    provider;
    changingPassword = new EventDispatcher();
    changedPassword = new EventDispatcher();
    changePasswordError = new EventDispatcher();
    continueButtonClick = new EventDispatcher();
    stateChanged = new EventDispatcher();
    constructor(options = {}) {
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
    get activeView() {
        return this._activeView;
    }
    get failureMessage() {
        return this._failureMessage;
    }
    get validationErrors() {
        return [...this._validationErrors];
    }
    get isSuccess() {
        return this._activeView === "Success";
    }
    get effectiveUserName() {
        if (this.userName && this.userName.trim().length > 0) {
            return this.userName.trim();
        }
        return this.provider.getCurrentUser()?.userName ?? "";
    }
    setCurrentPassword(value) {
        this.currentPassword = value;
        this.emitState();
    }
    setNewPassword(value) {
        this.newPassword = value;
        this.emitState();
    }
    setConfirmNewPassword(value) {
        this.confirmNewPassword = value;
        this.emitState();
    }
    validate() {
        this._validationErrors = [];
        if (!this.effectiveUserName) {
            this._validationErrors.push("User Name is required.");
        }
        if (!this.currentPassword) {
            this._validationErrors.push("Current Password is required.");
        }
        if (!this.newPassword) {
            this._validationErrors.push("New Password is required.");
        }
        else if (this.newPassword.length < 4) {
            this._validationErrors.push("New Password must be at least 4 characters.");
        }
        if (this.newPassword && this.newPasswordRegularExpression) {
            const regex = typeof this.newPasswordRegularExpression === "string"
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
    async changePassword() {
        this._failureMessage = null;
        if (!this.validate()) {
            this.emitState();
            return false;
        }
        const targetUser = this.effectiveUserName;
        const cancelArgs = {
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
        }
        else {
            this._failureMessage = this.changePasswordFailureText;
            await this.changePasswordError.emit(this, this.changePasswordFailureText);
            this.emitState();
            return false;
        }
    }
    continue() {
        this.continueButtonClick.emit(this, undefined);
    }
    reset() {
        this._activeView = "ChangePassword";
        this._failureMessage = null;
        this._validationErrors = [];
        this.currentPassword = "";
        this.newPassword = "";
        this.confirmNewPassword = "";
        this.emitState();
    }
    getState() {
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
    emitState() {
        this.stateChanged.emit(this, this.getState());
    }
}
//# sourceMappingURL=change-password.js.map