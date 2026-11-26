import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useState } from 'react';
import { SecurityManager } from '@wf-controls/core';
export const WebFormsLogin = ({ controller, className = '', titleText = 'Log In', userNameLabelText = 'User Name:', passwordLabelText = 'Password:', rememberMeText = 'Remember me next time.', loginButtonText = 'Log In', onLoggedIn, }) => {
    const uid = useId();
    const [state, setState] = useState(() => controller.getState());
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
    if (state.isLoggedIn && !state.visibleWhenLoggedIn)
        return null;
    const submit = async (e) => {
        e.preventDefault();
        setSubmitted(true);
        const ok = await controller.login();
        if (ok && onLoggedIn && controller.currentUser)
            onLoggedIn(controller.currentUser);
    };
    const userErr = submitted && !controller.userName.trim() ? controller.userNameRequiredErrorMessage : null;
    const passErr = submitted && !controller.password ? controller.passwordRequiredErrorMessage : null;
    return (_jsx("form", { onSubmit: submit, noValidate: true, children: _jsx("table", { className: `wf-login ${className}`.trim(), id: `${uid}-login`, role: "presentation", children: _jsx("tbody", { children: _jsx("tr", { children: _jsx("td", { children: _jsx("table", { role: "presentation", children: _jsxs("tbody", { children: [_jsx("tr", { children: _jsx("td", { colSpan: 2, className: "title", align: "center", children: titleText }) }), _jsxs("tr", { children: [_jsx("td", { align: "right", children: _jsx("label", { htmlFor: `${uid}-user`, children: userNameLabelText }) }), _jsxs("td", { children: [_jsx("input", { id: `${uid}-user`, type: "text", value: state.userName, autoComplete: "username", "aria-invalid": userErr ? true : undefined, onChange: (e) => controller.setUserName(e.target.value) }), userErr && _jsx("span", { id: `${uid}-UserNameRequired`, title: userErr, role: "alert", children: "*" })] })] }), _jsxs("tr", { children: [_jsx("td", { align: "right", children: _jsx("label", { htmlFor: `${uid}-pass`, children: passwordLabelText }) }), _jsxs("td", { children: [_jsx("input", { id: `${uid}-pass`, type: "password", value: controller.password, autoComplete: "current-password", "aria-invalid": passErr ? true : undefined, onChange: (e) => controller.setPassword(e.target.value) }), passErr && _jsx("span", { id: `${uid}-PasswordRequired`, title: passErr, role: "alert", children: "*" })] })] }), state.displayRememberMe && (_jsx("tr", { children: _jsxs("td", { colSpan: 2, children: [_jsx("input", { id: `${uid}-remember`, type: "checkbox", checked: state.rememberMeSet, onChange: (e) => controller.setRememberMe(e.target.checked) }), _jsx("label", { htmlFor: `${uid}-remember`, children: rememberMeText })] }) })), state.failureMessage && (_jsx("tr", { children: _jsx("td", { colSpan: 2, align: "center", children: _jsx("span", { id: `${uid}-FailureText`, className: "failure", role: "alert", children: state.failureMessage }) }) })), _jsx("tr", { children: _jsx("td", { colSpan: 2, align: "right", children: _jsx("input", { type: "submit", value: loginButtonText }) }) }), (state.helpPageUrl || state.passwordRecoveryUrl || state.createUserUrl) && (_jsx("tr", { children: _jsxs("td", { colSpan: 2, children: [state.helpPageUrl && _jsx("a", { href: state.helpPageUrl, children: state.helpPageText }), ' ', state.passwordRecoveryUrl && _jsx("a", { href: state.passwordRecoveryUrl, children: state.passwordRecoveryText }), ' ', state.createUserUrl && _jsx("a", { href: state.createUserUrl, children: state.createUserText })] }) }))] }) }) }) }) }) }) }));
};
export const WebFormsLoginStatus = ({ controller, className = '', onLoggedOut }) => {
    const [state, setState] = useState(() => controller.getState());
    useEffect(() => {
        setState(controller.getState());
        const off = controller.stateChanged.subscribe((_, s) => setState(s));
        return () => {
            off();
        };
    }, [controller]);
    const click = async (e) => {
        if (state.isLoggedIn) {
            e.preventDefault();
            if (await controller.logout())
                onLoggedOut?.();
        }
    };
    return (_jsx("a", { className: `wf-login-status ${className}`.trim(), href: state.targetUrl ?? '#', onClick: click, children: state.text }));
};
export const WebFormsLoginName = ({ controller, className = '' }) => {
    const [state, setState] = useState(() => controller.getState());
    useEffect(() => {
        setState(controller.getState());
        const off = controller.stateChanged.subscribe((_, s) => setState(s));
        return () => {
            off();
        };
    }, [controller]);
    if (!state.isLoggedIn)
        return null;
    return _jsx("span", { className: `wf-login-name ${className}`.trim(), children: state.formattedText });
};
/** Renders the template of the matching view: anonymous, first matching role group, or logged-in. */
export const WebFormsLoginView = ({ controller, className }) => {
    const [view, setView] = useState(() => controller.resolveActiveView());
    useEffect(() => {
        setView(controller.resolveActiveView());
        const off = controller.viewChanged.subscribe((_, v) => setView(v));
        return () => {
            off();
        };
    }, [controller]);
    return _jsx("div", { className: `wf-login-view ${className ?? ''}`.trim(), children: view.template });
};
//# sourceMappingURL=WebFormsLogin.js.map