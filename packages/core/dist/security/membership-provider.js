import { EventDispatcher } from "../events.js";
export class InMemoryAuthProvider {
    name;
    maxInvalidPasswordAttempts;
    users = new Map();
    currentUser = null;
    constructor(options = {}) {
        this.name = options.name ?? "InMemoryAuthProvider";
        this.maxInvalidPasswordAttempts = options.maxInvalidPasswordAttempts ?? 5;
        if (options.users) {
            for (const u of options.users) {
                const stored = {
                    userName: u.userName,
                    password: u.password,
                    email: u.email,
                    roles: u.roles ? [...u.roles] : [],
                    isLockedOut: u.isLockedOut ?? false,
                    isApproved: u.isApproved ?? true,
                    lastLoginDate: u.lastLoginDate,
                    passwordQuestion: u.passwordQuestion,
                    passwordAnswer: u.passwordAnswer,
                    customData: u.customData ? { ...u.customData } : undefined,
                    failedPasswordAttempts: 0,
                };
                this.users.set(u.userName.toLowerCase(), stored);
            }
        }
    }
    async validateUser(userName, password) {
        const user = this.users.get(userName.toLowerCase());
        if (!user)
            return false;
        if (user.isLockedOut || !user.isApproved)
            return false;
        if (user.password === password) {
            user.failedPasswordAttempts = 0;
            return true;
        }
        user.failedPasswordAttempts++;
        if (user.failedPasswordAttempts >= this.maxInvalidPasswordAttempts) {
            user.isLockedOut = true;
        }
        return false;
    }
    async getUser(userName) {
        const user = this.users.get(userName.toLowerCase());
        if (!user)
            return null;
        return this.cloneUser(user);
    }
    getCurrentUser() {
        return this.currentUser ? this.cloneUser(this.currentUser) : null;
    }
    async createUser(userName, password, email, passwordQuestion, passwordAnswer, isApproved = true) {
        const normalizedKey = userName.trim().toLowerCase();
        if (!normalizedKey) {
            return { status: "InvalidUserName", errorMessage: "User name cannot be empty." };
        }
        if (!password || password.length < 4) {
            return { status: "InvalidPassword", errorMessage: "Password must be at least 4 characters." };
        }
        if (this.users.has(normalizedKey)) {
            return { status: "DuplicateUserName", errorMessage: "A user with that name already exists." };
        }
        if (email) {
            for (const existing of this.users.values()) {
                if (existing.email && existing.email.toLowerCase() === email.toLowerCase()) {
                    return { status: "DuplicateEmail", errorMessage: "A user with that email already exists." };
                }
            }
        }
        const newUser = {
            userName: userName.trim(),
            password,
            email,
            roles: ["User"],
            isLockedOut: false,
            isApproved,
            passwordQuestion,
            passwordAnswer,
            failedPasswordAttempts: 0,
        };
        this.users.set(normalizedKey, newUser);
        return {
            status: "Success",
            user: this.cloneUser(newUser),
        };
    }
    async changePassword(userName, oldPassword, newPassword) {
        const user = this.users.get(userName.toLowerCase());
        if (!user || user.password !== oldPassword)
            return false;
        if (!newPassword || newPassword.length < 4)
            return false;
        user.password = newPassword;
        return true;
    }
    async resetPassword(userName, answer) {
        const user = this.users.get(userName.toLowerCase());
        if (!user || user.isLockedOut)
            return null;
        if (user.passwordAnswer) {
            if (!answer || answer.trim().toLowerCase() !== user.passwordAnswer.trim().toLowerCase()) {
                return null;
            }
        }
        const tempPassword = `Temp#${Math.random().toString(36).substring(2, 8)}!`;
        user.password = tempPassword;
        user.failedPasswordAttempts = 0;
        return tempPassword;
    }
    async getPasswordQuestion(userName) {
        const user = this.users.get(userName.toLowerCase());
        return user?.passwordQuestion ?? null;
    }
    async unlockUser(userName) {
        const user = this.users.get(userName.toLowerCase());
        if (!user)
            return false;
        user.isLockedOut = false;
        user.failedPasswordAttempts = 0;
        return true;
    }
    async login(userName, password, _rememberMe = false) {
        const isValid = await this.validateUser(userName, password);
        if (!isValid)
            return false;
        const user = this.users.get(userName.toLowerCase());
        user.lastLoginDate = new Date();
        this.currentUser = this.cloneUser(user);
        SecurityManager.notifyCurrentUserChanged(this.currentUser);
        return true;
    }
    async logout() {
        this.currentUser = null;
        SecurityManager.notifyCurrentUserChanged(null);
    }
    isInRole(role, userName) {
        const targetName = userName ?? this.currentUser?.userName;
        if (!targetName)
            return false;
        const user = this.users.get(targetName.toLowerCase());
        if (!user || !user.roles)
            return false;
        return user.roles.some((r) => r.toLowerCase() === role.toLowerCase());
    }
    getRolesForUser(userName) {
        const targetName = userName ?? this.currentUser?.userName;
        if (!targetName)
            return [];
        const user = this.users.get(targetName.toLowerCase());
        return user?.roles ? [...user.roles] : [];
    }
    cloneUser(source) {
        return {
            userName: source.userName,
            email: source.email,
            roles: source.roles ? [...source.roles] : [],
            isLockedOut: source.isLockedOut,
            isApproved: source.isApproved,
            lastLoginDate: source.lastLoginDate ? new Date(source.lastLoginDate.getTime()) : undefined,
            passwordQuestion: source.passwordQuestion,
            customData: source.customData ? { ...source.customData } : undefined,
        };
    }
}
export class SecurityManager {
    static provider = new InMemoryAuthProvider({
        users: [
            {
                userName: "admin",
                password: "Password123!",
                email: "admin@example.com",
                roles: ["Administrators", "Users"],
                passwordQuestion: "What is your favorite color?",
                passwordAnswer: "blue",
            },
            {
                userName: "user",
                password: "Password123!",
                email: "user@example.com",
                roles: ["Users"],
                passwordQuestion: "What is your pet's name?",
                passwordAnswer: "fluffy",
            },
        ],
    });
    static currentUserChanged = new EventDispatcher();
    static get defaultProvider() {
        return SecurityManager.provider;
    }
    static setProvider(provider) {
        SecurityManager.provider = provider;
        SecurityManager.currentUserChanged.emit(provider, provider.getCurrentUser());
    }
    static notifyCurrentUserChanged(user) {
        SecurityManager.currentUserChanged.emit(SecurityManager.provider, user);
    }
}
//# sourceMappingURL=membership-provider.js.map