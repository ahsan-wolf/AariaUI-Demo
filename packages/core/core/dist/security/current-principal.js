import { EventDispatcher } from "../events.js";
import { GenericIdentity, GenericPrincipal, AnonymousPrincipal } from "./principal.js";
import { SecurityManager } from "./membership-provider.js";
/**
 * HttpContext.User: the current principal. Resolution order:
 *   1. an external override (`set()`: e.g. a server-reported Windows/SSO identity),
 *   2. the Membership user of SecurityManager's provider,
 *   3. registered sources, in registration order (e.g. a Forms ticket restored from storage),
 *   4. anonymous.
 */
export class CurrentPrincipal {
    static _override = null;
    static wired = false;
    static sources = [];
    static changed = new EventDispatcher();
    static get current() {
        CurrentPrincipal.wire();
        if (CurrentPrincipal._override)
            return CurrentPrincipal._override;
        const u = SecurityManager.defaultProvider.getCurrentUser();
        if (u)
            return new GenericPrincipal(new GenericIdentity(u.userName, "Membership"), u.roles ?? []);
        for (const s of CurrentPrincipal.sources) {
            const p = s.resolve();
            if (p)
                return p;
        }
        return AnonymousPrincipal;
    }
    /** Set an externally established identity. Pass null to go back to Membership / sources. */
    static set(p) {
        CurrentPrincipal._override = p;
        void CurrentPrincipal.emitChanged(true);
    }
    /** Add a principal source (idempotent per object). Returns a function that removes it. */
    static registerSource(source) {
        CurrentPrincipal.wire();
        if (!CurrentPrincipal.sources.includes(source))
            CurrentPrincipal.sources.push(source);
        const off = source.subscribe?.(() => { void CurrentPrincipal.emitChanged(); });
        void CurrentPrincipal.emitChanged();
        return () => {
            off?.();
            const i = CurrentPrincipal.sources.indexOf(source);
            if (i >= 0)
                CurrentPrincipal.sources.splice(i, 1);
            void CurrentPrincipal.emitChanged();
        };
    }
    static async emitChanged(force = false) {
        if (!force && CurrentPrincipal._override)
            return;
        await CurrentPrincipal.changed.emit(CurrentPrincipal, CurrentPrincipal.current);
    }
    static wire() {
        if (CurrentPrincipal.wired)
            return;
        CurrentPrincipal.wired = true;
        SecurityManager.currentUserChanged.subscribe(async (_p, user) => {
            for (const s of [...CurrentPrincipal.sources])
                await s.onMembershipUserChanged?.(user);
            await CurrentPrincipal.emitChanged();
        });
    }
    /** Subscribe to principal changes (also wires the SecurityManager bridge). Returns an unsubscribe function. */
    static subscribe(handler) {
        CurrentPrincipal.wire();
        return CurrentPrincipal.changed.subscribe((_s, p) => { handler(p); });
    }
}
//# sourceMappingURL=current-principal.js.map