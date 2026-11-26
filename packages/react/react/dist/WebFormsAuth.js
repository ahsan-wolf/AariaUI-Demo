import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useSyncExternalStore } from 'react';
import { AnonymousPrincipal, CurrentPrincipal, UrlAuthorization, authorizeControl } from '@wf-controls/core';
/**
 * Authorization adapters over core's `CurrentPrincipal` (HttpContext.User), `UrlAuthorization` (`<authorization>`)
 * and `authorizeControl`. These only decide what the UI shows. They are not security: enforce the same rules
 * on the server.
 */
// useSyncExternalStore needs a stable snapshot between changes: cache the principal until the store notifies.
let snapshot;
function subscribe(onChange) {
    return CurrentPrincipal.subscribe(() => { snapshot = undefined; onChange(); });
}
function getSnapshot() {
    snapshot ??= CurrentPrincipal.current;
    return snapshot;
}
/** The current principal; the component re-renders when it signs in, signs out or changes. */
export function usePrincipal() {
    return useSyncExternalStore(subscribe, getSnapshot, () => AnonymousPrincipal);
}
/** Shows `children` only to principals that satisfy `roles` / `users` / `requireAuthenticated`. */
export const AuthorizeView = ({ roles, users, requireAuthenticated, fallback = null, children }) => {
    const principal = usePrincipal();
    const hasSubject = (roles?.length ?? 0) > 0 || (users?.length ?? 0) > 0;
    const ok = authorizeControl(principal, { roles, users, requireAuthenticated: requireAuthenticated ?? !hasSubject });
    return _jsx(_Fragment, { children: ok ? children : fallback });
};
/** Route guard: renders `children` only when `UrlAuthorization` allows the principal to reach `path`. */
export const RequireAuth = ({ authorization, path, verb, fallback = null, onDenied, children }) => {
    const principal = usePrincipal();
    const allowed = UrlAuthorization.checkUrlAccessForPrincipal(path, principal, authorization, verb);
    useEffect(() => { if (!allowed)
        onDenied?.(path, principal); }, [allowed, path, principal, onDenied]);
    return _jsx(_Fragment, { children: allowed ? children : fallback });
};
//# sourceMappingURL=WebFormsAuth.js.map