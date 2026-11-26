/** One user as stored. Dates are epoch milliseconds so the record is JSON / SQL friendly. Secrets are hashes, never plain text. */
export interface UserRecord {
    /** Stable provider user key (ASP.NET `ProviderUserKey`). */
    key: string;
    userName: string;
    email?: string | undefined;
    passwordHash: string;
    passwordQuestion?: string | undefined;
    /** Hash of the normalized (trimmed, lower-cased) security answer. */
    passwordAnswerHash?: string | undefined;
    comment?: string | undefined;
    isApproved: boolean;
    isLockedOut: boolean;
    failedPasswordAttempts: number;
    failedPasswordWindowStart?: number | undefined;
    failedAnswerAttempts: number;
    failedAnswerWindowStart?: number | undefined;
    lastLockoutDate?: number | undefined;
    creationDate: number;
    lastLoginDate?: number | undefined;
    lastActivityDate?: number | undefined;
    lastPasswordChangedDate: number;
    /** SHA-256 (base64url) of the outstanding password-reset token, if any. The token itself is never stored. */
    resetTokenHash?: string | undefined;
    resetTokenExpires?: number | undefined;
    customData?: Record<string, unknown> | undefined;
}
export declare class StoreConflictError extends Error {
    readonly field: "userName" | "email" | "role";
    constructor(field: "userName" | "email" | "role", message: string);
}
export interface Page<T> {
    items: T[];
    total: number;
}
export interface IUserStore {
    findByName(userName: string): Promise<UserRecord | null>;
    findByEmail(email: string): Promise<UserRecord | null>;
    findByKey(key: string): Promise<UserRecord | null>;
    /** Inserts. Throws StoreConflictError when the user name (or e-mail, when the store enforces it) exists (case-insensitive). */
    create(record: UserRecord): Promise<void>;
    /** Replaces the record with the same key. Throws when it does not exist. */
    update(record: UserRecord): Promise<void>;
    delete(userName: string): Promise<boolean>;
    list(skip: number, take: number): Promise<Page<UserRecord>>;
    /** Case-insensitive match with SQL LIKE wildcards: `%` any text, `_` one character. */
    search(field: "userName" | "email", pattern: string, skip: number, take: number): Promise<Page<UserRecord>>;
    /** Users whose lastActivityDate is at or after `sinceMs`. */
    countActiveSince(sinceMs: number): Promise<number>;
}
export interface IRoleStore {
    /** Throws StoreConflictError when the role exists (case-insensitive). */
    createRole(roleName: string): Promise<void>;
    /** Removes the role and its memberships. With `throwOnPopulated` throws when it still has users; returns false when it does not exist. */
    deleteRole(roleName: string, throwOnPopulated: boolean): Promise<boolean>;
    roleExists(roleName: string): Promise<boolean>;
    getAllRoles(): Promise<string[]>;
    /** Throws when a role does not exist or a user is already in a role (nothing is changed). */
    addUsersToRoles(userNames: readonly string[], roleNames: readonly string[]): Promise<void>;
    /** Throws when a role does not exist or a user is not in a role (nothing is changed). */
    removeUsersFromRoles(userNames: readonly string[], roleNames: readonly string[]): Promise<void>;
    getRolesForUser(userName: string): Promise<string[]>;
    getUsersInRole(roleName: string): Promise<string[]>;
    removeUserFromAllRoles(userName: string): Promise<void>;
}
/** LIKE pattern (`%`, `_`) to a case-insensitive RegExp. */
export declare function likeToRegExp(pattern: string): RegExp;
export declare class InMemoryUserStore implements IUserStore {
    private readonly requireUniqueEmail;
    private readonly byName;
    /** @param requireUniqueEmail Reject a second user with the same e-mail (default true, like requiresUniqueEmail). */
    constructor(requireUniqueEmail?: boolean);
    findByName(userName: string): Promise<UserRecord | null>;
    findByEmail(email: string): Promise<UserRecord | null>;
    findByKey(key: string): Promise<UserRecord | null>;
    create(record: UserRecord): Promise<void>;
    update(record: UserRecord): Promise<void>;
    delete(userName: string): Promise<boolean>;
    list(skip: number, take: number): Promise<Page<UserRecord>>;
    search(field: "userName" | "email", pattern: string, skip: number, take: number): Promise<Page<UserRecord>>;
    countActiveSince(sinceMs: number): Promise<number>;
}
export declare class InMemoryRoleStore implements IRoleStore {
    private readonly roles;
    createRole(roleName: string): Promise<void>;
    deleteRole(roleName: string, throwOnPopulated: boolean): Promise<boolean>;
    roleExists(roleName: string): Promise<boolean>;
    getAllRoles(): Promise<string[]>;
    private resolve;
    addUsersToRoles(userNames: readonly string[], roleNames: readonly string[]): Promise<void>;
    removeUsersFromRoles(userNames: readonly string[], roleNames: readonly string[]): Promise<void>;
    /** Adds a membership immediately (creating the role if needed). For seeding, where awaiting is not possible. */
    addSync(userName: string, roleName: string): void;
    getRolesForUser(userName: string): Promise<string[]>;
    /** Synchronous read for providers that must answer `isInRole` without awaiting (in-memory only). */
    getRolesForUserSync(userName: string): string[];
    getUsersInRole(roleName: string): Promise<string[]>;
    removeUserFromAllRoles(userName: string): Promise<void>;
}
/** The minimal assertion API the contract cases need (node:assert/strict satisfies it). */
export interface ContractAssert {
    equal(actual: unknown, expected: unknown, message?: string): void;
    ok(value: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    rejects(promise: Promise<unknown>, expected?: unknown): Promise<void>;
}
export interface ContractCase {
    name: string;
    run(assert: ContractAssert): Promise<void>;
}
/** Behaviour every IUserStore must have. Drive it from any test runner: `for (const c of userStoreContractCases(make)) test(c.name, () => c.run(assert))`. */
export declare function userStoreContractCases(make: () => IUserStore | Promise<IUserStore>): ContractCase[];
export declare function roleStoreContractCases(make: () => IRoleStore | Promise<IRoleStore>): ContractCase[];
