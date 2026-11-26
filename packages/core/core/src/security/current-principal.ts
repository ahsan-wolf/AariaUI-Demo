import { EventDispatcher } from "../events.js";
import { IPrincipal, GenericIdentity, GenericPrincipal, AnonymousPrincipal } from "./principal.js";
import { IUser, SecurityManager } from "./membership-provider.js";

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
export class CurrentPrincipal {
  private static _override: IPrincipal | null = null;
  private static wired = false;
  private static readonly sources: PrincipalSource[] = [];
  public static readonly changed = new EventDispatcher<typeof CurrentPrincipal, IPrincipal>();

  static get current(): IPrincipal {
    CurrentPrincipal.wire();
    if (CurrentPrincipal._override) return CurrentPrincipal._override;
    const u = SecurityManager.defaultProvider.getCurrentUser();
    if (u) return new GenericPrincipal(new GenericIdentity(u.userName, "Membership"), u.roles ?? []);
    for (const s of CurrentPrincipal.sources) {
      const p = s.resolve();
      if (p) return p;
    }
    return AnonymousPrincipal;
  }

  /** Set an externally established identity. Pass null to go back to Membership / sources. */
  static set(p: IPrincipal | null): void {
    CurrentPrincipal._override = p;
    void CurrentPrincipal.emitChanged(true);
  }

  /** Add a principal source (idempotent per object). Returns a function that removes it. */
  static registerSource(source: PrincipalSource): () => void {
    CurrentPrincipal.wire();
    if (!CurrentPrincipal.sources.includes(source)) CurrentPrincipal.sources.push(source);
    const off = source.subscribe?.(() => { void CurrentPrincipal.emitChanged(); });
    void CurrentPrincipal.emitChanged();
    return () => {
      off?.();
      const i = CurrentPrincipal.sources.indexOf(source);
      if (i >= 0) CurrentPrincipal.sources.splice(i, 1);
      void CurrentPrincipal.emitChanged();
    };
  }

  private static async emitChanged(force = false): Promise<void> {
    if (!force && CurrentPrincipal._override) return;
    await CurrentPrincipal.changed.emit(CurrentPrincipal, CurrentPrincipal.current);
  }

  private static wire(): void {
    if (CurrentPrincipal.wired) return;
    CurrentPrincipal.wired = true;
    SecurityManager.currentUserChanged.subscribe(async (_p, user) => {
      for (const s of [...CurrentPrincipal.sources]) await s.onMembershipUserChanged?.(user);
      await CurrentPrincipal.emitChanged();
    });
  }

  /** Subscribe to principal changes (also wires the SecurityManager bridge). Returns an unsubscribe function. */
  static subscribe(handler: (p: IPrincipal) => void): () => void {
    CurrentPrincipal.wire();
    return CurrentPrincipal.changed.subscribe((_s, p) => { handler(p); });
  }
}
