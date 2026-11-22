import { CancelEventArgs, EventDispatcher } from "../events.js";
import { IMembershipProvider, IUser } from "./membership-provider.js";
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
}
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
export declare class LoginController {
    readonly id: string;
    userName: string;
    password: string;
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
    userNameRequiredErrorMessage: string;
    passwordRequiredErrorMessage: string;
    visibleWhenLoggedIn: boolean;
    validationGroup?: string | undefined;
    private _failureMessage;
    private _validationErrors;
    private readonly provider;
    readonly loggingIn: EventDispatcher<LoginController, LoginCancelEventArgs>;
    readonly loggedIn: EventDispatcher<LoginController, LoginEventArgs>;
    readonly loginError: EventDispatcher<LoginController, LoginErrorEventArgs>;
    readonly stateChanged: EventDispatcher<LoginController, LoginState>;
    constructor(options?: LoginOptions);
    get failureMessage(): string | null;
    get validationErrors(): string[];
    get currentUser(): IUser | null;
    get isLoggedIn(): boolean;
    get isAuthenticated(): boolean;
    get isVisible(): boolean;
    setUserName(value: string): void;
    setPassword(value: string): void;
    setRememberMe(value: boolean): void;
    validate(): boolean;
    authenticate(): Promise<boolean>;
    login(): Promise<boolean>;
    getState(): LoginState;
    private emitState;
}
