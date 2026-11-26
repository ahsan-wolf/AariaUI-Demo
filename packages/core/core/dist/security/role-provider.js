import { EventDispatcher } from "../events.js";
export class InMemoryRoleProvider {
    name;
    // lower-case role -> { display name, lower-case users }
    roles = new Map();
    constructor(options = {}) {
        this.name = options.name ?? "InMemoryRoleProvider";
        for (const [role, users] of Object.entries(options.roles ?? {})) {
            this.roles.set(role.toLowerCase(), { name: role, users: new Set(users.map((u) => u.toLowerCase())) });
        }
    }
    async createRole(roleName) {
        if (!roleName || roleName.trim() === "")
            throw new Error("Role name cannot be empty.");
        if (roleName.includes(","))
            throw new Error("Role name cannot contain commas.");
        const key = roleName.toLowerCase();
        if (this.roles.has(key))
            throw new Error(`Role '${roleName}' already exists.`);
        this.roles.set(key, { name: roleName, users: new Set() });
    }
    async deleteRole(roleName, throwOnPopulatedRole = false) {
        const r = this.roles.get(roleName.toLowerCase());
        if (!r)
            return false;
        if (throwOnPopulatedRole && r.users.size > 0)
            throw new Error(`Role '${roleName}' is not empty.`);
        return this.roles.delete(roleName.toLowerCase());
    }
    async roleExists(roleName) {
        return this.roles.has(roleName.toLowerCase());
    }
    async getAllRoles() {
        return [...this.roles.values()].map((r) => r.name);
    }
    resolve(roleNames) {
        return roleNames.map((n) => {
            const r = this.roles.get(n.toLowerCase());
            if (!r)
                throw new Error(`Role '${n}' does not exist.`);
            return r;
        });
    }
    async addUsersToRoles(userNames, roleNames) {
        const targets = this.resolve(roleNames);
        for (const r of targets) {
            for (const u of userNames) {
                if (r.users.has(u.toLowerCase()))
                    throw new Error(`User '${u}' is already in role '${r.name}'.`);
            }
        }
        for (const r of targets)
            for (const u of userNames)
                r.users.add(u.toLowerCase());
    }
    async removeUsersFromRoles(userNames, roleNames) {
        const targets = this.resolve(roleNames);
        for (const r of targets) {
            for (const u of userNames) {
                if (!r.users.has(u.toLowerCase()))
                    throw new Error(`User '${u}' is not in role '${r.name}'.`);
            }
        }
        for (const r of targets)
            for (const u of userNames)
                r.users.delete(u.toLowerCase());
    }
    async getRolesForUser(userName) {
        const u = userName.toLowerCase();
        return [...this.roles.values()].filter((r) => r.users.has(u)).map((r) => r.name);
    }
    async getUsersInRole(roleName) {
        const r = this.roles.get(roleName.toLowerCase());
        if (!r)
            throw new Error(`Role '${roleName}' does not exist.`);
        return [...r.users];
    }
    async isUserInRole(userName, roleName) {
        return this.roles.get(roleName.toLowerCase())?.users.has(userName.toLowerCase()) ?? false;
    }
    async findUsersInRole(roleName, userNameToMatch) {
        const m = userNameToMatch.toLowerCase();
        return (await this.getUsersInRole(roleName)).filter((u) => u.includes(m));
    }
}
/** Static facade, like System.Web.Security.Roles. */
export class Roles {
    static _provider = new InMemoryRoleProvider({
        roles: { Administrators: ["admin"], Users: ["admin", "user"] }
    });
    static providerChanged = new EventDispatcher();
    static get provider() { return Roles._provider; }
    static setProvider(p) {
        Roles._provider = p;
        void Roles.providerChanged.emit(Roles, p);
    }
    static createRole(r) { return Roles._provider.createRole(r); }
    static deleteRole(r, throwOnPopulatedRole) { return Roles._provider.deleteRole(r, throwOnPopulatedRole); }
    static roleExists(r) { return Roles._provider.roleExists(r); }
    static getAllRoles() { return Roles._provider.getAllRoles(); }
    static addUserToRole(u, r) { return Roles._provider.addUsersToRoles([u], [r]); }
    static addUserToRoles(u, r) { return Roles._provider.addUsersToRoles([u], r); }
    static addUsersToRole(u, r) { return Roles._provider.addUsersToRoles(u, [r]); }
    static removeUserFromRole(u, r) { return Roles._provider.removeUsersFromRoles([u], [r]); }
    static getRolesForUser(u) { return Roles._provider.getRolesForUser(u); }
    static getUsersInRole(r) { return Roles._provider.getUsersInRole(r); }
    static isUserInRole(u, r) { return Roles._provider.isUserInRole(u, r); }
}
//# sourceMappingURL=role-provider.js.map