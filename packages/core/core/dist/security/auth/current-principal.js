import { EventDispatcher } from "../../events.js";
import { GenericIdentity, GenericPrincipal } from "./principal.js";
import { SecurityManager } from "../membership-provider.js";
import { FormsAuthentication } from "./forms-authentication.js";
/**
 * HttpContext.User: the current principal. Resolution order:
 *   1. an external override (`set()`: server-supplied Windows/SSO/JWT identity),
 *   2. the Membership user of SecurityManager's provider,
 *   3. a valid FormsAuthentication ticket (this is how a reloaded page gets its session back from storage),
 *   4. anonymous.
 * Signing out through the membership provider also removes the Forms ticket, so the two cannot disagree.
 */
export class CurrentPrincipal {
    static _override = null;
    static wired = false;
    static changed = new EventDispatcher();
    static get current() {
        CurrentPrincipal.wire();
        if (CurrentPrincipal._override)
            return CurrentPrincipal._override;
        const u = SecurityManager.defaultProvider.getCurrentUser();
        if (u)
            return new GenericPrincipal(new GenericIdentity(u.userName, "Membership"), u.roles ?? []);
        return FormsAuthentication.getPrincipal();
    }
    /** Set an externally established identity. Pass null to go back to Membership / Forms. */
    static set(p) {
        CurrentPrincipal._override = p;
        void CurrentPrincipal.changed.emit(CurrentPrincipal, CurrentPrincipal.current);
    }
    static wire() {
        if (CurrentPrincipal.wired)
            return;
        CurrentPrincipal.wired = true;
        SecurityManager.currentUserChanged.subscribe(async (_p, user) => {
            if (user === null && FormsAuthentication.getTicket() !== null) {
                await FormsAuthentication.signOut(); // emits sessionChanged -> changed
                return;
            }
            if (!CurrentPrincipal._override)
                await CurrentPrincipal.changed.emit(CurrentPrincipal, CurrentPrincipal.current);
        });
        FormsAuthentication.sessionChanged.subscribe(async () => {
            if (!CurrentPrincipal._override)
                await CurrentPrincipal.changed.emit(CurrentPrincipal, CurrentPrincipal.current);
        });
    }
    /** Subscribe to principal changes (also wires the bridges). Returns an unsubscribe function. */
    static subscribe(handler) {
        CurrentPrincipal.wire();
        return CurrentPrincipal.changed.subscribe((_s, p) => { handler(p); });
    }
}
//# sourceMappingURL=current-principal.js.map