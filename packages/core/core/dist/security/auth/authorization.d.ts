import { IPrincipal } from "./principal.js";
/** One <allow>/<deny> element. users: names, "*" (all), "?" (anonymous), "@" (any authenticated). roles: role names. */
export interface AuthorizationRule {
    action: "allow" | "deny";
    users?: string[] | undefined;
    roles?: string[] | undefined;
    verbs?: string[] | undefined;
}
/** <location path="..."> block. path supports "*" (one segment) and "**" (any depth). */
export interface AuthorizationLocation {
    path: string;
    rules: AuthorizationRule[];
}
export interface AuthorizationConfig {
    /** Global <authorization> rules, evaluated after any matching location. */
    rules: AuthorizationRule[];
    locations?: AuthorizationLocation[] | undefined;
}
/** Equivalent of UrlAuthorizationModule. Client-side checks are UX only; enforce the same rules on the server. */
export declare class UrlAuthorization {
    readonly config: AuthorizationConfig;
    constructor(config: AuthorizationConfig);
    /**
     * CheckUrlAccessForPrincipal. The most specific matching <location> is evaluated first, then the global rules;
     * if nothing matches, access is allowed (the ASP.NET default).
     */
    checkUrlAccess(path: string, principal?: IPrincipal, verb?: string): boolean;
    static checkUrlAccessForPrincipal(path: string, principal: IPrincipal, config: AuthorizationConfig, verb?: string): boolean;
}
/** Control-level helper (like LoginView RoleGroups). With no roles/users it only requires authentication if asked. */
export declare function authorizeControl(principal: IPrincipal, opts?: {
    roles?: string[] | undefined;
    users?: string[] | undefined;
    requireAuthenticated?: boolean | undefined;
}): boolean;
