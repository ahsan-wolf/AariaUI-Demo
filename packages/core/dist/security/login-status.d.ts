import { CancelEventArgs, EventDispatcher } from "../events.js";
import { IMembershipProvider, IUser } from "./membership-provider.js";
export type LogoutAction = "Refresh" | "Redirect";
export interface LoginStatusOptions {
    id?: string | undefined;
    loginText?: string | undefined;
    logoutText?: string | undefined;
    loginPageUrl?: string | undefined;
    logoutPageUrl?: string | undefined;
    logoutAction?: LogoutAction | undefined;
    provider?: IMembershipProvider | undefined;
}
export interface LoginStatusState {
    isLoggedIn: boolean;
    text: string;
    targetUrl?: string | undefined;
    logoutAction: LogoutAction;
    currentUser: IUser | null;
}
export declare class LoginStatusController {
    readonly id: string;
    loginText: string;
    logoutText: string;
    loginPageUrl?: string | undefined;
    logoutPageUrl?: string | undefined;
    logoutAction: LogoutAction;
    private readonly provider;
    private unsubscribeSecurity?;
    readonly loggingOut: EventDispatcher<LoginStatusController, CancelEventArgs>;
    readonly loggedOut: EventDispatcher<LoginStatusController, void>;
    readonly stateChanged: EventDispatcher<LoginStatusController, LoginStatusState>;
    constructor(options?: LoginStatusOptions);
    dispose(): void;
    get currentUser(): IUser | null;
    get isLoggedIn(): boolean;
    get text(): string;
    get targetUrl(): string | undefined;
    logout(): Promise<boolean>;
    executeAction(): Promise<boolean>;
    getState(): LoginStatusState;
    private emitState;
}
