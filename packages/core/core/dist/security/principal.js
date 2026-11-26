// System.Security.Principal equivalents. Headless: no DOM, no OS access. FREE (MIT).
// A Windows / Kerberos / SSO identity is established by a SERVER; the Enterprise package
// (@wf-controls/enterprise-security) can wrap what the server reports (WindowsLikeIdentity, OidcPrincipalFactory).
/** True when the principal has a claim of `type` (and, when given, exactly `value`). Roles count as `role` claims. */
export function principalHasClaim(principal, type, value) {
    const t = type.toLowerCase();
    if (t === "role")
        return value === undefined ? principal.roles.length > 0 : principal.isInRole(value);
    return (principal.claims ?? []).some((c) => c.type.toLowerCase() === t && (value === undefined || c.value === value));
}
export class GenericIdentity {
    name;
    authenticationType;
    constructor(name, authenticationType = "") {
        this.name = name;
        this.authenticationType = authenticationType;
    }
    get isAuthenticated() {
        return this.name.length > 0;
    }
}
export class AnonymousIdentity {
    name = "";
    isAuthenticated = false;
    authenticationType = "";
}
export class GenericPrincipal {
    identity;
    roles;
    claims;
    roleSet;
    constructor(identity, roles = [], claims = []) {
        this.identity = identity;
        this.roles = [...roles];
        this.claims = claims.map((c) => ({ type: c.type, value: c.value }));
        this.roleSet = new Set(roles.map((r) => r.toLowerCase()));
    }
    isInRole(role) {
        return this.roleSet.has(role.toLowerCase());
    }
}
export const AnonymousPrincipal = Object.freeze(new GenericPrincipal(new AnonymousIdentity(), []));
//# sourceMappingURL=principal.js.map