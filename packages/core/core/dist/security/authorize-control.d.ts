import type { IPrincipal } from "./principal.js";
/**
 * Control-level helper (like LoginView RoleGroups). FREE (MIT): a plain role/user check.
 * With no roles/users it only requires authentication when `requireAuthenticated` is set.
 * Path-based allow/deny rules (`UrlAuthorization`, `<authorization>` / `<location>`) are Enterprise.
 */
export declare function authorizeControl(principal: IPrincipal, opts?: {
    roles?: string[] | undefined;
    users?: string[] | undefined;
    requireAuthenticated?: boolean | undefined;
}): boolean;
