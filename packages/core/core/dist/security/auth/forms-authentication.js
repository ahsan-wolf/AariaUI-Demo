import { EventDispatcher } from "../../events.js";
import { GenericIdentity, GenericPrincipal, AnonymousPrincipal } from "./principal.js";
export class MemoryAuthStorage {
    m = new Map();
    get(key) { return this.m.get(key) ?? null; }
    set(key, value) { this.m.set(key, value); }
    remove(key) { this.m.delete(key); }
}
const DEFAULTS = {
    loginUrl: "/login",
    defaultUrl: "/",
    timeoutMinutes: 30,
    slidingExpiration: true,
    persistentTimeoutMinutes: 60 * 24 * 30,
    returnUrlParameter: "ReturnUrl",
    cookieName: ".WFAUTH"
};
/** Static, like System.Web.Security.FormsAuthentication, but storage/redirect/clock are injected. */
export class FormsAuthentication {
    static config = { ...DEFAULTS };
    static storage = new MemoryAuthStorage();
    static now = () => Date.now();
    /** Called instead of touching window.location. Receives the (already validated) destination. */
    static onRedirect;
    static authenticating = new EventDispatcher();
    static authenticated = new EventDispatcher();
    static signedOut = new EventDispatcher();
    /** Internal: fires after the ticket is issued or removed. Not cleared by reset() so CurrentPrincipal stays wired. */
    static sessionChanged = new EventDispatcher();
    static configure(partial) {
        FormsAuthentication.config = { ...FormsAuthentication.config, ...partial };
    }
    /** Test helper: restore defaults, memory storage, real clock, no handlers. */
    static reset() {
        FormsAuthentication.config = { ...DEFAULTS };
        FormsAuthentication.storage = new MemoryAuthStorage();
        FormsAuthentication.now = () => Date.now();
        FormsAuthentication.onRedirect = undefined;
        FormsAuthentication.authenticating.clear();
        FormsAuthentication.authenticated.clear();
        FormsAuthentication.signedOut.clear();
    }
    static get loginUrl() { return FormsAuthentication.config.loginUrl; }
    static get defaultUrl() { return FormsAuthentication.config.defaultUrl; }
    static createTicket(userName, isPersistent = false, userData = "", roles = []) {
        const c = FormsAuthentication.config;
        const issue = FormsAuthentication.now();
        const minutes = isPersistent ? c.persistentTimeoutMinutes : c.timeoutMinutes;
        return { version: 2, name: userName, issueDate: issue, expiration: issue + minutes * 60_000, isPersistent, userData, roles: [...roles] };
    }
    /** FormsAuthentication.SetAuthCookie. Returns false when an `authenticating` handler cancelled it. */
    static async setAuthCookie(userName, isPersistent = false, userData = "", roles = []) {
        if (!userName)
            throw new Error("userName is required.");
        const args = { userName, isPersistent, cancel: false };
        await FormsAuthentication.authenticating.emit(FormsAuthentication, args);
        if (args.cancel)
            return false;
        const ticket = FormsAuthentication.createTicket(userName, isPersistent, userData, roles);
        FormsAuthentication.storage.set(FormsAuthentication.config.cookieName, JSON.stringify(ticket));
        await FormsAuthentication.authenticated.emit(FormsAuthentication, ticket);
        await FormsAuthentication.sessionChanged.emit(FormsAuthentication, null);
        return true;
    }
    /** The current ticket, or null if absent / expired / corrupt. Applies sliding expiration. */
    static getTicket() {
        const c = FormsAuthentication.config;
        const raw = FormsAuthentication.storage.get(c.cookieName);
        if (!raw)
            return null;
        let t;
        try {
            t = JSON.parse(raw);
            if (typeof t.name !== "string" || typeof t.expiration !== "number" || typeof t.issueDate !== "number")
                throw new Error("bad");
        }
        catch {
            FormsAuthentication.storage.remove(c.cookieName);
            return null;
        }
        const now = FormsAuthentication.now();
        if (t.expiration <= now) {
            FormsAuthentication.storage.remove(c.cookieName);
            return null;
        }
        // Like ASP.NET: renew once more than half of the lifetime has elapsed.
        if (c.slidingExpiration && !t.isPersistent) {
            const life = c.timeoutMinutes * 60_000;
            if (t.expiration - now < life / 2) {
                t = { ...t, issueDate: now, expiration: now + life };
                FormsAuthentication.storage.set(c.cookieName, JSON.stringify(t));
            }
        }
        return t;
    }
    static get isAuthenticated() { return FormsAuthentication.getTicket() !== null; }
    static getPrincipal() {
        const t = FormsAuthentication.getTicket();
        return t ? new GenericPrincipal(new GenericIdentity(t.name, "Forms"), t.roles ?? []) : AnonymousPrincipal;
    }
    /** FormsAuthentication.SignOut. */
    static async signOut() {
        const t = FormsAuthentication.getTicket();
        FormsAuthentication.storage.remove(FormsAuthentication.config.cookieName);
        await FormsAuthentication.signedOut.emit(FormsAuthentication, { userName: t?.name ?? null });
        await FormsAuthentication.sessionChanged.emit(FormsAuthentication, null);
    }
    /**
     * Only same-site relative paths are allowed ("/x", "x/y"). Rejects "//host", "http://...", backslashes,
     * "javascript:" and control characters, so ReturnUrl cannot be abused as an open redirect.
     */
    static isSafeReturnUrl(url) {
        if (!url)
            return false;
        for (let i = 0; i < url.length; i++) {
            const code = url.charCodeAt(i);
            if (code < 0x20 || code === 0x7f)
                return false;
        }
        if (url.startsWith("//") || url.includes("\\"))
            return false;
        if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url))
            return false;
        return true;
    }
    /** FormsAuthentication.GetRedirectUrl: ReturnUrl if safe, otherwise defaultUrl. */
    static getRedirectUrl(returnUrl) {
        return FormsAuthentication.isSafeReturnUrl(returnUrl) ? returnUrl : FormsAuthentication.config.defaultUrl;
    }
    /** FormsAuthentication.RedirectFromLoginPage. Returns the destination, or null if cancelled. */
    static async redirectFromLoginPage(userName, isPersistent = false, returnUrl, roles = []) {
        if (!(await FormsAuthentication.setAuthCookie(userName, isPersistent, "", roles)))
            return null;
        const dest = FormsAuthentication.getRedirectUrl(returnUrl);
        FormsAuthentication.onRedirect?.(dest);
        return dest;
    }
    /** FormsAuthentication.RedirectToLoginPage: "/login?ReturnUrl=%2Fcurrent". */
    static redirectToLoginPage(currentUrl) {
        const c = FormsAuthentication.config;
        const dest = FormsAuthentication.isSafeReturnUrl(currentUrl)
            ? `${c.loginUrl}${c.loginUrl.includes("?") ? "&" : "?"}${c.returnUrlParameter}=${encodeURIComponent(currentUrl)}`
            : c.loginUrl;
        FormsAuthentication.onRedirect?.(dest);
        return dest;
    }
}
//# sourceMappingURL=forms-authentication.js.map