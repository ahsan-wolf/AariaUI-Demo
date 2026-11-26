export interface IIdentity {
    readonly name: string;
    readonly isAuthenticated: boolean;
    readonly authenticationType: string;
}
export interface IPrincipal {
    readonly identity: IIdentity;
    isInRole(role: string): boolean;
    readonly roles: readonly string[];
}
export declare class GenericIdentity implements IIdentity {
    readonly name: string;
    readonly authenticationType: string;
    constructor(name: string, authenticationType?: string);
    get isAuthenticated(): boolean;
}
export declare class AnonymousIdentity implements IIdentity {
    readonly name = "";
    readonly isAuthenticated = false;
    readonly authenticationType = "";
}
/** Identity reported by a server (e.g. "DOMAIN\\user", authenticationType "Negotiate" / "NTLM" / "Kerberos"). */
export declare class WindowsLikeIdentity extends GenericIdentity {
    readonly claims: Readonly<Record<string, unknown>>;
    constructor(name: string, authenticationType?: string, claims?: Record<string, unknown>);
    /** "DOMAIN" part of "DOMAIN\\user", or "" */
    get domain(): string;
    get userName(): string;
}
export declare class GenericPrincipal implements IPrincipal {
    readonly identity: IIdentity;
    readonly roles: readonly string[];
    private readonly roleSet;
    constructor(identity: IIdentity, roles?: readonly string[]);
    isInRole(role: string): boolean;
}
export declare const AnonymousPrincipal: IPrincipal;
