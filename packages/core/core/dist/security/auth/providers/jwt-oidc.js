import { GenericIdentity, GenericPrincipal, WindowsLikeIdentity } from "../principal.js";
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function base64UrlToBytes(input) {
    const s = input.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
    const bytes = [];
    let buffer = 0;
    let bits = 0;
    for (const ch of s) {
        const v = B64.indexOf(ch);
        if (v < 0)
            throw new Error("Invalid base64url character.");
        buffer = (buffer << 6) | v;
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            bytes.push((buffer >> bits) & 0xff);
        }
    }
    return bytes;
}
function utf8(bytes) {
    let pct = "";
    for (const b of bytes)
        pct += "%" + b.toString(16).padStart(2, "0");
    return decodeURIComponent(pct);
}
/** Decode-only JWT parsing (header + payload). Throws on a malformed token. */
export function decodeJwt(token, nowMs = Date.now()) {
    const parts = token.split(".");
    if (parts.length < 2)
        throw new Error("Malformed JWT.");
    const header = JSON.parse(utf8(base64UrlToBytes(parts[0])));
    const payload = JSON.parse(utf8(base64UrlToBytes(parts[1])));
    const exp = payload["exp"];
    return { header, payload, isExpired: typeof exp === "number" && exp * 1000 <= nowMs };
}
/** Claims (from OIDC id_token / JWT / a server "who am I" endpoint) -> IPrincipal. */
export class OidcPrincipalFactory {
    static fromClaims(claims, mapping = {}) {
        const nameClaim = mapping.nameClaim ?? "name";
        const roleClaim = mapping.roleClaim ?? "roles";
        const name = String(claims[nameClaim] ?? claims["preferred_username"] ?? claims["sub"] ?? "");
        const raw = claims[roleClaim] ?? claims["role"];
        const roles = Array.isArray(raw) ? raw.map(String) : typeof raw === "string" && raw ? [raw] : [];
        return new GenericPrincipal(new GenericIdentity(name, mapping.authenticationType ?? "OpenIdConnect"), roles);
    }
    static fromJwt(token, mapping = {}, nowMs = Date.now()) {
        const d = decodeJwt(token, nowMs);
        if (d.isExpired)
            return null;
        return OidcPrincipalFactory.fromClaims(d.payload, { authenticationType: "Bearer", ...mapping });
    }
    /** A server-reported Windows/Kerberos identity, e.g. from GET /api/whoami behind IIS Windows authentication. */
    static fromWindowsIdentity(info) {
        return new GenericPrincipal(new WindowsLikeIdentity(info.name, info.authenticationType ?? "Negotiate"), info.groups ?? []);
    }
}
//# sourceMappingURL=jwt-oidc.js.map