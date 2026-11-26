import { EventDispatcher } from "../../events.js";
import { PasswordPolicy } from "../password-policy.js";
import type { IMembershipAdmin, IMembershipProvider, IUser, MembershipCreateResult, MembershipPage, PasswordResetStatus, PasswordResetToken, UserUpdate } from "../membership-types.js";
import { type IPasswordHasher } from "./password-hasher.js";
import { type IRoleStore, type IUserStore } from "./user-store.js";
import type { AuthAuditEvent, IAuditSink } from "./audit.js";
export interface StoreMembershipOptions {
    name?: string | undefined;
    /** Where users live. Use InMemoryUserStore for demos and tests, your own IUserStore for a database. */
    userStore: IUserStore;
    /** Where role memberships live. Default: an InMemoryRoleStore. */
    roleStore?: IRoleStore | undefined;
    /** Default: PBKDF2-HMAC-SHA256, 600000 iterations. */
    hasher?: IPasswordHasher | undefined;
    /** Default: at least 10 characters. */
    passwordPolicy?: PasswordPolicy | undefined;
    /** `<membership requiresQuestionAndAnswer>`. Default false. */
    requiresQuestionAndAnswer?: boolean | undefined;
    /** `<membership maxInvalidPasswordAttempts>`. Default 5. */
    maxInvalidPasswordAttempts?: number | undefined;
    /** `<membership passwordAttemptWindow>` in minutes: failures older than this do not count. Default 10. Infinity = never expires. */
    passwordAttemptWindowMinutes?: number | undefined;
    /** Locked accounts unlock themselves after this many minutes. Default: never (an administrator must unlock). */
    lockoutDurationMinutes?: number | undefined;
    /** `Membership.UserIsOnlineTimeWindow` in minutes. Default 15. */
    userIsOnlineTimeWindowMinutes?: number | undefined;
    /** How long a password-reset token works, in minutes. Default 30. */
    resetTokenLifetimeMinutes?: number | undefined;
    /** `<membership applicationName>`; informational. */
    applicationName?: string | undefined;
    auditSink?: IAuditSink | undefined;
    /** Clock (epoch ms). Tests inject a fake. */
    now?: (() => number) | undefined;
}
export interface UserValidatedEventArgs {
    userName: string;
    success: boolean;
    reason?: string | undefined;
}
export interface UserNameEventArgs {
    userName: string;
}
/**
 * The complete ASP.NET Membership model on top of an IUserStore: hashed passwords and security answers, lockout with an
 * attempt window, reset tokens, administration, online users, audit events. Runs in the browser and on a Node server.
 *
 * Security properties (each is covered by a test): no plain-text secrets are stored; an unknown user costs the same
 * hashing work as a known one and gets the same answer; locked or unapproved users cannot sign in even with the right
 * password; failed attempts count only inside the window; reset tokens are random, hashed at rest, single-use and expiring.
 */
export declare class StoreMembershipProvider implements IMembershipProvider, IMembershipAdmin {
    readonly name: string;
    readonly applicationName: string;
    readonly requiresQuestionAndAnswer: boolean;
    readonly passwordPolicy: PasswordPolicy;
    readonly userValidated: EventDispatcher<StoreMembershipProvider, UserValidatedEventArgs>;
    readonly userLockedOut: EventDispatcher<StoreMembershipProvider, UserNameEventArgs>;
    readonly passwordChanged: EventDispatcher<StoreMembershipProvider, UserNameEventArgs>;
    protected readonly userStore: IUserStore;
    protected readonly roleStore: IRoleStore;
    protected readonly hasher: IPasswordHasher;
    protected readonly now: () => number;
    private readonly maxAttempts;
    private readonly windowMs;
    private readonly lockoutMs;
    private readonly onlineMs;
    private readonly resetMs;
    private readonly audit;
    private dummyHash;
    private currentUser;
    private readonly roleCache;
    constructor(options: StoreMembershipOptions);
    /** Hook run before every operation (the in-memory provider seeds its users here). */
    protected ready(): Promise<void>;
    validateUser(userName: string, password: string): Promise<boolean>;
    login(userName: string, password: string, _rememberMe?: boolean): Promise<boolean>;
    logout(): Promise<void>;
    getCurrentUser(): IUser | null;
    createUser(userName: string, password: string, email?: string | undefined, passwordQuestion?: string | undefined, passwordAnswer?: string | undefined, isApproved?: boolean): Promise<MembershipCreateResult>;
    getUser(userName: string): Promise<IUser | null>;
    getPasswordQuestion(userName: string): Promise<string | null>;
    changePassword(userName: string, oldPassword: string, newPassword: string): Promise<boolean>;
    changePasswordQuestionAndAnswer(userName: string, password: string, newQuestion: string, newAnswer: string): Promise<boolean>;
    /**
     * Legacy ASP.NET reset: checks the security answer and returns a NEW random password (shown once, stored hashed).
     * Prefer createPasswordResetToken / resetPasswordWithToken, which never exposes a password.
     */
    resetPassword(userName: string, answer?: string | undefined): Promise<string | null>;
    createPasswordResetToken(userName: string): Promise<PasswordResetToken | null>;
    resetPasswordWithToken(userName: string, token: string, newPassword: string): Promise<PasswordResetStatus>;
    unlockUser(userName: string): Promise<boolean>;
    getUserNameByEmail(email: string): Promise<string | null>;
    getAllUsers(pageIndex: number, pageSize: number): Promise<MembershipPage<IUser>>;
    findUsersByName(pattern: string, pageIndex: number, pageSize: number): Promise<MembershipPage<IUser>>;
    findUsersByEmail(pattern: string, pageIndex: number, pageSize: number): Promise<MembershipPage<IUser>>;
    getNumberOfUsersOnline(): Promise<number>;
    updateUser(update: UserUpdate): Promise<boolean>;
    deleteUser(userName: string): Promise<boolean>;
    isInRole(role: string, userName?: string | undefined): boolean;
    /** Synchronous: answers from the roles loaded at sign-in or by getRolesForUserAsync / refreshRoles. Unknown users give []. */
    getRolesForUser(userName?: string | undefined): string[];
    getRolesForUserAsync(userName: string): Promise<string[]>;
    isInRoleAsync(userName: string, role: string): Promise<boolean>;
    /** Reloads one user's roles from the role store into the synchronous cache. Call it after changing memberships. */
    refreshRoles(userName: string): Promise<string[]>;
    protected write(event: Omit<AuthAuditEvent, "at">): void;
    private validated;
    private registerFailure;
    private getDummyHash;
    /** A strong random password that satisfies the policy (used by the legacy reset). */
    protected generatePassword(): string;
    private rolesFor;
    private toUser;
    private copyUser;
}
