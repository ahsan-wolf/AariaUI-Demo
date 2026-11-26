// Small WebCrypto helpers shared by the membership engine. Isomorphic: uses `globalThis.crypto` (browsers in a secure
// context, Node 20+). No DOM or Node type dependency: the few types needed are declared locally.

export interface SubtleCryptoLike {
  importKey(format: "raw", data: Uint8Array, algorithm: string | Record<string, unknown>, extractable: boolean, usages: string[]): Promise<unknown>;
  deriveBits(algorithm: Record<string, unknown>, baseKey: unknown, length: number): Promise<ArrayBuffer>;
  digest(algorithm: string, data: Uint8Array): Promise<ArrayBuffer>;
  sign(algorithm: string | Record<string, unknown>, key: unknown, data: Uint8Array): Promise<ArrayBuffer>;
  verify(algorithm: string | Record<string, unknown>, key: unknown, signature: Uint8Array, data: Uint8Array): Promise<boolean>;
}

interface CryptoLike {
  subtle?: SubtleCryptoLike;
  getRandomValues<T extends Uint8Array>(array: T): T;
}

const g = globalThis as unknown as { crypto?: CryptoLike; TextEncoder?: new () => { encode(s: string): Uint8Array } };

/** The WebCrypto `subtle` object, or a clear error (browsers only expose it in secure contexts: HTTPS or localhost). */
export function getSubtle(): SubtleCryptoLike {
  const subtle = g.crypto?.subtle;
  if (!subtle) throw new Error("WebCrypto (crypto.subtle) is not available. Use HTTPS or localhost in a browser, or Node 20+.");
  return subtle;
}

/** Cryptographically secure random bytes. */
export function secureRandom(length: number): Uint8Array {
  if (!g.crypto) throw new Error("crypto.getRandomValues is not available.");
  if (!Number.isInteger(length) || length <= 0 || length > 65536) throw new Error("secureRandom: length must be 1..65536.");
  return g.crypto.getRandomValues(new Uint8Array(length));
}

/** UTF-8 encode. */
export function utf8(text: string): Uint8Array {
  if (g.TextEncoder) return new g.TextEncoder().encode(text);
  throw new Error("TextEncoder is not available.");
}

const B64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** base64url without padding. */
export function toBase64Url(bytes: Uint8Array): string {
  let out = "";
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i]! << 16) | (bytes[i + 1]! << 8) | bytes[i + 2]!;
    out += B64URL[(n >> 18) & 63]! + B64URL[(n >> 12) & 63]! + B64URL[(n >> 6) & 63]! + B64URL[n & 63]!;
  }
  if (i + 1 === bytes.length) {
    const n = bytes[i]! << 16;
    out += B64URL[(n >> 18) & 63]! + B64URL[(n >> 12) & 63]!;
  } else if (i + 2 === bytes.length) {
    const n = (bytes[i]! << 16) | (bytes[i + 1]! << 8);
    out += B64URL[(n >> 18) & 63]! + B64URL[(n >> 12) & 63]! + B64URL[(n >> 6) & 63]!;
  }
  return out;
}

/** Decode base64url (padding and the standard "+/" alphabet are also accepted). Throws on any other character. */
export function fromBase64Url(text: string): Uint8Array {
  const s = text.replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  const out: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of s) {
    const v = B64URL.indexOf(ch);
    if (v < 0) throw new Error("Invalid base64url string.");
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 0xff);
    }
  }
  return Uint8Array.from(out);
}

/** Compare two byte arrays (or strings, as UTF-8) in time that depends only on their length. */
export function constantTimeEqual(a: Uint8Array | string, b: Uint8Array | string): boolean {
  const x = typeof a === "string" ? utf8(a) : a;
  const y = typeof b === "string" ? utf8(b) : b;
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

/** SHA-256 digest. */
export async function sha256(data: Uint8Array | string): Promise<Uint8Array> {
  const bytes = typeof data === "string" ? utf8(data) : data;
  return new Uint8Array(await getSubtle().digest("SHA-256", bytes));
}

/** SHA-256 as base64url: for hashing high-entropy random tokens (reset tokens, refresh tokens, API keys) before storing them. */
export async function hashToken(token: string): Promise<string> {
  return toBase64Url(await sha256(token));
}

/** A new random token: `bytes` of entropy (default 32 = 256 bits), base64url encoded. */
export function randomToken(bytes = 32): string {
  return toBase64Url(secureRandom(bytes));
}

/** A random string of `length` characters from `alphabet`, without modulo bias. */
export function randomString(length: number, alphabet: string): string {
  if (alphabet.length < 2 || alphabet.length > 256) throw new Error("randomString: alphabet must have 2..256 characters.");
  const limit = 256 - (256 % alphabet.length);
  let out = "";
  while (out.length < length) {
    for (const b of secureRandom(Math.max(16, length * 2))) {
      if (b < limit) out += alphabet[b % alphabet.length]!;
      if (out.length === length) break;
    }
  }
  return out;
}
