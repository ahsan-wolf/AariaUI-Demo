import { PasswordPolicy } from "../password-policy.js";
import type { IUser, MembershipCreateResult } from "../membership-types.js";
import type { IPasswordHasher } from "./password-hasher.js";
import { StoreMembershipProvider } from "./store-membership-provider.js";
import type { IAuditSink } from "./audit.js";
export interface SeedUser extends IUser {
    password: string;
    passwordAnswer?: string | undefined;
}
export interface InMemoryAuthProviderOptions {
    name?: string | undefined;
    /** Lock the account after this many consecutive failures (no time window). Default 5. */
    maxInvalidPasswordAttempts?: number | undefined;
    /** Optional Membership password rules. When omitted a minimal "at least 4 characters" rule applies (demo accounts). */
    passwordPolicy?: PasswordPolicy | undefined;
    users?: SeedUser[] | undefined;
    /** Default: PBKDF2-HMAC-SHA256 with 600000 iterations. Tests and demos may pass `Pbkdf2PasswordHasher.forTesting()`. */
    hasher?: IPasswordHasher | undefined;
    auditSink?: IAuditSink | undefined;
    now?: (() => number) | undefined;
}
/**
 * A membership provider that keeps everything in memory. Passwords and security answers are HASHED (never stored in plain
 * text), so it is safe to hold in a browser tab, but it is still only as persistent and as trustworthy as the page: use
 * StoreMembershipProvider with your own IUserStore on a server for real accounts. Seed users are hashed on first use.
 */
export declare class InMemoryAuthProvider extends StoreMembershipProvider {
    private readonly seeds;
    private readonly memberRoles;
    private readonly users;
    private seeding;
    constructor(options?: InMemoryAuthProviderOptions);
    protected ready(): Promise<void>;
    private seed;
    createUser(userName: string, password: string, email?: string | undefined, passwordQuestion?: string | undefined, passwordAnswer?: string | undefined, isApproved?: boolean): Promise<MembershipCreateResult>;
    getRolesForUser(userName?: string | undefined): string[];
}
