import { EventDispatcher } from "../events.js";

/** Mirrors System.Web.Security.RoleProvider. */
export interface IRoleProvider {
  readonly name: string;
  createRole(roleName: string): Promise<void>;
  deleteRole(roleName: string, throwOnPopulatedRole?: boolean): Promise<boolean>;
  roleExists(roleName: string): Promise<boolean>;
  getAllRoles(): Promise<string[]>;
  addUsersToRoles(userNames: string[], roleNames: string[]): Promise<void>;
  removeUsersFromRoles(userNames: string[], roleNames: string[]): Promise<void>;
  getRolesForUser(userName: string): Promise<string[]>;
  getUsersInRole(roleName: string): Promise<string[]>;
  isUserInRole(userName: string, roleName: string): Promise<boolean>;
  findUsersInRole(roleName: string, userNameToMatch: string): Promise<string[]>;
}

export class InMemoryRoleProvider implements IRoleProvider {
  public readonly name: string;
  // lower-case role -> { display name, lower-case users }
  private readonly roles = new Map<string, { name: string; users: Set<string> }>();

  constructor(options: { name?: string | undefined; roles?: Record<string, string[]> | undefined } = {}) {
    this.name = options.name ?? "InMemoryRoleProvider";
    for (const [role, users] of Object.entries(options.roles ?? {})) {
      this.roles.set(role.toLowerCase(), { name: role, users: new Set(users.map((u) => u.toLowerCase())) });
    }
  }

  async createRole(roleName: string): Promise<void> {
    if (!roleName || roleName.trim() === "") throw new Error("Role name cannot be empty.");
    if (roleName.includes(",")) throw new Error("Role name cannot contain commas.");
    const key = roleName.toLowerCase();
    if (this.roles.has(key)) throw new Error(`Role '${roleName}' already exists.`);
    this.roles.set(key, { name: roleName, users: new Set() });
  }

  async deleteRole(roleName: string, throwOnPopulatedRole = false): Promise<boolean> {
    const r = this.roles.get(roleName.toLowerCase());
    if (!r) return false;
    if (throwOnPopulatedRole && r.users.size > 0) throw new Error(`Role '${roleName}' is not empty.`);
    return this.roles.delete(roleName.toLowerCase());
  }

  async roleExists(roleName: string): Promise<boolean> {
    return this.roles.has(roleName.toLowerCase());
  }

  async getAllRoles(): Promise<string[]> {
    return [...this.roles.values()].map((r) => r.name);
  }

  private resolve(roleNames: string[]): { name: string; users: Set<string> }[] {
    return roleNames.map((n) => {
      const r = this.roles.get(n.toLowerCase());
      if (!r) throw new Error(`Role '${n}' does not exist.`);
      return r;
    });
  }

  async addUsersToRoles(userNames: string[], roleNames: string[]): Promise<void> {
    const targets = this.resolve(roleNames);
    for (const r of targets) {
      for (const u of userNames) {
        if (r.users.has(u.toLowerCase())) throw new Error(`User '${u}' is already in role '${r.name}'.`);
      }
    }
    for (const r of targets) for (const u of userNames) r.users.add(u.toLowerCase());
  }

  async removeUsersFromRoles(userNames: string[], roleNames: string[]): Promise<void> {
    const targets = this.resolve(roleNames);
    for (const r of targets) {
      for (const u of userNames) {
        if (!r.users.has(u.toLowerCase())) throw new Error(`User '${u}' is not in role '${r.name}'.`);
      }
    }
    for (const r of targets) for (const u of userNames) r.users.delete(u.toLowerCase());
  }

  async getRolesForUser(userName: string): Promise<string[]> {
    const u = userName.toLowerCase();
    return [...this.roles.values()].filter((r) => r.users.has(u)).map((r) => r.name);
  }

  async getUsersInRole(roleName: string): Promise<string[]> {
    const r = this.roles.get(roleName.toLowerCase());
    if (!r) throw new Error(`Role '${roleName}' does not exist.`);
    return [...r.users];
  }

  async isUserInRole(userName: string, roleName: string): Promise<boolean> {
    return this.roles.get(roleName.toLowerCase())?.users.has(userName.toLowerCase()) ?? false;
  }

  async findUsersInRole(roleName: string, userNameToMatch: string): Promise<string[]> {
    const m = userNameToMatch.toLowerCase();
    return (await this.getUsersInRole(roleName)).filter((u) => u.includes(m));
  }
}

/** Static facade, like System.Web.Security.Roles. */
export class Roles {
  private static _provider: IRoleProvider = new InMemoryRoleProvider({
    roles: { Administrators: ["admin"], Users: ["admin", "user"] }
  });
  public static readonly providerChanged = new EventDispatcher<typeof Roles, IRoleProvider>();

  static get provider(): IRoleProvider { return Roles._provider; }
  static setProvider(p: IRoleProvider): void {
    Roles._provider = p;
    void Roles.providerChanged.emit(Roles, p);
  }
  static createRole(r: string): Promise<void> { return Roles._provider.createRole(r); }
  static deleteRole(r: string, throwOnPopulatedRole?: boolean): Promise<boolean> { return Roles._provider.deleteRole(r, throwOnPopulatedRole); }
  static roleExists(r: string): Promise<boolean> { return Roles._provider.roleExists(r); }
  static getAllRoles(): Promise<string[]> { return Roles._provider.getAllRoles(); }
  static addUserToRole(u: string, r: string): Promise<void> { return Roles._provider.addUsersToRoles([u], [r]); }
  static addUserToRoles(u: string, r: string[]): Promise<void> { return Roles._provider.addUsersToRoles([u], r); }
  static addUsersToRole(u: string[], r: string): Promise<void> { return Roles._provider.addUsersToRoles(u, [r]); }
  static removeUserFromRole(u: string, r: string): Promise<void> { return Roles._provider.removeUsersFromRoles([u], [r]); }
  static getRolesForUser(u: string): Promise<string[]> { return Roles._provider.getRolesForUser(u); }
  static getUsersInRole(r: string): Promise<string[]> { return Roles._provider.getUsersInRole(r); }
  static isUserInRole(u: string, r: string): Promise<boolean> { return Roles._provider.isUserInRole(u, r); }
}
