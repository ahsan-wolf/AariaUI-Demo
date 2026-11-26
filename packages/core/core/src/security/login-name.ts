import { EventDispatcher } from "../events.js";
import { IMembershipProvider, IUser, SecurityManager } from "./membership-provider.js";

export interface LoginNameOptions {
  id?: string | undefined;
  formatString?: string | undefined;
  provider?: IMembershipProvider | undefined;
}

export interface LoginNameState {
  userName: string;
  formattedText: string;
  isLoggedIn: boolean;
  currentUser: IUser | null;
}

export class LoginNameController {
  public readonly id: string;
  public formatString: string;
  private readonly provider: IMembershipProvider;
  private unsubscribeSecurity?: (() => void) | undefined;

  public readonly stateChanged = new EventDispatcher<LoginNameController, LoginNameState>();

  constructor(options: LoginNameOptions = {}) {
    this.id = options.id ?? `LoginName_${Math.random().toString(36).substring(2, 9)}`;
    this.formatString = options.formatString ?? "Welcome, {0}";
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

  get userName(): string {
    return this.currentUser?.userName ?? "";
  }

  get formattedText(): string {
    if (!this.isLoggedIn) return "";
    return this.formatString.replace(/\{0\}/g, this.userName);
  }

  getState(): LoginNameState {
    return {
      userName: this.userName,
      formattedText: this.formattedText,
      isLoggedIn: this.isLoggedIn,
      currentUser: this.currentUser,
    };
  }

  private emitState(): void {
    this.stateChanged.emit(this, this.getState());
  }
}
