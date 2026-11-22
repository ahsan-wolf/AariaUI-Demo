import { EventDispatcher } from "../events.js";
import { IMembershipProvider, IUser, SecurityManager } from "./membership-provider.js";

export interface RoleGroup<T = unknown> {
  roles: string[];
  contentTemplate: T;
}

export type LoginViewResolvedType = "Anonymous" | "RoleGroup" | "LoggedIn";

export interface LoginViewResolvedView<T = unknown> {
  type: LoginViewResolvedType;
  template?: T | undefined;
  matchedRole?: string | undefined;
  matchedRoleGroupIndex?: number | undefined;
  user: IUser | null;
}

export interface LoginViewOptions<T = unknown> {
  id?: string | undefined;
  anonymousTemplate?: T | undefined;
  loggedInTemplate?: T | undefined;
  roleGroups?: RoleGroup<T>[] | undefined;
  provider?: IMembershipProvider | undefined;
}

export class LoginViewController<T = unknown> {
  public readonly id: string;
  public anonymousTemplate?: T | undefined;
  public loggedInTemplate?: T | undefined;
  public roleGroups: RoleGroup<T>[];
  private readonly provider: IMembershipProvider;
  private unsubscribeSecurity?: (() => void) | undefined;

  public readonly viewChanged = new EventDispatcher<LoginViewController<T>, LoginViewResolvedView<T>>();

  constructor(options: LoginViewOptions<T> = {}) {
    this.id = options.id ?? `LoginView_${Math.random().toString(36).substring(2, 9)}`;
    this.anonymousTemplate = options.anonymousTemplate;
    this.loggedInTemplate = options.loggedInTemplate;
    this.roleGroups = options.roleGroups ? [...options.roleGroups] : [];
    this.provider = options.provider ?? SecurityManager.defaultProvider;

    this.unsubscribeSecurity = SecurityManager.currentUserChanged.subscribe(() => {
      this.notifyViewChanged();
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

  get isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  resolveActiveView(): LoginViewResolvedView<T> {
    const user = this.currentUser;

    if (!user) {
      return {
        type: "Anonymous",
        template: this.anonymousTemplate,
        user: null,
      };
    }

    const userRoles = user.roles ?? [];
    for (let i = 0; i < this.roleGroups.length; i++) {
      const rg = this.roleGroups[i];
      if (!rg) continue;
      for (const requiredRole of rg.roles) {
        if (userRoles.some((r) => r.toLowerCase() === requiredRole.toLowerCase())) {
          return {
            type: "RoleGroup",
            template: rg.contentTemplate,
            matchedRole: requiredRole,
            matchedRoleGroupIndex: i,
            user,
          };
        }
      }
    }

    return {
      type: "LoggedIn",
      template: this.loggedInTemplate,
      user,
    };
  }

  notifyViewChanged(): void {
    const view = this.resolveActiveView();
    this.viewChanged.emit(this, view);
  }
}
