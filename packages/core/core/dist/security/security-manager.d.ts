import { EventDispatcher } from "../events.js";
import type { IMembershipProvider, IUser } from "./membership-types.js";
/** Holds the active membership provider and broadcasts sign-in changes (ASP.NET `Membership.Provider`). */
export declare class SecurityManager {
    private static provider;
    private static factory;
    static readonly currentUserChanged: EventDispatcher<IMembershipProvider, IUser | null>;
    /**
     * Supplies the provider used until `setProvider` is called. The built-in InMemoryAuthProvider registers itself here
     * (an EMPTY provider: there are no built-in accounts). Applications should call `setProvider` at start-up.
     */
    static registerDefaultProviderFactory(factory: () => IMembershipProvider): void;
    static get defaultProvider(): IMembershipProvider;
    static setProvider(provider: IMembershipProvider): void;
    static notifyCurrentUserChanged(user: IUser | null): void;
}
