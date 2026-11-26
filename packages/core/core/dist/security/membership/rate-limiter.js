/** In-memory sliding-window limiter. Single process only: use a shared store for several servers. */
export class SlidingWindowRateLimiter {
    options;
    hits = new Map();
    now;
    maxKeys;
    constructor(options) {
        this.options = options;
        if (!(options.max >= 1) || !(options.windowMs > 0))
            throw new Error("max must be >= 1 and windowMs > 0.");
        this.now = options.now ?? (() => Date.now());
        this.maxKeys = options.maxKeys ?? 10_000;
    }
    hit(key) {
        const t = this.now();
        const from = t - this.options.windowMs;
        const list = (this.hits.get(key) ?? []).filter((x) => x > from);
        if (list.length >= this.options.max) {
            this.hits.set(key, list);
            return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, list[0] + this.options.windowMs - t) };
        }
        list.push(t);
        this.hits.delete(key); // re-insert so the key becomes the newest
        this.hits.set(key, list);
        if (this.hits.size > this.maxKeys)
            this.hits.delete(this.hits.keys().next().value);
        return { allowed: true, remaining: this.options.max - list.length, retryAfterMs: 0 };
    }
    reset(key) {
        this.hits.delete(key);
    }
}
//# sourceMappingURL=rate-limiter.js.map