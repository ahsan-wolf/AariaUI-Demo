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
export declare class SlidingWindowRateLimiter implements IRateLimiter {
    private readonly options;
    private readonly hits;
    private readonly now;
    private readonly maxKeys;
    constructor(options: SlidingWindowOptions);
    hit(key: string): RateLimitResult;
    reset(key: string): void;
}
