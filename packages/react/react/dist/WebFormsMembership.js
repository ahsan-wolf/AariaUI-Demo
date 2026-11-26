import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect, useId, useState } from 'react';
/**
 * Account adapters: ChangePassword, PasswordRecovery and CreateUserWizard. They emit the same ASP.NET-style
 * `table.lg-<theme>` markup as WebFormsLogin, so the `@wf-controls/styles` login sheets theme them.
 * Pass the theme class (for example "lg-modern") as `className`.
 *
 * Validation errors are shown only after the first submit attempt: the controllers recompute them on every keystroke.
 */
function useSnapshot(controller) {
    const [state, setState] = useState(() => controller.getState());
    useEffect(() => {
        setState(controller.getState());
        const off = controller.stateChanged.subscribe((_, s) => setState(s));
        return () => {
            off();
        };
    }, [controller]);
    return state;
}
const Field = ({ id, label, type = 'text', value, autoComplete, onChange }) => (_jsxs("tr", { children: [_jsx("td", { align: "right", children: _jsx("label", { htmlFor: id, children: label }) }), _jsx("td", { children: _jsx("input", { id: id, type: type, value: value, autoComplete: autoComplete, onChange: (e) => onChange(e.target.value) }) })] }));
const Shell = ({ className, title, children, kind }) => (_jsx("table", { className: `${kind} ${className}`.trim(), role: "presentation", children: _jsx("tbody", { children: _jsx("tr", { children: _jsx("td", { children: _jsx("table", { role: "presentation", children: _jsxs("tbody", { children: [_jsx("tr", { children: _jsx("td", { colSpan: 2, className: "title", align: "center", children: title }) }), children] }) }) }) }) }) }));
const Failure = ({ id, messages }) => messages.length === 0 ? null : (_jsx("tr", { children: _jsx("td", { colSpan: 2, align: "center", children: _jsx("span", { id: id, className: "failure", role: "alert", children: messages.map((m, i) => (_jsxs(React.Fragment, { children: [i > 0 && _jsx("br", {}), m] }, i))) }) }) }));
const Submit = ({ text, type = 'submit', onClick }) => (_jsx("tr", { children: _jsx("td", { colSpan: 2, align: "right", children: _jsx("input", { type: type, value: text, onClick: onClick }) }) }));
export const WebFormsChangePassword = ({ controller, className = '', titleText = 'Change Your Password', successTitleText = 'Change Password Complete', currentPasswordLabelText = 'Password:', newPasswordLabelText = 'New Password:', confirmPasswordLabelText = 'Confirm New Password:', changeButtonText = 'Change Password', continueButtonText = 'Continue', onContinue, }) => {
    const uid = useId();
    const state = useSnapshot(controller);
    const [submitted, setSubmitted] = useState(false);
    if (state.isSuccess) {
        return (_jsxs(Shell, { kind: "wf-change-password", className: className, title: successTitleText, children: [_jsx("tr", { children: _jsx("td", { colSpan: 2, children: state.successText }) }), _jsx(Submit, { text: continueButtonText, type: "button", onClick: () => { controller.continue(); onContinue?.(); } })] }));
    }
    const messages = state.failureMessage ? [state.failureMessage] : submitted ? state.validationErrors : [];
    return (_jsx("form", { noValidate: true, onSubmit: async (e) => {
            e.preventDefault();
            setSubmitted(true);
            await controller.changePassword();
        }, children: _jsxs(Shell, { kind: "wf-change-password", className: className, title: titleText, children: [_jsx(Field, { id: `${uid}-cur`, label: currentPasswordLabelText, type: "password", autoComplete: "current-password", value: controller.currentPassword, onChange: (v) => controller.setCurrentPassword(v) }), _jsx(Field, { id: `${uid}-new`, label: newPasswordLabelText, type: "password", autoComplete: "new-password", value: controller.newPassword, onChange: (v) => controller.setNewPassword(v) }), _jsx(Field, { id: `${uid}-confirm`, label: confirmPasswordLabelText, type: "password", autoComplete: "new-password", value: controller.confirmNewPassword, onChange: (v) => controller.setConfirmNewPassword(v) }), _jsx(Failure, { id: `${uid}-FailureText`, messages: messages }), _jsx(Submit, { text: changeButtonText })] }) }));
};
export const WebFormsPasswordRecovery = ({ controller, className = '', titleText = 'Forgot Your Password?', userNameInstructionText = 'Enter your User Name to receive your password.', userNameLabelText = 'User Name:', answerLabelText = 'Answer:', submitButtonText = 'Submit', }) => {
    const uid = useId();
    const state = useSnapshot(controller);
    if (state.currentStep === 'Success') {
        return (_jsx(Shell, { kind: "wf-password-recovery", className: className, title: titleText, children: _jsx("tr", { children: _jsx("td", { colSpan: 2, children: state.successText }) }) }));
    }
    const isQuestion = state.currentStep === 'Question';
    return (_jsx("form", { noValidate: true, onSubmit: async (e) => {
            e.preventDefault();
            if (isQuestion)
                await controller.submitAnswer();
            else
                await controller.submitUserName();
        }, children: _jsxs(Shell, { kind: "wf-password-recovery", className: className, title: titleText, children: [isQuestion ? (_jsxs(_Fragment, { children: [_jsxs("tr", { children: [_jsx("td", { align: "right", children: "Question:" }), _jsx("td", { children: state.question })] }), _jsx(Field, { id: `${uid}-answer`, label: answerLabelText, value: state.answer, onChange: (v) => controller.setAnswer(v) })] })) : (_jsxs(_Fragment, { children: [_jsx("tr", { children: _jsx("td", { colSpan: 2, className: "instruction", children: userNameInstructionText }) }), _jsx(Field, { id: `${uid}-user`, label: userNameLabelText, autoComplete: "username", value: state.userName, onChange: (v) => controller.setUserName(v) })] })), _jsx(Failure, { id: `${uid}-FailureText`, messages: state.failureMessage ? [state.failureMessage] : [] }), _jsx(Submit, { text: submitButtonText })] }) }));
};
export const WebFormsCreateUserWizard = ({ controller, className = '', titleText = 'Sign Up for Your New Account', completeTitleText = 'Complete', completeText = 'Your account has been successfully created.', userNameLabelText = 'User Name:', passwordLabelText = 'Password:', confirmPasswordLabelText = 'Confirm Password:', emailLabelText = 'E-mail:', questionLabelText = 'Security Question:', answerLabelText = 'Security Answer:', createButtonText = 'Create User', continueButtonText = 'Continue', displayQuestionAndAnswer = false, onCreated, onContinue, }) => {
    const uid = useId();
    const state = useSnapshot(controller);
    const [submitted, setSubmitted] = useState(false);
    if (state.activeStep === 'Complete') {
        return (_jsxs(Shell, { kind: "wf-create-user", className: className, title: completeTitleText, children: [_jsx("tr", { children: _jsx("td", { colSpan: 2, children: completeText }) }), _jsx(Submit, { text: continueButtonText, type: "button", onClick: () => { controller.continue(); onContinue?.(); } })] }));
    }
    const messages = state.failureMessage ? [state.failureMessage] : submitted ? state.validationErrors : [];
    return (_jsx("form", { noValidate: true, onSubmit: async (e) => {
            e.preventDefault();
            setSubmitted(true);
            const ok = await controller.createUser();
            if (ok && controller.user)
                onCreated?.(controller.user);
        }, children: _jsxs(Shell, { kind: "wf-create-user", className: className, title: titleText, children: [_jsx(Field, { id: `${uid}-user`, label: userNameLabelText, autoComplete: "username", value: state.userName, onChange: (v) => controller.setUserName(v) }), _jsx(Field, { id: `${uid}-pass`, label: passwordLabelText, type: "password", autoComplete: "new-password", value: controller.password, onChange: (v) => controller.setPassword(v) }), _jsx(Field, { id: `${uid}-confirm`, label: confirmPasswordLabelText, type: "password", autoComplete: "new-password", value: controller.confirmPassword, onChange: (v) => controller.setConfirmPassword(v) }), _jsx(Field, { id: `${uid}-email`, label: emailLabelText, type: "email", autoComplete: "email", value: state.email, onChange: (v) => controller.setEmail(v) }), displayQuestionAndAnswer && (_jsxs(_Fragment, { children: [_jsx(Field, { id: `${uid}-question`, label: questionLabelText, value: state.question, onChange: (v) => controller.setQuestion(v) }), _jsx(Field, { id: `${uid}-answer`, label: answerLabelText, value: state.answer, onChange: (v) => controller.setAnswer(v) })] })), _jsx(Failure, { id: `${uid}-FailureText`, messages: messages }), _jsx(Submit, { text: createButtonText })] }) }));
};
//# sourceMappingURL=WebFormsMembership.js.map