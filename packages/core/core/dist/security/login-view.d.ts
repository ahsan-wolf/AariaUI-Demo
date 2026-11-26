import { EventDispatcher } from "../events.js";
import { IMembershipProvider, IUser } from "./membership-provider.js";
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
export declare class LoginViewController<T = unknown> {
    readonly id: string;
    anonymousTemplate?: T | undefined;
    loggedInTemplate?: T | undefined;
    roleGroups: RoleGroup<T>[];
    private readonly provider;
    private unsubscribeSecurity?;
    readonly viewChanged: EventDispatcher<LoginViewController<T>, LoginViewResolvedView<T>>;
    constructor(options?: LoginViewOptions<T>);
    dispose(): void;
    get currentUser(): IUser | null;
    get isAuthenticated(): boolean;
    resolveActiveView(): LoginViewResolvedView<T>;
    notifyViewChanged(): void;
}
