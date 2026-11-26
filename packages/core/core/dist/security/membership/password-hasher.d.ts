/** Hashes and verifies passwords. Implementations must use a per-password random salt and a slow, memory/CPU-hard function. */
export interface IPasswordHasher {
    /** Returns a self-describing encoded hash (algorithm, parameters, salt and hash). */
    hash(password: string): Promise<string>;
    /** True when `password` matches `encoded`. Never throws for a malformed `encoded`: returns false. */
    verify(password: string, encoded: string): Promise<boolean>;
    /** True when the stored hash uses weaker parameters than the current configuration and should be recomputed on next login. */
    needsRehash(encoded: string): boolean;
}
export interface Pbkdf2Options {
    /** PBKDF2 iterations. Default 600000 (OWASP recommendation for PBKDF2-HMAC-SHA256). */
    iterations?: number | undefined;
    /** Salt length in bytes. Default 16. */
    saltBytes?: number | undefined;
    /** Allow fewer than 100000 iterations. Tests and throw-away demos only. */
    allowWeakIterations?: boolean | undefined;
}
export declare const PBKDF2_DEFAULT_ITERATIONS = 600000;
export declare const PBKDF2_MIN_ITERATIONS = 100000;
/** Longest password accepted: stops a huge input from being used to burn CPU. */
export declare const MAX_PASSWORD_LENGTH = 1024;
/**
 * PBKDF2-HMAC-SHA256 through WebCrypto. Encoded form: `$pbkdf2-sha256$i=<iterations>$<salt b64url>$<hash b64url>`.
 * The passwords are NFKC-normalized first so the same text typed on different keyboards verifies.
 */
export declare class Pbkdf2PasswordHasher implements IPasswordHasher {
    readonly iterations: number;
    readonly saltBytes: number;
    constructor(options?: Pbkdf2Options);
    /** A fast hasher for unit tests and demos. Never use it for real accounts. */
    static forTesting(): Pbkdf2PasswordHasher;
    hash(password: string): Promise<string>;
    verify(password: string, encoded: string): Promise<boolean>;
    needsRehash(encoded: string): boolean;
}
