import React from 'react';
import type { IUser, LoginController, LoginNameController, LoginStatusController, LoginViewController } from '@wf-controls/core';
/**
 * Login family adapters. They emit the ASP.NET-style markup the `@wf-controls/styles` `lg-<theme>` sheets target:
 * `table.lg-<theme>` for Login, `a.lg-<theme>` for LoginStatus and `span.lg-<theme>` for LoginName.
 * Pass the theme class (for example "lg-modern") as `className`.
 */
export interface WebFormsLoginProps {
    controller: LoginController;
    /** Theme class on the root table, e.g. "lg-modern". */
    className?: string | undefined;
    /** Heading text. Default "Log In". */
    titleText?: string | undefined;
    userNameLabelText?: string | undefined;
    passwordLabelText?: string | undefined;
    rememberMeText?: string | undefined;
    loginButtonText?: string | undefined;
    /** Called after a successful login. */
    onLoggedIn?: ((user: IUser) => void) | undefined;
}
export declare const WebFormsLogin: React.FC<WebFormsLoginProps>;
export interface WebFormsLoginStatusProps {
    controller: LoginStatusController;
    /** Theme class, e.g. "lg-modern". */
    className?: string | undefined;
    /** Called after a logout completed. */
    onLoggedOut?: (() => void) | undefined;
}
export declare const WebFormsLoginStatus: React.FC<WebFormsLoginStatusProps>;
export interface WebFormsLoginNameProps {
    controller: LoginNameController;
    /** Theme class, e.g. "lg-modern". */
    className?: string | undefined;
}
export declare const WebFormsLoginName: React.FC<WebFormsLoginNameProps>;
export interface WebFormsLoginViewProps {
    controller: LoginViewController<React.ReactNode>;
    className?: string | undefined;
}
/** Renders the template of the matching view: anonymous, first matching role group, or logged-in. */
export declare const WebFormsLoginView: React.FC<WebFormsLoginViewProps>;
