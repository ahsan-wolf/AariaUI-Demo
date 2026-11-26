import React, { useEffect, useId, useState } from 'react';
import { SecurityManager } from '@wf-controls/core';
import type {
  IUser,
  LoginController,
  LoginNameController,
  LoginState,
  LoginStatusController,
  LoginViewController,
  LoginViewResolvedView,
} from '@wf-controls/core';

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

export const WebFormsLogin: React.FC<WebFormsLoginProps> = ({
  controller,
  className = '',
  titleText = 'Log In',
  userNameLabelText = 'User Name:',
  passwordLabelText = 'Password:',
  rememberMeText = 'Remember me next time.',
  loginButtonText = 'Log In',
  onLoggedIn,
}) => {
  const uid = useId();
  const [state, setState] = useState<LoginState>(() => controller.getState());
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setState(controller.getState());
    const off = controller.stateChanged.subscribe((_, s) => setState(s));
    // Another control (LoginStatus, ChangePassword...) can sign the user in or out without touching this controller.
    const offUser = SecurityManager.currentUserChanged.subscribe(() => setState(controller.getState()));
    return () => {
      off();
      offUser();
    };
  }, [controller]);

  if (state.isLoggedIn && !state.visibleWhenLoggedIn) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const ok = await controller.login();
    if (ok && onLoggedIn && controller.currentUser) onLoggedIn(controller.currentUser);
  };

  const userErr = submitted && !controller.userName.trim() ? controller.userNameRequiredErrorMessage : null;
  const passErr = submitted && !controller.password ? controller.passwordRequiredErrorMessage : null;

  return (
    <form onSubmit={submit} noValidate>
      <table className={`wf-login ${className}`.trim()} id={`${uid}-login`} role="presentation">
        <tbody>
          <tr>
            <td>
              <table role="presentation">
                <tbody>
                  <tr>
                    <td colSpan={2} className="title" align="center">{titleText}</td>
                  </tr>
                  <tr>
                    <td align="right"><label htmlFor={`${uid}-user`}>{userNameLabelText}</label></td>
                    <td>
                      <input
                        id={`${uid}-user`}
                        type="text"
                        value={state.userName}
                        autoComplete="username"
                        aria-invalid={userErr ? true : undefined}
                        onChange={(e) => controller.setUserName(e.target.value)}
                      />
                      {userErr && <span id={`${uid}-UserNameRequired`} title={userErr} role="alert">*</span>}
                    </td>
                  </tr>
                  <tr>
                    <td align="right"><label htmlFor={`${uid}-pass`}>{passwordLabelText}</label></td>
                    <td>
                      <input
                        id={`${uid}-pass`}
                        type="password"
                        value={controller.password}
                        autoComplete="current-password"
                        aria-invalid={passErr ? true : undefined}
                        onChange={(e) => controller.setPassword(e.target.value)}
                      />
                      {passErr && <span id={`${uid}-PasswordRequired`} title={passErr} role="alert">*</span>}
                    </td>
                  </tr>
                  {state.displayRememberMe && (
                    <tr>
                      <td colSpan={2}>
                        <input
                          id={`${uid}-remember`}
                          type="checkbox"
                          checked={state.rememberMeSet}
                          onChange={(e) => controller.setRememberMe(e.target.checked)}
                        />
                        <label htmlFor={`${uid}-remember`}>{rememberMeText}</label>
                      </td>
                    </tr>
                  )}
                  {state.failureMessage && (
                    <tr>
                      <td colSpan={2} align="center">
                        <span id={`${uid}-FailureText`} className="failure" role="alert">{state.failureMessage}</span>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={2} align="right">
                      <input type="submit" value={loginButtonText} />
                    </td>
                  </tr>
                  {(state.helpPageUrl || state.passwordRecoveryUrl || state.createUserUrl) && (
                    <tr>
                      <td colSpan={2}>
                        {state.helpPageUrl && <a href={state.helpPageUrl}>{state.helpPageText}</a>}{' '}
                        {state.passwordRecoveryUrl && <a href={state.passwordRecoveryUrl}>{state.passwordRecoveryText}</a>}{' '}
                        {state.createUserUrl && <a href={state.createUserUrl}>{state.createUserText}</a>}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </form>
  );
};

export interface WebFormsLoginStatusProps {
  controller: LoginStatusController;
  /** Theme class, e.g. "lg-modern". */
  className?: string | undefined;
  /** Called after a logout completed. */
  onLoggedOut?: (() => void) | undefined;
}

export const WebFormsLoginStatus: React.FC<WebFormsLoginStatusProps> = ({ controller, className = '', onLoggedOut }) => {
  const [state, setState] = useState(() => controller.getState());

  useEffect(() => {
    setState(controller.getState());
    const off = controller.stateChanged.subscribe((_, s) => setState(s));
    return () => {
      off();
    };
  }, [controller]);

  const click = async (e: React.MouseEvent) => {
    if (state.isLoggedIn) {
      e.preventDefault();
      if (await controller.logout()) onLoggedOut?.();
    }
  };

  return (
    <a className={`wf-login-status ${className}`.trim()} href={state.targetUrl ?? '#'} onClick={click}>
      {state.text}
    </a>
  );
};

export interface WebFormsLoginNameProps {
  controller: LoginNameController;
  /** Theme class, e.g. "lg-modern". */
  className?: string | undefined;
}

export const WebFormsLoginName: React.FC<WebFormsLoginNameProps> = ({ controller, className = '' }) => {
  const [state, setState] = useState(() => controller.getState());

  useEffect(() => {
    setState(controller.getState());
    const off = controller.stateChanged.subscribe((_, s) => setState(s));
    return () => {
      off();
    };
  }, [controller]);

  if (!state.isLoggedIn) return null;
  return <span className={`wf-login-name ${className}`.trim()}>{state.formattedText}</span>;
};

export interface WebFormsLoginViewProps {
  controller: LoginViewController<React.ReactNode>;
  className?: string | undefined;
}

/** Renders the template of the matching view: anonymous, first matching role group, or logged-in. */
export const WebFormsLoginView: React.FC<WebFormsLoginViewProps> = ({ controller, className }) => {
  const [view, setView] = useState<LoginViewResolvedView<React.ReactNode>>(() => controller.resolveActiveView());

  useEffect(() => {
    setView(controller.resolveActiveView());
    const off = controller.viewChanged.subscribe((_, v) => setView(v));
    return () => {
      off();
    };
  }, [controller]);

  return <div className={`wf-login-view ${className ?? ''}`.trim()}>{view.template}</div>;
};
