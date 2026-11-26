/** Security-relevant events. They never carry passwords, answers, tokens or keys. */
export type AuthAuditType = "user.created" | "user.deleted" | "user.updated" | "login.success" | "login.failure" | "login.locked-out" | "logout" | "user.unlocked" | "password.changed" | "password.reset" | "password.reset-requested" | "password.reset-failed" | "question.changed" | "role.created" | "role.deleted" | "role.assigned" | "role.removed" | "token.issued" | "token.refreshed" | "token.revoked" | "token.reuse-detected" | "ticket.issued" | "ticket.rejected" | "authentication.failed" | "authorization.denied";
export interface AuthAuditEvent {
    type: AuthAuditType;
    /** When it happened (epoch ms). */
    at: number;
    userName?: string | undefined;
    success?: boolean | undefined;
    /** Short non-sensitive reason, e.g. "bad-password", "unknown-user", "locked". */
    reason?: string | undefined;
    /** Optional extra non-sensitive fields (ip, scheme, resource, ...). */
    detail?: Record<string, string | number | boolean> | undefined;
}
export interface IAuditSink {
    write(event: AuthAuditEvent): void | Promise<void>;
}
/** Keeps the last `capacity` events in memory (tests, demos, a status page). */
export declare class InMemoryAuditSink implements IAuditSink {
    private readonly capacity;
    private readonly items;
    constructor(capacity?: number);
    write(event: AuthAuditEvent): void;
    get events(): readonly AuthAuditEvent[];
    clear(): void;
}
/** Fields that must never be written to an audit event, even by mistake. Used by sinks and tests as a guard. */
export declare const FORBIDDEN_AUDIT_KEYS: readonly ["password", "newPassword", "oldPassword", "answer", "token", "secret", "key", "hash", "authorization"];
