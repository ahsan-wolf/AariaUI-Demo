import { CancelEventArgs, EventDispatcher } from "../events.js";
import { IMembershipProvider, IUser, SecurityManager } from "./membership-provider.js";

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

export class LoginStatusController {
  public readonly id: string;
  public loginText: string;
  public logoutText: string;
  public loginPageUrl?: string | undefined;
  public logoutPageUrl?: string | undefined;
  public logoutAction: LogoutAction;
  private readonly provider: IMembershipProvider;
  private unsubscribeSecurity?: (() => void) | undefined;

  public readonly loggingOut = new EventDispatcher<LoginStatusController, CancelEventArgs>();
  public readonly loggedOut = new EventDispatcher<LoginStatusController, void>();
  public readonly stateChanged = new EventDispatcher<LoginStatusController, LoginStatusState>();

  constructor(options: LoginStatusOptions = {}) {
    this.id = options.id ?? `LoginStatus_${Math.random().toString(36).substring(2, 9)}`;
    this.loginText = options.loginText ?? "Login";
    this.logoutText = options.logoutText ?? "Logout";
    this.loginPageUrl = options.loginPageUrl;
    this.logoutPageUrl = options.logoutPageUrl;
    this.logoutAction = options.logoutAction ?? "Refresh";
    this.provider = options.provider ?? SecurityManager.defaultProvider;

    this.unsubscribeSecurity = SecurityManager.currentUserChanged.subscribe(() => {
      this.emitState();
    });
  }

  dispose(): void {
    if (this.unsubscribeSecurity) {
      this.unsubscribeSecurity();
      this.unsubscribeSecurity = undefined;
    }
  }

  get currentUser(): IUser | null {
    return this.provider.getCurrentUser();
  }

  get isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  get text(): string {
    return this.isLoggedIn ? this.logoutText : this.loginText;
  }

  get targetUrl(): string | undefined {
    return this.isLoggedIn ? this.logoutPageUrl : this.loginPageUrl;
  }

  async logout(): Promise<boolean> {
    if (!this.isLoggedIn) return false;

    const cancelArgs: CancelEventArgs = { cancel: false };
    await this.loggingOut.emit(this, cancelArgs);
    if (cancelArgs.cancel) {
      return false;
    }

    await this.provider.logout();
    await this.loggedOut.emit(this, undefined);
    this.emitState();
    return true;
  }

  async executeAction(): Promise<boolean> {
    if (this.isLoggedIn) {
      return this.logout();
    }
    return true;
  }

  getState(): LoginStatusState {
    return {
      isLoggedIn: this.isLoggedIn,
      text: this.text,
      targetUrl: this.targetUrl,
      logoutAction: this.logoutAction,
      currentUser: this.currentUser,
    };
  }

  private emitState(): void {
    this.stateChanged.emit(this, this.getState());
  }
}
