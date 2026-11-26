import type { IRoleProvider } from "../role-provider.js";
import type { IAuditSink } from "./audit.js";
import { type IRoleStore } from "./user-store.js";
/** The full ASP.NET RoleProvider over an IRoleStore (any database). Same behaviour as the in-memory provider. */
export declare class StoreRoleProvider implements IRoleProvider {
    private readonly store;
    private readonly options;
    readonly name: string;
    constructor(store: IRoleStore, options?: {
        name?: string | undefined;
        auditSink?: IAuditSink | undefined;
        now?: (() => number) | undefined;
    });
    private audit;
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
