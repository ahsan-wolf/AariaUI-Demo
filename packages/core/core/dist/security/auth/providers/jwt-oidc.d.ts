import { IPrincipal } from "../principal.js";
export type Claims = Record<string, unknown>;
export interface DecodedJwt {
    header: Claims;
    payload: Claims;
    /** true when `exp` is present and in the past. */
    isExpired: boolean;
}
/** Decode-only JWT parsing (header + payload). Throws on a malformed token. */
export declare function decodeJwt(token: string, nowMs?: number): DecodedJwt;
export interface PrincipalClaimMapping {
    nameClaim?: string | undefined;
    roleClaim?: string | undefined;
    authenticationType?: string | undefined;
}
/** Claims (from OIDC id_token / JWT / a server "who am I" endpoint) -> IPrincipal. */
export declare class OidcPrincipalFactory {
    static fromClaims(claims: Claims, mapping?: PrincipalClaimMapping): IPrincipal;
    static fromJwt(token: string, mapping?: PrincipalClaimMapping, nowMs?: number): IPrincipal | null;
    /** A server-reported Windows/Kerberos identity, e.g. from GET /api/whoami behind IIS Windows authentication. */
    static fromWindowsIdentity(info: {
        name: string;
        groups?: string[] | undefined;
        authenticationType?: string | undefined;
    }): IPrincipal;
}
