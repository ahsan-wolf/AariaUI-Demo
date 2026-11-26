export interface SubtleCryptoLike {
    importKey(format: "raw", data: Uint8Array, algorithm: string | Record<string, unknown>, extractable: boolean, usages: string[]): Promise<unknown>;
    deriveBits(algorithm: Record<string, unknown>, baseKey: unknown, length: number): Promise<ArrayBuffer>;
    digest(algorithm: string, data: Uint8Array): Promise<ArrayBuffer>;
    sign(algorithm: string | Record<string, unknown>, key: unknown, data: Uint8Array): Promise<ArrayBuffer>;
    verify(algorithm: string | Record<string, unknown>, key: unknown, signature: Uint8Array, data: Uint8Array): Promise<boolean>;
}
/** The WebCrypto `subtle` object, or a clear error (browsers only expose it in secure contexts: HTTPS or localhost). */
export declare function getSubtle(): SubtleCryptoLike;
/** Cryptographically secure random bytes. */
export declare function secureRandom(length: number): Uint8Array;
/** UTF-8 encode. */
export declare function utf8(text: string): Uint8Array;
/** base64url without padding. */
export declare function toBase64Url(bytes: Uint8Array): string;
/** Decode base64url (padding and the standard "+/" alphabet are also accepted). Throws on any other character. */
export declare function fromBase64Url(text: string): Uint8Array;
/** Compare two byte arrays (or strings, as UTF-8) in time that depends only on their length. */
export declare function constantTimeEqual(a: Uint8Array | string, b: Uint8Array | string): boolean;
/** SHA-256 digest. */
export declare function sha256(data: Uint8Array | string): Promise<Uint8Array>;
/** SHA-256 as base64url: for hashing high-entropy random tokens (reset tokens, refresh tokens, API keys) before storing them. */
export declare function hashToken(token: string): Promise<string>;
/** A new random token: `bytes` of entropy (default 32 = 256 bits), base64url encoded. */
export declare function randomToken(bytes?: number): string;
/** A random string of `length` characters from `alphabet`, without modulo bias. */
export declare function randomString(length: number, alphabet: string): string;
