import { EventDispatcher } from "../events.js";
import { IPrincipal } from "./principal.js";
import { IUser } from "./membership-provider.js";
/**
 * Where a principal can come from besides Membership. FREE core only knows Membership; paid packages
 * (e.g. @wf-controls/enterprise-security: Forms ticket, Windows/SSO) register their own sources.
 */
export interface PrincipalSource {
    /** Return the principal, or null to let the next source answer. */
    resolve(): IPrincipal | null;
    /** The Membership user changed (null = signed out). Use it to keep your own state (e.g. a ticket) in step. */
    onMembershipUserChanged?(user: IUser | null): void | Promise<void>;
    /** Call `notify` whenever `resolve()` may now answer differently. Return an unsubscribe function. */
    subscribe?(notify: () => void): () => void;
}
/**
 * HttpContext.User: the current principal. Resolution order:
 *   1. an external override (`set()`: e.g. a server-reported Windows/SSO identity),
 *   2. the Membership user of SecurityManager's provider,
 *   3. registered sources, in registration order (e.g. a Forms ticket restored from storage),
 *   4. anonymous.
 */
export declare class CurrentPrincipal {
    private static _override;
    private static wired;
    private static readonly sources;
    static readonly changed: EventDispatcher<typeof CurrentPrincipal, IPrincipal>;
    static get current(): IPrincipal;
    /** Set an externally established identity. Pass null to go back to Membership / sources. */
    static set(p: IPrincipal | null): void;
    /** Add a principal source (idempotent per object). Returns a function that removes it. */
    static registerSource(source: PrincipalSource): () => void;
    private static emitChanged;
    private static wire;
    /** Subscribe to principal changes (also wires the SecurityManager bridge). Returns an unsubscribe function. */
    static subscribe(handler: (p: IPrincipal) => void): () => void;
}
