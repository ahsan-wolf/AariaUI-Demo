import { EventDispatcher } from "../../events.js";
import { IPrincipal } from "./principal.js";
/**
 * HttpContext.User: the current principal. Resolution order:
 *   1. an external override (`set()`: server-supplied Windows/SSO/JWT identity),
 *   2. the Membership user of SecurityManager's provider,
 *   3. a valid FormsAuthentication ticket (this is how a reloaded page gets its session back from storage),
 *   4. anonymous.
 * Signing out through the membership provider also removes the Forms ticket, so the two cannot disagree.
 */
export declare class CurrentPrincipal {
    private static _override;
    private static wired;
    static readonly changed: EventDispatcher<typeof CurrentPrincipal, IPrincipal>;
    static get current(): IPrincipal;
    /** Set an externally established identity. Pass null to go back to Membership / Forms. */
    static set(p: IPrincipal | null): void;
    private static wire;
    /** Subscribe to principal changes (also wires the bridges). Returns an unsubscribe function. */
    static subscribe(handler: (p: IPrincipal) => void): () => void;
}
