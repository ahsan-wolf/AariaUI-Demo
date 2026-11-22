import { EventDispatcher } from "../events.js";
import { SecurityManager } from "./membership-provider.js";
export class LoginController {
    id;
    userName;
    password;
    rememberMeSet;
    displayRememberMe;
    destinationPageUrl;
    failureText;
    helpPageUrl;
    helpPageText;
    passwordRecoveryUrl;
    passwordRecoveryText;
    createUserUrl;
    createUserText;
    userNameRequiredErrorMessage;
    passwordRequiredErrorMessage;
    visibleWhenLoggedIn;
    validationGroup;
    _failureMessage = null;
    _validationErrors = [];
    provider;
    loggingIn = new EventDispatcher();
    loggedIn = new EventDispatcher();
    loginError = new EventDispatcher();
    stateChanged = new EventDispatcher();
    constructor(options = {}) {
        this.id = options.id ?? `Login_${Math.random().toString(36).substring(2, 9)}`;
        this.userName = options.userName ?? "";
        this.password = options.password ?? "";
        this.rememberMeSet = options.rememberMeSet ?? false;
        this.displayRememberMe = options.displayRememberMe ?? true;
        this.destinationPageUrl = options.destinationPageUrl;
        this.failureText = options.failureText ?? "Your login attempt was not successful. Please try again.";
        this.helpPageUrl = options.helpPageUrl;
        this.helpPageText = options.helpPageText ?? "Help";
        this.passwordRecoveryUrl = options.passwordRecoveryUrl;
        this.passwordRecoveryText = options.passwordRecoveryText ?? "Forgot your password?";
        this.createUserUrl = options.createUserUrl;
        this.createUserText = options.createUserText ?? "Sign Up";
        this.userNameRequiredErrorMessage = options.userNameRequiredErrorMessage ?? "User Name is required.";
        this.passwordRequiredErrorMessage = options.passwordRequiredErrorMessage ?? "Password is required.";
        this.visibleWhenLoggedIn = options.visibleWhenLoggedIn ?? false;
        this.validationGroup = options.validationGroup;
        this.provider = options.provider ?? SecurityManager.defaultProvider;
    }
    get failureMessage() {
        return this._failureMessage;
    }
    get validationErrors() {
        return [...this._validationErrors];
    }
    get currentUser() {
        return this.provider.getCurrentUser();
    }
    get isLoggedIn() {
        return this.currentUser !== null;
    }
    get isAuthenticated() {
        return this.isLoggedIn;
    }
    get isVisible() {
        if (this.isLoggedIn && !this.visibleWhenLoggedIn) {
            return false;
        }
        return true;
    }
    setUserName(value) {
        this.userName = value;
        this.emitState();
    }
    setPassword(value) {
        this.password = value;
        this.emitState();
    }
    setRememberMe(value) {
        this.rememberMeSet = value;
        this.emitState();
    }
    validate() {
        this._validationErrors = [];
        if (!this.userName || this.userName.trim().length === 0) {
            this._validationErrors.push(this.userNameRequiredErrorMessage);
        }
        if (!this.password || this.password.length === 0) {
            this._validationErrors.push(this.passwordRequiredErrorMessage);
        }
        return this._validationErrors.length === 0;
    }
    async authenticate() {
        return this.provider.validateUser(this.userName, this.password);
    }
    async login() {
        this._failureMessage = null;
        if (!this.validate()) {
            this.emitState();
            return false;
        }
        const cancelArgs = {
            userName: this.userName,
            password: this.password,
            rememberMe: this.rememberMeSet,
            cancel: false,
        };
        await this.loggingIn.emit(this, cancelArgs);
        if (cancelArgs.cancel) {
            return false;
        }
        const success = await this.provider.login(this.userName, this.password, this.rememberMeSet);
        if (success) {
            const user = this.provider.getCurrentUser();
            this._failureMessage = null;
            this.password = "";
            await this.loggedIn.emit(this, { userName: this.userName, user });
            this.emitState();
            return true;
        }
        else {
            this._failureMessage = this.failureText;
            await this.loginError.emit(this, {
                userName: this.userName,
                errorMessage: this.failureText,
            });
            this.emitState();
            return false;
        }
    }
    getState() {
        const isVal = this.validate();
        return {
            userName: this.userName,
            rememberMeSet: this.rememberMeSet,
            displayRememberMe: this.displayRememberMe,
            destinationPageUrl: this.destinationPageUrl,
            failureText: this.failureText,
            helpPageUrl: this.helpPageUrl,
            helpPageText: this.helpPageText,
            passwordRecoveryUrl: this.passwordRecoveryUrl,
            passwordRecoveryText: this.passwordRecoveryText,
            createUserUrl: this.createUserUrl,
            createUserText: this.createUserText,
            visibleWhenLoggedIn: this.visibleWhenLoggedIn,
            validationGroup: this.validationGroup,
            isAuthenticated: this.isAuthenticated,
            isLoggedIn: this.isLoggedIn,
            failureMessage: this._failureMessage,
            currentUser: this.currentUser,
            isValid: isVal,
            validationErrors: [...this._validationErrors],
        };
    }
    emitState() {
        this.stateChanged.emit(this, this.getState());
    }
}
//# sourceMappingURL=login.js.map