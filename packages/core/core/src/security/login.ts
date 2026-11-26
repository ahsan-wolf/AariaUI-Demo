import { CancelEventArgs, EventDispatcher } from "../events.js";
import { IMembershipProvider, IUser, SecurityManager } from "./membership-provider.js";

export interface LoginCancelEventArgs extends CancelEventArgs {
  userName: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginEventArgs {
  userName: string;
  user: IUser;
}

export interface LoginErrorEventArgs {
  userName: string;
  errorMessage: string;
}

export interface LoginOptions {
  id?: string | undefined;
  userName?: string | undefined;
  password?: string | undefined;
  rememberMeSet?: boolean | undefined;
  displayRememberMe?: boolean | undefined;
  destinationPageUrl?: string | undefined;
  failureText?: string | undefined;
  helpPageUrl?: string | undefined;
  helpPageText?: string | undefined;
  passwordRecoveryUrl?: string | undefined;
  passwordRecoveryText?: string | undefined;
  createUserUrl?: string | undefined;
  createUserText?: string | undefined;
  userNameRequiredErrorMessage?: string | undefined;
  passwordRequiredErrorMessage?: string | undefined;
  visibleWhenLoggedIn?: boolean | undefined;
  validationGroup?: string | undefined;
  provider?: IMembershipProvider | undefined;
  /** The ReturnUrl query value. Core only carries it; a `postLogin` hook decides what to do with it. */
  returnUrl?: string | undefined;
  /**
   * Runs after a successful sign-in, before `loggedIn` is raised. Use it to issue a session ticket and navigate,
   * e.g. `formsLoginHook()` from @wf-controls/enterprise-security.
   */
  postLogin?: LoginPostLoginHook | undefined;
}

export interface LoginPostLoginContext {
  rememberMe: boolean;
  returnUrl?: string | undefined;
  destinationPageUrl?: string | undefined;
}

export type LoginPostLoginHook = (user: IUser, context: LoginPostLoginContext) => void | Promise<void>;

export interface LoginState {
  userName: string;
  rememberMeSet: boolean;
  displayRememberMe: boolean;
  destinationPageUrl?: string | undefined;
  failureText: string;
  helpPageUrl?: string | undefined;
  helpPageText: string;
  passwordRecoveryUrl?: string | undefined;
  passwordRecoveryText: string;
  createUserUrl?: string | undefined;
  createUserText: string;
  visibleWhenLoggedIn: boolean;
  validationGroup?: string | undefined;
  isAuthenticated: boolean;
  isLoggedIn: boolean;
  failureMessage: string | null;
  currentUser: IUser | null;
  isValid: boolean;
  validationErrors: string[];
}

export class LoginController {
  public readonly id: string;
  public userName: string;
  public password: string;
  public rememberMeSet: boolean;
  public displayRememberMe: boolean;
  public destinationPageUrl?: string | undefined;
  public failureText: string;
  public helpPageUrl?: string | undefined;
  public helpPageText: string;
  public passwordRecoveryUrl?: string | undefined;
  public passwordRecoveryText: string;
  public createUserUrl?: string | undefined;
  public createUserText: string;
  public userNameRequiredErrorMessage: string;
  public passwordRequiredErrorMessage: string;
  public visibleWhenLoggedIn: boolean;
  public validationGroup?: string | undefined;

  private _failureMessage: string | null = null;
  private _validationErrors: string[] = [];
  public returnUrl?: string | undefined;
  public postLogin?: LoginPostLoginHook | undefined;
  private readonly provider: IMembershipProvider;

  public readonly loggingIn = new EventDispatcher<LoginController, LoginCancelEventArgs>();
  public readonly loggedIn = new EventDispatcher<LoginController, LoginEventArgs>();
  public readonly loginError = new EventDispatcher<LoginController, LoginErrorEventArgs>();
  public readonly stateChanged = new EventDispatcher<LoginController, LoginState>();

  constructor(options: LoginOptions = {}) {
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
    this.returnUrl = options.returnUrl;
    this.postLogin = options.postLogin;
  }

  get failureMessage(): string | null {
    return this._failureMessage;
  }

  get validationErrors(): string[] {
    return [...this._validationErrors];
  }

  get currentUser(): IUser | null {
    return this.provider.getCurrentUser();
  }

  get isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  get isAuthenticated(): boolean {
    return this.isLoggedIn;
  }

  get isVisible(): boolean {
    if (this.isLoggedIn && !this.visibleWhenLoggedIn) {
      return false;
    }
    return true;
  }

  setUserName(value: string): void {
    this.userName = value;
    this.emitState();
  }

  setPassword(value: string): void {
    this.password = value;
    this.emitState();
  }

  setRememberMe(value: boolean): void {
    this.rememberMeSet = value;
    this.emitState();
  }

  validate(): boolean {
    this._validationErrors = [];
    if (!this.userName || this.userName.trim().length === 0) {
      this._validationErrors.push(this.userNameRequiredErrorMessage);
    }
    if (!this.password || this.password.length === 0) {
      this._validationErrors.push(this.passwordRequiredErrorMessage);
    }
    return this._validationErrors.length === 0;
  }

  async authenticate(): Promise<boolean> {
    return this.provider.validateUser(this.userName, this.password);
  }

  async login(): Promise<boolean> {
    this._failureMessage = null;

    if (!this.validate()) {
      this.emitState();
      return false;
    }

    const cancelArgs: LoginCancelEventArgs = {
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
      const user = this.provider.getCurrentUser()!;
      this._failureMessage = null;
      this.password = "";
      if (this.postLogin) {
        await this.postLogin(user, {
          rememberMe: this.rememberMeSet,
          returnUrl: this.returnUrl,
          destinationPageUrl: this.destinationPageUrl,
        });
      }
      await this.loggedIn.emit(this, { userName: this.userName, user });
      this.emitState();
      return true;
    } else {
      this._failureMessage = this.failureText;
      await this.loginError.emit(this, {
        userName: this.userName,
        errorMessage: this.failureText,
      });
      this.emitState();
      return false;
    }
  }

  getState(): LoginState {
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

  private emitState(): void {
    this.stateChanged.emit(this, this.getState());
  }
}
