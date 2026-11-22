import { EventDispatcher } from "../events.js";
import { SecurityManager } from "./membership-provider.js";
export class CreateUserWizardController {
    id;
    userName;
    password;
    confirmPassword;
    email;
    question;
    answer;
    requireEmail;
    disableCreatedUser;
    continueDestinationPageUrl;
    duplicateUserNameErrorMessage;
    duplicateEmailErrorMessage;
    invalidPasswordErrorMessage;
    confirmPasswordCompareErrorMessage;
    _activeStep = "CreateUser";
    _failureMessage = null;
    _validationErrors = [];
    _createdUser = null;
    provider;
    creatingUser = new EventDispatcher();
    createdUser = new EventDispatcher();
    createUserError = new EventDispatcher();
    continueButtonClick = new EventDispatcher();
    stateChanged = new EventDispatcher();
    constructor(options = {}) {
        this.id = options.id ?? `CreateUserWizard_${Math.random().toString(36).substring(2, 9)}`;
        this.userName = options.userName ?? "";
        this.password = options.password ?? "";
        this.confirmPassword = options.confirmPassword ?? "";
        this.email = options.email ?? "";
        this.question = options.question ?? "";
        this.answer = options.answer ?? "";
        this.requireEmail = options.requireEmail ?? true;
        this.disableCreatedUser = options.disableCreatedUser ?? false;
        this.continueDestinationPageUrl = options.continueDestinationPageUrl;
        this.duplicateUserNameErrorMessage =
            options.duplicateUserNameErrorMessage ?? "Please enter a different user name.";
        this.duplicateEmailErrorMessage =
            options.duplicateEmailErrorMessage ??
                "A user name already exists to authorize this e-mail address. Please enter a different e-mail address.";
        this.invalidPasswordErrorMessage =
            options.invalidPasswordErrorMessage ?? "Password length minimum: 4 characters.";
        this.confirmPasswordCompareErrorMessage =
            options.confirmPasswordCompareErrorMessage ?? "The Confirm Password must match the Password entry.";
        this.provider = options.provider ?? SecurityManager.defaultProvider;
    }
    get activeStep() {
        return this._activeStep;
    }
    get failureMessage() {
        return this._failureMessage;
    }
    get validationErrors() {
        return [...this._validationErrors];
    }
    get isComplete() {
        return this._activeStep === "Complete";
    }
    get user() {
        return this._createdUser;
    }
    setUserName(value) {
        this.userName = value;
        this.emitState();
    }
    setPassword(value) {
        this.password = value;
        this.emitState();
    }
    setConfirmPassword(value) {
        this.confirmPassword = value;
        this.emitState();
    }
    setEmail(value) {
        this.email = value;
        this.emitState();
    }
    setQuestion(value) {
        this.question = value;
        this.emitState();
    }
    setAnswer(value) {
        this.answer = value;
        this.emitState();
    }
    validate() {
        this._validationErrors = [];
        if (!this.userName || this.userName.trim().length === 0) {
            this._validationErrors.push("User Name is required.");
        }
        if (!this.password || this.password.length === 0) {
            this._validationErrors.push("Password is required.");
        }
        else if (this.password.length < 4) {
            this._validationErrors.push(this.invalidPasswordErrorMessage);
        }
        if (this.password !== this.confirmPassword) {
            this._validationErrors.push(this.confirmPasswordCompareErrorMessage);
        }
        if (this.requireEmail) {
            if (!this.email || this.email.trim().length === 0) {
                this._validationErrors.push("E-mail is required.");
            }
            else if (!this.email.includes("@")) {
                this._validationErrors.push("E-mail must be valid.");
            }
        }
        return this._validationErrors.length === 0;
    }
    async createUser() {
        this._failureMessage = null;
        if (!this.validate()) {
            this.emitState();
            return false;
        }
        const cancelArgs = {
            userName: this.userName,
            password: this.password,
            email: this.email || undefined,
            cancel: false,
        };
        await this.creatingUser.emit(this, cancelArgs);
        if (cancelArgs.cancel) {
            return false;
        }
        const result = await this.provider.createUser(this.userName, this.password, this.email || undefined, this.question || undefined, this.answer || undefined, !this.disableCreatedUser);
        if (result.status === "Success" && result.user) {
            this._createdUser = result.user;
            this._activeStep = "Complete";
            this._failureMessage = null;
            this.password = "";
            this.confirmPassword = "";
            await this.createdUser.emit(this, result.user);
            this.emitState();
            return true;
        }
        else {
            let errMsg = result.errorMessage ?? "An error occurred creating the user.";
            if (result.status === "DuplicateUserName")
                errMsg = this.duplicateUserNameErrorMessage;
            if (result.status === "DuplicateEmail")
                errMsg = this.duplicateEmailErrorMessage;
            if (result.status === "InvalidPassword")
                errMsg = this.invalidPasswordErrorMessage;
            this._failureMessage = errMsg;
            await this.createUserError.emit(this, errMsg);
            this.emitState();
            return false;
        }
    }
    continue() {
        this.continueButtonClick.emit(this, undefined);
    }
    reset() {
        this._activeStep = "CreateUser";
        this._failureMessage = null;
        this._validationErrors = [];
        this._createdUser = null;
        this.userName = "";
        this.password = "";
        this.confirmPassword = "";
        this.email = "";
        this.question = "";
        this.answer = "";
        this.emitState();
    }
    getState() {
        return {
            activeStep: this._activeStep,
            userName: this.userName,
            email: this.email,
            question: this.question,
            answer: this.answer,
            validationErrors: [...this._validationErrors],
            failureMessage: this._failureMessage,
            isComplete: this.isComplete,
            user: this._createdUser,
            continueDestinationPageUrl: this.continueDestinationPageUrl,
        };
    }
    emitState() {
        this.stateChanged.emit(this, this.getState());
    }
}
//# sourceMappingURL=create-user-wizard.js.map