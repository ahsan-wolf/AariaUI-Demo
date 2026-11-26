export interface IIdentity {
    readonly name: string;
    readonly isAuthenticated: boolean;
    readonly authenticationType: string;
}
/** A statement about the user (ASP.NET `Claim`): e.g. { type: "department", value: "Finance" }. */
export interface Claim {
    readonly type: string;
    readonly value: string;
}
export interface IPrincipal {
    readonly identity: IIdentity;
    isInRole(role: string): boolean;
    readonly roles: readonly string[];
    /** Claims about the user besides roles. Optional: principals without claims simply have none. */
    readonly claims?: readonly Claim[] | undefined;
}
/** True when the principal has a claim of `type` (and, when given, exactly `value`). Roles count as `role` claims. */
export declare function principalHasClaim(principal: IPrincipal, type: string, value?: string): boolean;
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
export declare class GenericPrincipal implements IPrincipal {
    readonly identity: IIdentity;
    readonly roles: readonly string[];
    readonly claims: readonly Claim[];
    private readonly roleSet;
    constructor(identity: IIdentity, roles?: readonly string[], claims?: readonly Claim[]);
    isInRole(role: string): boolean;
}
export declare const AnonymousPrincipal: IPrincipal;
