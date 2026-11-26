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
export declare class InMemoryRoleProvider implements IRoleProvider {
    readonly name: string;
    private readonly roles;
    constructor(options?: {
        name?: string | undefined;
        roles?: Record<string, string[]> | undefined;
    });
    createRole(roleName: string): Promise<void>;
    deleteRole(roleName: string, throwOnPopulatedRole?: boolean): Promise<boolean>;
    roleExists(roleName: string): Promise<boolean>;
    getAllRoles(): Promise<string[]>;
    private resolve;
    addUsersToRoles(userNames: string[], roleNames: string[]): Promise<void>;
    removeUsersFromRoles(userNames: string[], roleNames: string[]): Promise<void>;
    getRolesForUser(userName: string): Promise<string[]>;
    getUsersInRole(roleName: string): Promise<string[]>;
    isUserInRole(userName: string, roleName: string): Promise<boolean>;
    findUsersInRole(roleName: string, userNameToMatch: string): Promise<string[]>;
}
/** Static facade, like System.Web.Security.Roles. */
export declare class Roles {
    private static _provider;
    static readonly providerChanged: EventDispatcher<typeof Roles, IRoleProvider>;
    static get provider(): IRoleProvider;
    static setProvider(p: IRoleProvider): void;
    static createRole(r: string): Promise<void>;
    static deleteRole(r: string, throwOnPopulatedRole?: boolean): Promise<boolean>;
    static roleExists(r: string): Promise<boolean>;
    static getAllRoles(): Promise<string[]>;
    static addUserToRole(u: string, r: string): Promise<void>;
    static addUserToRoles(u: string, r: string[]): Promise<void>;
    static addUsersToRole(u: string[], r: string): Promise<void>;
    static removeUserFromRole(u: string, r: string): Promise<void>;
    static getRolesForUser(u: string): Promise<string[]>;
    static getUsersInRole(r: string): Promise<string[]>;
    static isUserInRole(u: string, r: string): Promise<boolean>;
}
