export interface RateLimitResult {
  allowed: boolean;
  /** Attempts left in the current window (0 when blocked). */
  remaining: number;
  /** When blocked: milliseconds until the oldest attempt leaves the window. */
  retryAfterMs: number;
}

/** Throttles an action per key (client address, user name, ...). */
export interface IRateLimiter {
  /** Records an attempt for `key` and says whether it is allowed. */
  hit(key: string): RateLimitResult;
  /** Forgets `key` (e.g. after a successful login). */
  reset(key: string): void;
}

export interface SlidingWindowOptions {
  /** Attempts allowed per window. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Clock (epoch ms). Tests inject a fake. */
  now?: (() => number) | undefined;
  /** Keys tracked at most (oldest are dropped): bounds memory under attack. Default 10000. */
  maxKeys?: number | undefined;
}

/** In-memory sliding-window limiter. Single process only: use a shared store for several servers. */
export class SlidingWindowRateLimiter implements IRateLimiter {
  private readonly hits = new Map<string, number[]>();
  private readonly now: () => number;
  private readonly maxKeys: number;

  constructor(private readonly options: SlidingWindowOptions) {
    if (!(options.max >= 1) || !(options.windowMs > 0)) throw new Error("max must be >= 1 and windowMs > 0.");
    this.now = options.now ?? (() => Date.now());
    this.maxKeys = options.maxKeys ?? 10_000;
  }

  hit(key: string): RateLimitResult {
    const t = this.now();
    const from = t - this.options.windowMs;
    const list = (this.hits.get(key) ?? []).filter((x) => x > from);
    if (list.length >= this.options.max) {
      this.hits.set(key, list);
      return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, list[0]! + this.options.windowMs - t) };
    }
    list.push(t);
    this.hits.delete(key); // re-insert so the key becomes the newest
    this.hits.set(key, list);
    if (this.hits.size > this.maxKeys) this.hits.delete(this.hits.keys().next().value as string);
    return { allowed: true, remaining: this.options.max - list.length, retryAfterMs: 0 };
  }

  reset(key: string): void {
    this.hits.delete(key);
  }
}
