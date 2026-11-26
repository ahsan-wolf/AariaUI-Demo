import { PasswordPolicy } from "../password-policy.js";
import { SecurityManager } from "../security-manager.js";
import type { IUser, MembershipCreateResult } from "../membership-types.js";
import type { IPasswordHasher } from "./password-hasher.js";
import { InMemoryRoleStore, InMemoryUserStore, type UserRecord } from "./user-store.js";
import { StoreMembershipProvider } from "./store-membership-provider.js";
import { randomToken } from "./crypto.js";
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
export class InMemoryAuthProvider extends StoreMembershipProvider {
  private readonly seeds: SeedUser[];
  private readonly memberRoles: InMemoryRoleStore;
  private readonly users: InMemoryUserStore;
  private seeding: Promise<void> | undefined;

  constructor(options: InMemoryAuthProviderOptions = {}) {
    const users = new InMemoryUserStore(true);
    const roles = new InMemoryRoleStore();
    super({
      name: options.name ?? "InMemoryAuthProvider",
      userStore: users,
      roleStore: roles,
      hasher: options.hasher,
      maxInvalidPasswordAttempts: options.maxInvalidPasswordAttempts ?? 5,
      passwordAttemptWindowMinutes: Infinity,
      passwordPolicy: options.passwordPolicy ?? new PasswordPolicy({ minRequiredLength: 4, minRequiredNonAlphanumericCharacters: 0 }),
      auditSink: options.auditSink,
      now: options.now,
    });
    this.users = users;
    this.memberRoles = roles;
    this.seeds = options.users ?? [];
    // Roles need no hashing, so they are available immediately (isInRole is synchronous).
    for (const u of this.seeds) for (const role of u.roles ?? []) roles.addSync(u.userName, role);
  }

  protected override async ready(): Promise<void> {
    this.seeding ??= this.seed();
    await this.seeding;
  }

  private async seed(): Promise<void> {
    const t = this.now();
    for (const u of this.seeds) {
      const rec: UserRecord = {
        key: randomToken(16), userName: u.userName, email: u.email,
        passwordHash: await this.hasher.hash(u.password),
        passwordQuestion: u.passwordQuestion,
        passwordAnswerHash: u.passwordAnswer ? await this.hasher.hash(u.passwordAnswer.normalize("NFKC").trim().toLowerCase()) : undefined,
        isApproved: u.isApproved ?? true, isLockedOut: u.isLockedOut ?? false,
        failedPasswordAttempts: 0, failedAnswerAttempts: 0,
        creationDate: t, lastPasswordChangedDate: t,
        lastLoginDate: u.lastLoginDate?.getTime(),
        customData: u.customData ? { ...u.customData } : undefined,
      };
      await this.users.create(rec);
    }
  }

  override async createUser(
    userName: string,
    password: string,
    email?: string | undefined,
    passwordQuestion?: string | undefined,
    passwordAnswer?: string | undefined,
    isApproved: boolean = true
  ): Promise<MembershipCreateResult> {
    const result = await super.createUser(userName, password, email, passwordQuestion, passwordAnswer, isApproved);
    if (result.status === "Success" && result.user) {
      this.memberRoles.addSync(result.user.userName, "User"); // new accounts start in the "User" role
      await this.refreshRoles(result.user.userName);
      return { ...result, user: { ...result.user, roles: this.getRolesForUser(result.user.userName) } };
    }
    return result;
  }

  // The in-memory provider can answer role questions synchronously for any user.
  override getRolesForUser(userName?: string | undefined): string[] {
    const target = userName ?? this.getCurrentUser()?.userName;
    return target ? this.memberRoles.getRolesForUserSync(target) : [];
  }
}

// The provider used until an application calls SecurityManager.setProvider(...): EMPTY, so there are no built-in accounts.
SecurityManager.registerDefaultProviderFactory(() => new InMemoryAuthProvider({ name: "DefaultInMemoryAuthProvider" }));
