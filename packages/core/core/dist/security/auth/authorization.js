import { AnonymousPrincipal } from "./principal.js";
function ruleMatches(rule, p, verb) {
    if (rule.verbs && rule.verbs.length > 0) {
        if (!verb || !rule.verbs.some((v) => v.toLowerCase() === verb.toLowerCase()))
            return false;
    }
    const users = rule.users ?? [];
    const roles = rule.roles ?? [];
    if (users.length === 0 && roles.length === 0)
        return true; // no subject given: applies to everyone
    const name = p.identity.name.toLowerCase();
    for (const u of users) {
        if (u === "*")
            return true;
        if (u === "?" && !p.identity.isAuthenticated)
            return true;
        if (u === "@" && p.identity.isAuthenticated)
            return true;
        if (p.identity.isAuthenticated && u.toLowerCase() === name)
            return true;
    }
    for (const r of roles)
        if (p.isInRole(r))
            return true;
    return false;
}
function normalize(path) {
    const q = path.split(/[?#]/)[0] ?? "";
    const out = [];
    for (const s of q.split("/")) {
        if (s === "" || s === ".")
            continue;
        if (s === "..")
            out.pop();
        else
            out.push(s.toLowerCase());
    }
    return "/" + out.join("/");
}
function pathMatches(pattern, path) {
    const segs = normalize(pattern).split("/");
    const body = segs
        .map((seg) => seg === "**" ? ".*" : seg.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*"))
        .join("/");
    return new RegExp("^" + body + "(/.*)?$").test(normalize(path));
}
function evaluate(rules, p, verb) {
    for (const r of rules)
        if (ruleMatches(r, p, verb))
            return r.action === "allow"; // first match wins
    return undefined;
}
/** Equivalent of UrlAuthorizationModule. Client-side checks are UX only; enforce the same rules on the server. */
export class UrlAuthorization {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * CheckUrlAccessForPrincipal. The most specific matching <location> is evaluated first, then the global rules;
     * if nothing matches, access is allowed (the ASP.NET default).
     */
    checkUrlAccess(path, principal = AnonymousPrincipal, verb) {
        const matches = (this.config.locations ?? [])
            .filter((l) => pathMatches(l.path, path))
            .sort((a, b) => normalize(b.path).length - normalize(a.path).length);
        for (const loc of matches) {
            const r = evaluate(loc.rules, principal, verb);
            if (r !== undefined)
                return r;
        }
        return evaluate(this.config.rules, principal, verb) ?? true;
    }
    static checkUrlAccessForPrincipal(path, principal, config, verb) {
        return new UrlAuthorization(config).checkUrlAccess(path, principal, verb);
    }
}
/** Control-level helper (like LoginView RoleGroups). With no roles/users it only requires authentication if asked. */
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
//# sourceMappingURL=authorization.js.map