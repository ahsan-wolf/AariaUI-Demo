import { SecurityManager } from "../../membership-provider.js";
/**
 * Membership provider that delegates to a server. Contract (all POST, JSON):
 *   login           {userName,password,rememberMe}      -> {success:boolean, user?:IUser}
 *   logout          {}                                  -> {}
 *   validateUser    {userName,password}                 -> {success}
 *   getUser         {userName}                          -> {user: IUser|null}
 *   createUser      {userName,password,email,...}       -> MembershipCreateResult
 *   changePassword  {userName,oldPassword,newPassword}  -> {success}
 *   resetPassword   {userName,answer}                   -> {password: string|null}
 *   getPasswordQuestion {userName}                      -> {question: string|null}
 *   unlockUser      {userName}                          -> {success}
 * Sessions/cookies are the server's responsibility; this class only caches the signed-in IUser for the UI.
 */
export class RestMembershipProvider {
    options;
    name;
    current = null;
    constructor(options) {
        this.options = options;
        this.name = options.name ?? "RestMembershipProvider";
    }
    async call(op, body) {
        const res = await this.options.fetchFn(`${this.options.baseUrl.replace(/\/+$/, "")}/${op}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(this.options.headers?.() ?? {}) },
            body: JSON.stringify(body)
        });
        if (!res.ok)
            throw new Error(`${this.name}: ${op} failed with HTTP ${res.status}`);
        return (await res.json());
    }
    async validateUser(userName, password) {
        return (await this.call("validateUser", { userName, password })).success === true;
    }
    async getUser(userName) {
        return (await this.call("getUser", { userName })).user ?? null;
    }
    getCurrentUser() {
        return this.current ? { ...this.current, roles: [...(this.current.roles ?? [])] } : null;
    }
    createUser(userName, password, email, passwordQuestion, passwordAnswer, isApproved) {
        return this.call("createUser", { userName, password, email, passwordQuestion, passwordAnswer, isApproved });
    }
    async changePassword(userName, oldPassword, newPassword) {
        return (await this.call("changePassword", { userName, oldPassword, newPassword })).success === true;
    }
    async resetPassword(userName, answer) {
        return (await this.call("resetPassword", { userName, answer })).password ?? null;
    }
    async getPasswordQuestion(userName) {
        return (await this.call("getPasswordQuestion", { userName })).question ?? null;
    }
    async unlockUser(userName) {
        return (await this.call("unlockUser", { userName })).success === true;
    }
    async login(userName, password, rememberMe = false) {
        const r = await this.call("login", { userName, password, rememberMe });
        if (!r.success)
            return false;
        this.current = r.user ?? { userName, roles: [] };
        SecurityManager.notifyCurrentUserChanged(this.getCurrentUser());
        return true;
    }
    async logout() {
        try {
            await this.call("logout", {});
        }
        finally {
            this.current = null;
            SecurityManager.notifyCurrentUserChanged(null);
        }
    }
    isInRole(role, userName) {
        if (userName && this.current?.userName.toLowerCase() !== userName.toLowerCase())
            return false; // other users need an async lookup
        return (this.current?.roles ?? []).some((r) => r.toLowerCase() === role.toLowerCase());
    }
    getRolesForUser(userName) {
        if (userName && this.current?.userName.toLowerCase() !== userName.toLowerCase())
            return [];
        return [...(this.current?.roles ?? [])];
    }
}
//# sourceMappingURL=rest-membership-provider.js.map