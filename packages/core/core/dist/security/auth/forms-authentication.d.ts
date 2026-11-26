import { CancelEventArgs, EventDispatcher } from "../../events.js";
import { IPrincipal } from "./principal.js";
/** Mirrors System.Web.Security.FormsAuthenticationTicket (v2). */
export interface FormsAuthenticationTicket {
    version: number;
    name: string;
    issueDate: number;
    expiration: number;
    isPersistent: boolean;
    userData: string;
    roles: string[];
}
/** Where the serialized ticket lives. Core has no DOM: pass a localStorage/sessionStorage/cookie adapter yourself. */
export interface IAuthStorage {
    get(key: string): string | null;
    set(key: string, value: string): void;
    remove(key: string): void;
}
export declare class MemoryAuthStorage implements IAuthStorage {
    private readonly m;
    get(key: string): string | null;
    set(key: string, value: string): void;
    remove(key: string): void;
}
export interface FormsAuthenticationConfig {
    loginUrl: string;
    defaultUrl: string;
    timeoutMinutes: number;
    slidingExpiration: boolean;
    persistentTimeoutMinutes: number;
    returnUrlParameter: string;
    cookieName: string;
}
export interface FormsAuthEventArgs extends CancelEventArgs {
    userName: string;
    isPersistent: boolean;
}
export interface FormsSignedOutEventArgs {
    userName: string | null;
}
/** Static, like System.Web.Security.FormsAuthentication, but storage/redirect/clock are injected. */
export declare class FormsAuthentication {
    static config: FormsAuthenticationConfig;
    static storage: IAuthStorage;
    static now: () => number;
    /** Called instead of touching window.location. Receives the (already validated) destination. */
    static onRedirect: ((url: string) => void) | undefined;
    static readonly authenticating: EventDispatcher<typeof FormsAuthentication, FormsAuthEventArgs>;
    static readonly authenticated: EventDispatcher<typeof FormsAuthentication, FormsAuthenticationTicket>;
    static readonly signedOut: EventDispatcher<typeof FormsAuthentication, FormsSignedOutEventArgs>;
    /** Internal: fires after the ticket is issued or removed. Not cleared by reset() so CurrentPrincipal stays wired. */
    static readonly sessionChanged: EventDispatcher<typeof FormsAuthentication, null>;
    static configure(partial: Partial<FormsAuthenticationConfig>): void;
    /** Test helper: restore defaults, memory storage, real clock, no handlers. */
    static reset(): void;
    static get loginUrl(): string;
    static get defaultUrl(): string;
    static createTicket(userName: string, isPersistent?: boolean, userData?: string, roles?: string[]): FormsAuthenticationTicket;
    /** FormsAuthentication.SetAuthCookie. Returns false when an `authenticating` handler cancelled it. */
    static setAuthCookie(userName: string, isPersistent?: boolean, userData?: string, roles?: string[]): Promise<boolean>;
    /** The current ticket, or null if absent / expired / corrupt. Applies sliding expiration. */
    static getTicket(): FormsAuthenticationTicket | null;
    static get isAuthenticated(): boolean;
    static getPrincipal(): IPrincipal;
    /** FormsAuthentication.SignOut. */
    static signOut(): Promise<void>;
    /**
     * Only same-site relative paths are allowed ("/x", "x/y"). Rejects "//host", "http://...", backslashes,
     * "javascript:" and control characters, so ReturnUrl cannot be abused as an open redirect.
     */
    static isSafeReturnUrl(url: string | null | undefined): url is string;
    /** FormsAuthentication.GetRedirectUrl: ReturnUrl if safe, otherwise defaultUrl. */
    static getRedirectUrl(returnUrl?: string | null): string;
    /** FormsAuthentication.RedirectFromLoginPage. Returns the destination, or null if cancelled. */
    static redirectFromLoginPage(userName: string, isPersistent?: boolean, returnUrl?: string | null, roles?: string[]): Promise<string | null>;
    /** FormsAuthentication.RedirectToLoginPage: "/login?ReturnUrl=%2Fcurrent". */
    static redirectToLoginPage(currentUrl?: string): string;
}
