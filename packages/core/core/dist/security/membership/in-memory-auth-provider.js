import { PasswordPolicy } from "../password-policy.js";
import { SecurityManager } from "../security-manager.js";
import { InMemoryRoleStore, InMemoryUserStore } from "./user-store.js";
import { StoreMembershipProvider } from "./store-membership-provider.js";
import { randomToken } from "./crypto.js";
/**
 * A membership provider that keeps everything in memory. Passwords and security answers are HASHED (never stored in plain
 * text), so it is safe to hold in a browser tab, but it is still only as persistent and as trustworthy as the page: use
 * StoreMembershipProvider with your own IUserStore on a server for real accounts. Seed users are hashed on first use.
 */
export class InMemoryAuthProvider extends StoreMembershipProvider {
    seeds;
    memberRoles;
    users;
    seeding;
    constructor(options = {}) {
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
        for (const u of this.seeds)
            for (const role of u.roles ?? [])
                roles.addSync(u.userName, role);
    }
    async ready() {
        this.seeding ??= this.seed();
        await this.seeding;
    }
    async seed() {
        const t = this.now();
        for (const u of this.seeds) {
            const rec = {
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
    async createUser(userName, password, email, passwordQuestion, passwordAnswer, isApproved = true) {
        const result = await super.createUser(userName, password, email, passwordQuestion, passwordAnswer, isApproved);
        if (result.status === "Success" && result.user) {
            this.memberRoles.addSync(result.user.userName, "User"); // new accounts start in the "User" role
            await this.refreshRoles(result.user.userName);
            return { ...result, user: { ...result.user, roles: this.getRolesForUser(result.user.userName) } };
        }
        return result;
    }
    // The in-memory provider can answer role questions synchronously for any user.
    getRolesForUser(userName) {
        const target = userName ?? this.getCurrentUser()?.userName;
        return target ? this.memberRoles.getRolesForUserSync(target) : [];
    }
}
// The provider used until an application calls SecurityManager.setProvider(...): EMPTY, so there are no built-in accounts.
SecurityManager.registerDefaultProviderFactory(() => new InMemoryAuthProvider({ name: "DefaultInMemoryAuthProvider" }));
//# sourceMappingURL=in-memory-auth-provider.js.map