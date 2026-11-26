/** Keeps the last `capacity` events in memory (tests, demos, a status page). */
export class InMemoryAuditSink {
    capacity;
    items = [];
    constructor(capacity = 1000) {
        this.capacity = capacity;
    }
    write(event) {
        this.items.push(event);
        if (this.items.length > this.capacity)
            this.items.shift();
    }
    get events() { return this.items; }
    clear() { this.items.length = 0; }
}
/** Fields that must never be written to an audit event, even by mistake. Used by sinks and tests as a guard. */
export const FORBIDDEN_AUDIT_KEYS = ["password", "newPassword", "oldPassword", "answer", "token", "secret", "key", "hash", "authorization"];
//# sourceMappingURL=audit.js.map