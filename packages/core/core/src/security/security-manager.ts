import { EventDispatcher } from "../events.js";
import type { IMembershipProvider, IUser } from "./membership-types.js";

/** Holds the active membership provider and broadcasts sign-in changes (ASP.NET `Membership.Provider`). */
export class SecurityManager {
  private static provider: IMembershipProvider | undefined;
  private static factory: (() => IMembershipProvider) | undefined;

  public static readonly currentUserChanged = new EventDispatcher<IMembershipProvider, IUser | null>();

  /**
   * Supplies the provider used until `setProvider` is called. The built-in InMemoryAuthProvider registers itself here
   * (an EMPTY provider: there are no built-in accounts). Applications should call `setProvider` at start-up.
   */
  static registerDefaultProviderFactory(factory: () => IMembershipProvider): void {
    SecurityManager.factory ??= factory;
  }

  static get defaultProvider(): IMembershipProvider {
    if (!SecurityManager.provider) {
      if (!SecurityManager.factory) throw new Error("No membership provider: call SecurityManager.setProvider(provider).");
      SecurityManager.provider = SecurityManager.factory();
    }
    return SecurityManager.provider;
  }

  static setProvider(provider: IMembershipProvider): void {
    SecurityManager.provider = provider;
    void SecurityManager.currentUserChanged.emit(provider, provider.getCurrentUser());
  }

  static notifyCurrentUserChanged(user: IUser | null): void {
    void SecurityManager.currentUserChanged.emit(SecurityManager.defaultProvider, user);
  }
}
