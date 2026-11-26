import { constantTimeEqual, fromBase64Url, getSubtle, secureRandom, toBase64Url, utf8 } from "./crypto.js";

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

export const PBKDF2_DEFAULT_ITERATIONS = 600_000;
export const PBKDF2_MIN_ITERATIONS = 100_000;
const PBKDF2_MAX_ITERATIONS = 10_000_000;
const HASH_BYTES = 32;
/** Longest password accepted: stops a huge input from being used to burn CPU. */
export const MAX_PASSWORD_LENGTH = 1024;
const PREFIX = "$pbkdf2-sha256$";

/**
 * PBKDF2-HMAC-SHA256 through WebCrypto. Encoded form: `$pbkdf2-sha256$i=<iterations>$<salt b64url>$<hash b64url>`.
 * The passwords are NFKC-normalized first so the same text typed on different keyboards verifies.
 */
export class Pbkdf2PasswordHasher implements IPasswordHasher {
  readonly iterations: number;
  readonly saltBytes: number;

  constructor(options: Pbkdf2Options = {}) {
    const iterations = options.iterations ?? PBKDF2_DEFAULT_ITERATIONS;
    if (!Number.isInteger(iterations) || iterations < 1 || iterations > PBKDF2_MAX_ITERATIONS) throw new Error("iterations must be an integer between 1 and 10000000.");
    if (iterations < PBKDF2_MIN_ITERATIONS && !options.allowWeakIterations) {
      throw new Error(`PBKDF2 needs at least ${PBKDF2_MIN_ITERATIONS} iterations (pass allowWeakIterations: true for tests and throw-away demos only).`);
    }
    this.iterations = iterations;
    this.saltBytes = Math.max(16, options.saltBytes ?? 16);
  }

  /** A fast hasher for unit tests and demos. Never use it for real accounts. */
  static forTesting(): Pbkdf2PasswordHasher {
    return new Pbkdf2PasswordHasher({ iterations: 1000, allowWeakIterations: true });
  }

  async hash(password: string): Promise<string> {
    assertPassword(password);
    const salt = secureRandom(this.saltBytes);
    const derived = await derive(password, salt, this.iterations);
    return `${PREFIX}i=${this.iterations}$${toBase64Url(salt)}$${toBase64Url(derived)}`;
  }

  async verify(password: string, encoded: string): Promise<boolean> {
    if (typeof password !== "string" || password.length > MAX_PASSWORD_LENGTH) return false;
    const parsed = parse(encoded);
    if (!parsed) return false;
    const derived = await derive(password, parsed.salt, parsed.iterations);
    return constantTimeEqual(derived, parsed.hash);
  }

  needsRehash(encoded: string): boolean {
    const parsed = parse(encoded);
    return !parsed || parsed.iterations < this.iterations || parsed.salt.length < this.saltBytes;
  }
}

function assertPassword(password: string): void {
  if (typeof password !== "string" || password.length === 0) throw new Error("Password must be a non-empty string.");
  if (password.length > MAX_PASSWORD_LENGTH) throw new Error(`Password is longer than ${MAX_PASSWORD_LENGTH} characters.`);
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const subtle = getSubtle();
  const key = await subtle.importKey("raw", utf8(password.normalize("NFKC")), "PBKDF2", false, ["deriveBits"]);
  const bits = await subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, HASH_BYTES * 8);
  return new Uint8Array(bits);
}

function parse(encoded: string): { iterations: number; salt: Uint8Array; hash: Uint8Array } | null {
  if (typeof encoded !== "string" || !encoded.startsWith(PREFIX)) return null;
  const parts = encoded.slice(PREFIX.length).split("$");
  if (parts.length !== 3) return null;
  const m = /^i=(\d{1,8})$/.exec(parts[0]!);
  if (!m) return null;
  const iterations = Number(m[1]);
  if (iterations < 1 || iterations > PBKDF2_MAX_ITERATIONS) return null;
  try {
    const salt = fromBase64Url(parts[1]!);
    const hash = fromBase64Url(parts[2]!);
    if (salt.length < 8 || hash.length !== HASH_BYTES) return null;
    return { iterations, salt, hash };
  } catch {
    return null;
  }
}
