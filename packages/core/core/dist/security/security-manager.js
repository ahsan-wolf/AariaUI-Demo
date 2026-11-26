import { EventDispatcher } from "../events.js";
/** Holds the active membership provider and broadcasts sign-in changes (ASP.NET `Membership.Provider`). */
export class SecurityManager {
    static provider;
    static factory;
    static currentUserChanged = new EventDispatcher();
    /**
     * Supplies the provider used until `setProvider` is called. The built-in InMemoryAuthProvider registers itself here
     * (an EMPTY provider: there are no built-in accounts). Applications should call `setProvider` at start-up.
     */
    static registerDefaultProviderFactory(factory) {
        SecurityManager.factory ??= factory;
    }
    static get defaultProvider() {
        if (!SecurityManager.provider) {
            if (!SecurityManager.factory)
                throw new Error("No membership provider: call SecurityManager.setProvider(provider).");
            SecurityManager.provider = SecurityManager.factory();
        }
        return SecurityManager.provider;
    }
    static setProvider(provider) {
        SecurityManager.provider = provider;
        void SecurityManager.currentUserChanged.emit(provider, provider.getCurrentUser());
    }
    static notifyCurrentUserChanged(user) {
        void SecurityManager.currentUserChanged.emit(SecurityManager.defaultProvider, user);
    }
}
//# sourceMappingURL=security-manager.js.map