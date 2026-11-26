import { EventDispatcher } from "../../events.js";
import { PasswordPolicy } from "../password-policy.js";
import { SecurityManager } from "../security-manager.js";
import { constantTimeEqual, hashToken, randomString, randomToken, secureRandom } from "./crypto.js";
import { Pbkdf2PasswordHasher } from "./password-hasher.js";
import { InMemoryRoleStore, StoreConflictError } from "./user-store.js";
const MS_PER_MINUTE = 60_000;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const lower = (s) => s.toLowerCase();
const normalizeAnswer = (a) => a.normalize("NFKC").trim().toLowerCase();
/**
 * The complete ASP.NET Membership model on top of an IUserStore: hashed passwords and security answers, lockout with an
 * attempt window, reset tokens, administration, online users, audit events. Runs in the browser and on a Node server.
 *
 * Security properties (each is covered by a test): no plain-text secrets are stored; an unknown user costs the same
 * hashing work as a known one and gets the same answer; locked or unapproved users cannot sign in even with the right
 * password; failed attempts count only inside the window; reset tokens are random, hashed at rest, single-use and expiring.
 */
export class StoreMembershipProvider {
    name;
    applicationName;
    requiresQuestionAndAnswer;
    passwordPolicy;
    userValidated = new EventDispatcher();
    userLockedOut = new EventDispatcher();
    passwordChanged = new EventDispatcher();
    userStore;
    roleStore;
    hasher;
    now;
    maxAttempts;
    windowMs;
    lockoutMs;
    onlineMs;
    resetMs;
    audit;
    dummyHash;
    currentUser = null;
    roleCache = new Map();
    constructor(options) {
        this.name = options.name ?? "StoreMembershipProvider";
        this.applicationName = options.applicationName ?? "/";
        this.userStore = options.userStore;
        this.roleStore = options.roleStore ?? new InMemoryRoleStore();
        this.hasher = options.hasher ?? new Pbkdf2PasswordHasher();
        this.passwordPolicy = options.passwordPolicy ?? new PasswordPolicy({ minRequiredLength: 10, minRequiredNonAlphanumericCharacters: 0 });
        this.requiresQuestionAndAnswer = options.requiresQuestionAndAnswer ?? false;
        this.maxAttempts = Math.max(1, options.maxInvalidPasswordAttempts ?? 5);
        this.windowMs = (options.passwordAttemptWindowMinutes ?? 10) * MS_PER_MINUTE;
        this.lockoutMs = options.lockoutDurationMinutes === undefined ? undefined : options.lockoutDurationMinutes * MS_PER_MINUTE;
        this.onlineMs = (options.userIsOnlineTimeWindowMinutes ?? 15) * MS_PER_MINUTE;
        this.resetMs = (options.resetTokenLifetimeMinutes ?? 30) * MS_PER_MINUTE;
        this.audit = options.auditSink;
        this.now = options.now ?? (() => Date.now());
    }
    /** Hook run before every operation (the in-memory provider seeds its users here). */
    async ready() { }
    // ------------------------------------------------------------------------------------------- validation and sign-in
    async validateUser(userName, password) {
        await this.ready();
        const rec = typeof userName === "string" ? await this.userStore.findByName(userName.trim()) : null;
        // One verification no matter what, so the response time does not reveal whether the user exists or is locked.
        const ok = await this.hasher.verify(String(password ?? ""), rec?.passwordHash ?? (await this.getDummyHash()));
        if (!rec)
            return this.validated(userName, false, "unknown-user");
        if (rec.isLockedOut && this.lockoutMs !== undefined && rec.lastLockoutDate !== undefined && this.now() >= rec.lastLockoutDate + this.lockoutMs) {
            rec.isLockedOut = false;
            rec.failedPasswordAttempts = 0;
            rec.failedPasswordWindowStart = undefined;
            await this.userStore.update(rec);
        }
        if (rec.isLockedOut)
            return this.validated(rec.userName, false, "locked");
        if (!rec.isApproved)
            return this.validated(rec.userName, false, "not-approved");
        if (!ok) {
            await this.registerFailure(rec, "password");
            return this.validated(rec.userName, false, "bad-password");
        }
        let dirty = false;
        if (rec.failedPasswordAttempts !== 0 || rec.failedPasswordWindowStart !== undefined) {
            rec.failedPasswordAttempts = 0;
            rec.failedPasswordWindowStart = undefined;
            dirty = true;
        }
        if (this.hasher.needsRehash(rec.passwordHash)) {
            rec.passwordHash = await this.hasher.hash(password);
            dirty = true;
        }
        if (dirty)
            await this.userStore.update(rec);
        return this.validated(rec.userName, true);
    }
    async login(userName, password, _rememberMe = false) {
        if (!(await this.validateUser(userName, password)))
            return false;
        const rec = (await this.userStore.findByName(userName.trim()));
        const t = this.now();
        rec.lastLoginDate = t;
        rec.lastActivityDate = t;
        await this.userStore.update(rec);
        await this.refreshRoles(rec.userName);
        this.currentUser = this.toUser(rec);
        SecurityManager.notifyCurrentUserChanged(this.getCurrentUser());
        return true;
    }
    async logout() {
        if (this.currentUser)
            this.write({ type: "logout", userName: this.currentUser.userName, success: true });
        this.currentUser = null;
        SecurityManager.notifyCurrentUserChanged(null);
    }
    getCurrentUser() {
        return this.currentUser ? this.copyUser(this.currentUser) : null;
    }
    // ------------------------------------------------------------------------------------------- create / read
    async createUser(userName, password, email, passwordQuestion, passwordAnswer, isApproved = true) {
        await this.ready();
        const name = String(userName ?? "").trim();
        // eslint-disable-next-line no-control-regex
        if (!name || name.length > 256 || /[\u0000-\u001f\u007f,]/.test(name))
            return { status: "InvalidUserName", errorMessage: "User name is empty, too long, or contains invalid characters." };
        const mail = email === undefined || email === "" ? undefined : String(email).trim();
        if (mail !== undefined && !EMAIL.test(mail))
            return { status: "InvalidEmail", errorMessage: "E-mail address is not valid." };
        const errors = this.passwordPolicy.validate(String(password ?? ""));
        if (errors.length > 0)
            return { status: "InvalidPassword", errorMessage: errors.join(" ") };
        const q = passwordQuestion?.trim() || undefined;
        const a = passwordAnswer === undefined ? undefined : normalizeAnswer(passwordAnswer);
        if (this.requiresQuestionAndAnswer || q !== undefined || a !== undefined) {
            if (!q)
                return { status: "InvalidQuestion", errorMessage: "A security question is required." };
            if (!a || a.length < 3)
                return { status: "InvalidAnswer", errorMessage: "A security answer of at least 3 characters is required." };
        }
        if (await this.userStore.findByName(name))
            return { status: "DuplicateUserName", errorMessage: "A user with that name already exists." };
        if (mail && (await this.userStore.findByEmail(mail)))
            return { status: "DuplicateEmail", errorMessage: "A user with that e-mail already exists." };
        const t = this.now();
        const rec = {
            key: randomToken(16), userName: name, email: mail, passwordHash: await this.hasher.hash(password),
            passwordQuestion: q, passwordAnswerHash: a ? await this.hasher.hash(a) : undefined,
            isApproved, isLockedOut: false, failedPasswordAttempts: 0, failedAnswerAttempts: 0,
            creationDate: t, lastPasswordChangedDate: t, lastActivityDate: t,
        };
        try {
            await this.userStore.create(rec);
        }
        catch (e) {
            if (e instanceof StoreConflictError)
                return { status: e.field === "email" ? "DuplicateEmail" : "DuplicateUserName", errorMessage: e.message };
            return { status: "ProviderError", errorMessage: "The user could not be created." };
        }
        this.write({ type: "user.created", userName: name, success: true });
        return { status: "Success", user: this.toUser(rec) };
    }
    async getUser(userName) {
        await this.ready();
        const rec = await this.userStore.findByName(userName);
        return rec ? this.toUser(rec, await this.rolesFor(rec.userName)) : null;
    }
    async getPasswordQuestion(userName) {
        await this.ready();
        return (await this.userStore.findByName(userName))?.passwordQuestion ?? null;
    }
    // ------------------------------------------------------------------------------------------- passwords
    async changePassword(userName, oldPassword, newPassword) {
        if (!(await this.validateUser(userName, oldPassword)))
            return false;
        if (this.passwordPolicy.validate(String(newPassword ?? "")).length > 0)
            return false;
        const rec = (await this.userStore.findByName(userName.trim()));
        rec.passwordHash = await this.hasher.hash(newPassword);
        rec.lastPasswordChangedDate = this.now();
        rec.resetTokenHash = undefined;
        rec.resetTokenExpires = undefined;
        await this.userStore.update(rec);
        this.write({ type: "password.changed", userName: rec.userName, success: true });
        void this.passwordChanged.emit(this, { userName: rec.userName });
        return true;
    }
    async changePasswordQuestionAndAnswer(userName, password, newQuestion, newAnswer) {
        if (!(await this.validateUser(userName, password)))
            return false;
        const q = newQuestion?.trim();
        const a = normalizeAnswer(String(newAnswer ?? ""));
        if (!q || a.length < 3)
            return false;
        const rec = (await this.userStore.findByName(userName.trim()));
        rec.passwordQuestion = q;
        rec.passwordAnswerHash = await this.hasher.hash(a);
        await this.userStore.update(rec);
        this.write({ type: "question.changed", userName: rec.userName, success: true });
        return true;
    }
    /**
     * Legacy ASP.NET reset: checks the security answer and returns a NEW random password (shown once, stored hashed).
     * Prefer createPasswordResetToken / resetPasswordWithToken, which never exposes a password.
     */
    async resetPassword(userName, answer) {
        await this.ready();
        const rec = await this.userStore.findByName(String(userName ?? "").trim());
        const answerOk = await this.hasher.verify(normalizeAnswer(String(answer ?? "")), rec?.passwordAnswerHash ?? (await this.getDummyHash()));
        if (!rec || rec.isLockedOut || !rec.isApproved)
            return null;
        if (rec.passwordAnswerHash) {
            if (!answerOk) {
                await this.registerFailure(rec, "answer");
                this.write({ type: "password.reset-failed", userName: rec.userName, success: false, reason: "bad-answer" });
                return null;
            }
        }
        else if (this.requiresQuestionAndAnswer) {
            return null;
        }
        const temp = this.generatePassword();
        rec.passwordHash = await this.hasher.hash(temp);
        rec.lastPasswordChangedDate = this.now();
        rec.failedPasswordAttempts = 0;
        rec.failedPasswordWindowStart = undefined;
        rec.failedAnswerAttempts = 0;
        rec.failedAnswerWindowStart = undefined;
        rec.resetTokenHash = undefined;
        rec.resetTokenExpires = undefined;
        await this.userStore.update(rec);
        this.write({ type: "password.reset", userName: rec.userName, success: true });
        return temp;
    }
    async createPasswordResetToken(userName) {
        await this.ready();
        const rec = await this.userStore.findByName(String(userName ?? "").trim());
        const token = randomToken(32);
        const hash = await hashToken(token); // same work whether or not the user exists
        if (!rec || !rec.isApproved) {
            this.write({ type: "password.reset-requested", success: false, reason: "unknown-user" });
            return null;
        }
        const expiresAt = this.now() + this.resetMs;
        rec.resetTokenHash = hash;
        rec.resetTokenExpires = expiresAt; // a new token replaces (invalidates) any earlier one
        await this.userStore.update(rec);
        this.write({ type: "password.reset-requested", userName: rec.userName, success: true });
        return { token, expiresAt };
    }
    async resetPasswordWithToken(userName, token, newPassword) {
        await this.ready();
        const rec = await this.userStore.findByName(String(userName ?? "").trim());
        const presented = await hashToken(String(token ?? ""));
        const stored = rec?.resetTokenHash ?? presented.replace(/./g, "0");
        const match = constantTimeEqual(presented, stored);
        const fresh = rec?.resetTokenExpires !== undefined && this.now() <= rec.resetTokenExpires;
        if (!rec || !rec.resetTokenHash || !match || !fresh) {
            this.write({ type: "password.reset-failed", userName: rec?.userName, success: false, reason: "invalid-token" });
            return "InvalidToken";
        }
        if (this.passwordPolicy.validate(String(newPassword ?? "")).length > 0)
            return "InvalidPassword"; // token stays valid for a retry
        rec.passwordHash = await this.hasher.hash(newPassword);
        rec.lastPasswordChangedDate = this.now();
        rec.resetTokenHash = undefined;
        rec.resetTokenExpires = undefined; // single use
        rec.isLockedOut = false;
        rec.failedPasswordAttempts = 0;
        rec.failedPasswordWindowStart = undefined;
        await this.userStore.update(rec);
        this.write({ type: "password.reset", userName: rec.userName, success: true });
        void this.passwordChanged.emit(this, { userName: rec.userName });
        return "Success";
    }
    async unlockUser(userName) {
        await this.ready();
        const rec = await this.userStore.findByName(String(userName ?? "").trim());
        if (!rec)
            return false;
        rec.isLockedOut = false;
        rec.failedPasswordAttempts = 0;
        rec.failedPasswordWindowStart = undefined;
        rec.failedAnswerAttempts = 0;
        rec.failedAnswerWindowStart = undefined;
        await this.userStore.update(rec);
        this.write({ type: "user.unlocked", userName: rec.userName, success: true });
        return true;
    }
    // ------------------------------------------------------------------------------------------- administration
    async getUserNameByEmail(email) {
        await this.ready();
        return (await this.userStore.findByEmail(String(email ?? "").trim()))?.userName ?? null;
    }
    async getAllUsers(pageIndex, pageSize) {
        await this.ready();
        const { skip, take } = pageArgs(pageIndex, pageSize);
        const page = await this.userStore.list(skip, take);
        return { total: page.total, items: page.items.map((r) => this.toUser(r)) };
    }
    async findUsersByName(pattern, pageIndex, pageSize) {
        await this.ready();
        const { skip, take } = pageArgs(pageIndex, pageSize);
        const page = await this.userStore.search("userName", pattern, skip, take);
        return { total: page.total, items: page.items.map((r) => this.toUser(r)) };
    }
    async findUsersByEmail(pattern, pageIndex, pageSize) {
        await this.ready();
        const { skip, take } = pageArgs(pageIndex, pageSize);
        const page = await this.userStore.search("email", pattern, skip, take);
        return { total: page.total, items: page.items.map((r) => this.toUser(r)) };
    }
    async getNumberOfUsersOnline() {
        await this.ready();
        return this.userStore.countActiveSince(this.now() - this.onlineMs);
    }
    async updateUser(update) {
        await this.ready();
        const rec = await this.userStore.findByName(update.userName);
        if (!rec)
            return false;
        if (update.email !== undefined) {
            const mail = update.email.trim();
            if (mail !== "" && !EMAIL.test(mail))
                return false;
            rec.email = mail === "" ? undefined : mail;
        }
        if (update.comment !== undefined)
            rec.comment = update.comment;
        if (update.isApproved !== undefined)
            rec.isApproved = update.isApproved;
        try {
            await this.userStore.update(rec);
        }
        catch (e) {
            if (e instanceof StoreConflictError)
                return false;
            throw e;
        }
        this.write({ type: "user.updated", userName: rec.userName, success: true });
        return true;
    }
    async deleteUser(userName) {
        await this.ready();
        const rec = await this.userStore.findByName(userName);
        if (!rec)
            return false;
        await this.userStore.delete(rec.userName);
        await this.roleStore.removeUserFromAllRoles(rec.userName);
        this.roleCache.delete(lower(rec.userName));
        this.write({ type: "user.deleted", userName: rec.userName, success: true });
        return true;
    }
    // ------------------------------------------------------------------------------------------- roles (sync from cache, async from the store)
    isInRole(role, userName) {
        return this.getRolesForUser(userName).some((r) => lower(r) === lower(role));
    }
    /** Synchronous: answers from the roles loaded at sign-in or by getRolesForUserAsync / refreshRoles. Unknown users give []. */
    getRolesForUser(userName) {
        const target = userName ?? this.currentUser?.userName;
        return target ? [...(this.roleCache.get(lower(target)) ?? [])] : [];
    }
    async getRolesForUserAsync(userName) {
        await this.ready();
        return this.refreshRoles(userName);
    }
    async isInRoleAsync(userName, role) {
        return (await this.getRolesForUserAsync(userName)).some((r) => lower(r) === lower(role));
    }
    /** Reloads one user's roles from the role store into the synchronous cache. Call it after changing memberships. */
    async refreshRoles(userName) {
        const roles = await this.roleStore.getRolesForUser(userName);
        this.roleCache.set(lower(userName), roles);
        if (this.currentUser && lower(this.currentUser.userName) === lower(userName))
            this.currentUser = { ...this.currentUser, roles: [...roles] };
        return [...roles];
    }
    // ------------------------------------------------------------------------------------------- internals
    write(event) {
        if (!this.audit)
            return;
        try {
            const r = this.audit.write({ ...event, at: this.now() });
            if (r instanceof Promise)
                r.catch(() => { });
        }
        catch { /* same */ }
    }
    async validated(userName, success, reason) {
        this.write({ type: success ? "login.success" : reason === "locked" ? "login.locked-out" : "login.failure", userName, success, reason });
        void this.userValidated.emit(this, { userName, success, reason });
        return success;
    }
    async registerFailure(rec, kind) {
        const t = this.now();
        const startKey = kind === "password" ? "failedPasswordWindowStart" : "failedAnswerWindowStart";
        const countKey = kind === "password" ? "failedPasswordAttempts" : "failedAnswerAttempts";
        const start = rec[startKey];
        if (start === undefined || t > start + this.windowMs) {
            rec[startKey] = t;
            rec[countKey] = 1;
        }
        else {
            rec[countKey]++;
        }
        if (rec[countKey] >= this.maxAttempts && !rec.isLockedOut) {
            rec.isLockedOut = true;
            rec.lastLockoutDate = t;
            this.write({ type: "login.locked-out", userName: rec.userName, success: false, reason: kind });
            void this.userLockedOut.emit(this, { userName: rec.userName });
        }
        await this.userStore.update(rec);
    }
    getDummyHash() {
        this.dummyHash ??= this.hasher.hash(randomToken(24));
        return this.dummyHash;
    }
    /** A strong random password that satisfies the policy (used by the legacy reset). */
    generatePassword() {
        for (let attempt = 0; attempt < 8; attempt++) {
            const chars = [
                randomString(1, "abcdefghijkmnopqrstuvwxyz"), randomString(1, "ABCDEFGHJKLMNPQRSTUVWXYZ"),
                randomString(1, "23456789"), randomString(1, "!@#$%^&*-_=+"),
                ...randomString(Math.max(12, this.passwordPolicy.minRequiredLength), "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*-_=+"),
            ];
            for (let i = chars.length - 1; i > 0; i--) { // Fisher-Yates shuffle driven by secure randomness (bias below 2^-24)
                const j = secureRandom(4).reduce((acc, b) => (acc * 256 + b) % (i + 1), 0);
                [chars[i], chars[j]] = [chars[j], chars[i]];
            }
            const pw = chars.join("");
            if (this.passwordPolicy.validate(pw).length === 0)
                return pw;
        }
        throw new Error("Could not generate a password that satisfies the password policy.");
    }
    async rolesFor(userName) {
        return this.roleCache.get(lower(userName)) ?? this.refreshRoles(userName);
    }
    toUser(rec, roles) {
        const t = this.now();
        return {
            userName: rec.userName,
            email: rec.email,
            roles: roles ? [...roles] : [...(this.roleCache.get(lower(rec.userName)) ?? [])],
            isLockedOut: rec.isLockedOut,
            isApproved: rec.isApproved,
            lastLoginDate: rec.lastLoginDate === undefined ? undefined : new Date(rec.lastLoginDate),
            passwordQuestion: rec.passwordQuestion,
            customData: rec.customData ? { ...rec.customData } : undefined,
            providerUserKey: rec.key,
            comment: rec.comment,
            creationDate: new Date(rec.creationDate),
            lastActivityDate: rec.lastActivityDate === undefined ? undefined : new Date(rec.lastActivityDate),
            lastPasswordChangedDate: new Date(rec.lastPasswordChangedDate),
            lastLockoutDate: rec.lastLockoutDate === undefined ? undefined : new Date(rec.lastLockoutDate),
            isOnline: rec.lastActivityDate !== undefined && rec.lastActivityDate >= t - this.onlineMs,
        };
    }
    copyUser(u) {
        return {
            ...u,
            roles: u.roles ? [...u.roles] : [],
            customData: u.customData ? { ...u.customData } : undefined,
            lastLoginDate: u.lastLoginDate ? new Date(u.lastLoginDate.getTime()) : undefined,
        };
    }
}
function pageArgs(pageIndex, pageSize) {
    const take = Math.min(1000, Math.max(1, Math.floor(pageSize) || 1));
    return { skip: Math.max(0, Math.floor(pageIndex) || 0) * take, take };
}
//# sourceMappingURL=store-membership-provider.js.map