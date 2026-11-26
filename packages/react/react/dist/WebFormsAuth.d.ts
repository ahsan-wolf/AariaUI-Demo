import React from 'react';
import type { AuthorizationConfig, IPrincipal } from '@wf-controls/core';
/** The current principal; the component re-renders when it signs in, signs out or changes. */
export declare function usePrincipal(): IPrincipal;
export interface AuthorizeViewProps {
    /** Show the children to members of any of these roles. */
    roles?: string[] | undefined;
    users?: string[] | undefined;
    /** Require a signed-in user (default true when roles/users are not given). */
    requireAuthenticated?: boolean | undefined;
    /** Rendered when access is denied. */
    fallback?: React.ReactNode | undefined;
    children?: React.ReactNode;
}
/** Shows `children` only to principals that satisfy `roles` / `users` / `requireAuthenticated`. */
export declare const AuthorizeView: React.FC<AuthorizeViewProps>;
export interface RequireAuthProps {
    /** The `<authorization>` / `<location>` rules. */
    authorization: AuthorizationConfig;
    /** The route or URL path being shown, e.g. "/admin/users". */
    path: string;
    verb?: string | undefined;
    /** Rendered when access is denied (e.g. an "Access denied" panel). */
    fallback?: React.ReactNode | undefined;
    /** Called (once per denial) so the app can navigate to the login page. */
    onDenied?: ((path: string, principal: IPrincipal) => void) | undefined;
    children?: React.ReactNode;
}
/** Route guard: renders `children` only when `UrlAuthorization` allows the principal to reach `path`. */
export declare const RequireAuth: React.FC<RequireAuthProps>;
