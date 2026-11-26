/**
 * Control-level helper (like LoginView RoleGroups). FREE (MIT): a plain role/user check.
 * With no roles/users it only requires authentication when `requireAuthenticated` is set.
 * Path-based allow/deny rules (`UrlAuthorization`, `<authorization>` / `<location>`) are Enterprise.
 */
export function authorizeControl(principal, opts = {}) {
    const requireAuth = opts.requireAuthenticated ?? false;
    if (requireAuth && !principal.identity.isAuthenticated)
        return false;
    const roles = opts.roles ?? [];
    const users = opts.users ?? [];
    if (roles.length === 0 && users.length === 0)
        return true;
    if (roles.some((r) => principal.isInRole(r)))
        return true;
    return users.some((u) => u.toLowerCase() === principal.identity.name.toLowerCase());
}
//# sourceMappingURL=authorize-control.js.map