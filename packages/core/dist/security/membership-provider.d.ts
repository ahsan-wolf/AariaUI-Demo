import { EventDispatcher } from "../events.js";
export interface IUser {
    userName: string;
    email?: string | undefined;
    roles?: string[] | undefined;
    isLockedOut?: boolean | undefined;
    isApproved?: boolean | undefined;
    lastLoginDate?: Date | undefined;
    passwordQuestion?: string | undefined;
    customData?: Record<string, unknown> | undefined;
}
export type MembershipCreateStatus = "Success" | "InvalidUserName" | "InvalidPassword" | "InvalidQuestion" | "InvalidAnswer" | "InvalidEmail" | "DuplicateUserName" | "DuplicateEmail" | "UserRejected" | "ProviderError";
export interface MembershipCreateResult {
    status: MembershipCreateStatus;
    user?: IUser | undefined;
    errorMessage?: string | undefined;
}
export interface IMembershipProvider {
    readonly name: string;
    validateUser(userName: string, password: string): Promise<boolean>;
    getUser(userName: string): Promise<IUser | null>;
    getCurrentUser(): IUser | null;
    createUser(userName: string, password: string, email?: string | undefined, passwordQuestion?: string | undefined, passwordAnswer?: string | undefined, isApproved?: boolean | undefined): Promise<MembershipCreateResult>;
    changePassword(userName: string, oldPassword: string, newPassword: string): Promise<boolean>;
    resetPassword(userName: string, answer?: string | undefined): Promise<string | null>;
    getPasswordQuestion(userName: string): Promise<string | null>;
    unlockUser(userName: string): Promise<boolean>;
    login(userName: string, password: string, rememberMe?: boolean | undefined): Promise<boolean>;
    logout(): Promise<void>;
    isInRole(role: string, userName?: string | undefined): boolean;
    getRolesForUser(userName?: string | undefined): string[];
}
export interface SeedUser extends IUser {
    password: string;
    passwordAnswer?: string | undefined;
}
export interface InMemoryAuthProviderOptions {
    name?: string | undefined;
    maxInvalidPasswordAttempts?: number | undefined;
    users?: SeedUser[] | undefined;
}
export declare class InMemoryAuthProvider implements IMembershipProvider {
    readonly name: string;
    private readonly maxInvalidPasswordAttempts;
    private readonly users;
    private currentUser;
    constructor(options?: InMemoryAuthProviderOptions);
    validateUser(userName: string, password: string): Promise<boolean>;
    getUser(userName: string): Promise<IUser | null>;
    getCurrentUser(): IUser | null;
    createUser(userName: string, password: string, email?: string | undefined, passwordQuestion?: string | undefined, passwordAnswer?: string | undefined, isApproved?: boolean): Promise<MembershipCreateResult>;
    changePassword(userName: string, oldPassword: string, newPassword: string): Promise<boolean>;
    resetPassword(userName: string, answer?: string | undefined): Promise<string | null>;
    getPasswordQuestion(userName: string): Promise<string | null>;
    unlockUser(userName: string): Promise<boolean>;
    login(userName: string, password: string, _rememberMe?: boolean): Promise<boolean>;
    logout(): Promise<void>;
    isInRole(role: string, userName?: string | undefined): boolean;
    getRolesForUser(userName?: string | undefined): string[];
    private cloneUser;
}
export declare class SecurityManager {
    private static provider;
    static readonly currentUserChanged: EventDispatcher<IMembershipProvider, IUser | null>;
    static get defaultProvider(): IMembershipProvider;
    static setProvider(provider: IMembershipProvider): void;
    static notifyCurrentUserChanged(user: IUser | null): void;
}
