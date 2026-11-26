import { StoreConflictError } from "./user-store.js";
/** The full ASP.NET RoleProvider over an IRoleStore (any database). Same behaviour as the in-memory provider. */
export class StoreRoleProvider {
    store;
    options;
    name;
    constructor(store, options = {}) {
        this.store = store;
        this.options = options;
        this.name = options.name ?? "StoreRoleProvider";
    }
    audit(type, detail) {
        try {
            void this.options.auditSink?.write({ type, at: (this.options.now ?? Date.now)(), success: true, reason: detail });
        }
        catch { /* never break the operation */ }
    }
    async createRole(roleName) {
        const name = String(roleName ?? "").trim();
        if (!name)
            throw new Error("Role name cannot be empty.");
        if (name.includes(",") || name.length > 256)
            throw new Error("Role name cannot contain commas or exceed 256 characters.");
        try {
            await this.store.createRole(name);
        }
        catch (e) {
            if (e instanceof StoreConflictError)
                throw new Error(`Role '${name}' already exists.`);
            throw e;
        }
        this.audit("role.created", name);
    }
    async deleteRole(roleName, throwOnPopulatedRole = false) {
        const ok = await this.store.deleteRole(roleName, throwOnPopulatedRole);
        if (ok)
            this.audit("role.deleted", roleName);
        return ok;
    }
    roleExists(roleName) { return this.store.roleExists(roleName); }
    getAllRoles() { return this.store.getAllRoles(); }
    async addUsersToRoles(userNames, roleNames) {
        await this.store.addUsersToRoles(userNames, roleNames);
        this.audit("role.assigned", `${userNames.length} user(s) to ${roleNames.join("|")}`);
    }
    async removeUsersFromRoles(userNames, roleNames) {
        await this.store.removeUsersFromRoles(userNames, roleNames);
        this.audit("role.removed", `${userNames.length} user(s) from ${roleNames.join("|")}`);
    }
    getRolesForUser(userName) { return this.store.getRolesForUser(userName); }
    getUsersInRole(roleName) { return this.store.getUsersInRole(roleName); }
    async isUserInRole(userName, roleName) {
        const lowerRole = roleName.toLowerCase();
        return (await this.store.getRolesForUser(userName)).some((r) => r.toLowerCase() === lowerRole);
    }
    async findUsersInRole(roleName, userNameToMatch) {
        const m = userNameToMatch.toLowerCase();
        return (await this.store.getUsersInRole(roleName)).filter((u) => u.toLowerCase().includes(m));
    }
}
//# sourceMappingURL=store-role-provider.js.map