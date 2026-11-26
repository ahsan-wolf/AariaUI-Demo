import type { IRoleProvider } from "../role-provider.js";
import type { IAuditSink } from "./audit.js";
import { StoreConflictError, type IRoleStore } from "./user-store.js";

/** The full ASP.NET RoleProvider over an IRoleStore (any database). Same behaviour as the in-memory provider. */
export class StoreRoleProvider implements IRoleProvider {
  readonly name: string;

  constructor(
    private readonly store: IRoleStore,
    private readonly options: { name?: string | undefined; auditSink?: IAuditSink | undefined; now?: (() => number) | undefined } = {}
  ) {
    this.name = options.name ?? "StoreRoleProvider";
  }

  private audit(type: "role.created" | "role.deleted" | "role.assigned" | "role.removed", detail: string): void {
    try { void this.options.auditSink?.write({ type, at: (this.options.now ?? Date.now)(), success: true, reason: detail }); } catch { /* never break the operation */ }
  }

  async createRole(roleName: string): Promise<void> {
    const name = String(roleName ?? "").trim();
    if (!name) throw new Error("Role name cannot be empty.");
    if (name.includes(",") || name.length > 256) throw new Error("Role name cannot contain commas or exceed 256 characters.");
    try { await this.store.createRole(name); } catch (e) { if (e instanceof StoreConflictError) throw new Error(`Role '${name}' already exists.`); throw e; }
    this.audit("role.created", name);
  }

  async deleteRole(roleName: string, throwOnPopulatedRole = false): Promise<boolean> {
    const ok = await this.store.deleteRole(roleName, throwOnPopulatedRole);
    if (ok) this.audit("role.deleted", roleName);
    return ok;
  }

  roleExists(roleName: string): Promise<boolean> { return this.store.roleExists(roleName); }
  getAllRoles(): Promise<string[]> { return this.store.getAllRoles(); }

  async addUsersToRoles(userNames: string[], roleNames: string[]): Promise<void> {
    await this.store.addUsersToRoles(userNames, roleNames);
    this.audit("role.assigned", `${userNames.length} user(s) to ${roleNames.join("|")}`);
  }

  async removeUsersFromRoles(userNames: string[], roleNames: string[]): Promise<void> {
    await this.store.removeUsersFromRoles(userNames, roleNames);
    this.audit("role.removed", `${userNames.length} user(s) from ${roleNames.join("|")}`);
  }

  getRolesForUser(userName: string): Promise<string[]> { return this.store.getRolesForUser(userName); }
  getUsersInRole(roleName: string): Promise<string[]> { return this.store.getUsersInRole(roleName); }

  async isUserInRole(userName: string, roleName: string): Promise<boolean> {
    const lowerRole = roleName.toLowerCase();
    return (await this.store.getRolesForUser(userName)).some((r) => r.toLowerCase() === lowerRole);
  }

  async findUsersInRole(roleName: string, userNameToMatch: string): Promise<string[]> {
    const m = userNameToMatch.toLowerCase();
    return (await this.store.getUsersInRole(roleName)).filter((u) => u.toLowerCase().includes(m));
  }
}
