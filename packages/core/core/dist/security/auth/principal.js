// System.Security.Principal equivalents. Headless: no DOM, no OS access.
// A Windows / Kerberos / SSO identity is established by a SERVER; this library can only consume
// the identity the server reports (see WindowsLikeIdentity / OidcPrincipalFactory).
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
/** Identity reported by a server (e.g. "DOMAIN\\user", authenticationType "Negotiate" / "NTLM" / "Kerberos"). */
export class WindowsLikeIdentity extends GenericIdentity {
    claims;
    constructor(name, authenticationType = "Negotiate", claims = {}) {
        super(name, authenticationType);
        this.claims = { ...claims };
    }
    /** "DOMAIN" part of "DOMAIN\\user", or "" */
    get domain() {
        const i = this.name.indexOf("\\");
        return i > 0 ? this.name.slice(0, i) : "";
    }
    get userName() {
        const i = this.name.indexOf("\\");
        return i >= 0 ? this.name.slice(i + 1) : this.name;
    }
}
export class GenericPrincipal {
    identity;
    roles;
    roleSet;
    constructor(identity, roles = []) {
        this.identity = identity;
        this.roles = [...roles];
        this.roleSet = new Set(roles.map((r) => r.toLowerCase()));
    }
    isInRole(role) {
        return this.roleSet.has(role.toLowerCase());
    }
}
export const AnonymousPrincipal = Object.freeze(new GenericPrincipal(new AnonymousIdentity(), []));
//# sourceMappingURL=principal.js.map