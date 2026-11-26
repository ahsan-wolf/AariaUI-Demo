import React, { useEffect, useId, useState } from 'react';
import type {
  ChangePasswordController,
  EventDispatcher,
  ChangePasswordState,
  CreateUserWizardController,
  CreateUserWizardState,
  IUser,
  PasswordRecoveryController,
  PasswordRecoveryState,
} from '@wf-controls/core';

/**
 * Account adapters: ChangePassword, PasswordRecovery and CreateUserWizard. They emit the same ASP.NET-style
 * `table.lg-<theme>` markup as WebFormsLogin, so the `@wf-controls/styles` login sheets theme them.
 * Pass the theme class (for example "lg-modern") as `className`.
 *
 * Validation errors are shown only after the first submit attempt: the controllers recompute them on every keystroke.
 */

function useSnapshot<C extends { getState(): S; stateChanged: EventDispatcher<C, S> }, S>(controller: C): S {
  const [state, setState] = useState<S>(() => controller.getState());
  useEffect(() => {
    setState(controller.getState());
    const off = controller.stateChanged.subscribe((_, s) => setState(s));
    return () => {
      off();
    };
  }, [controller]);
  return state;
}

interface Row {
  id: string;
  label: string;
  type?: 'text' | 'password' | 'email';
  value: string;
  autoComplete?: string;
  onChange: (v: string) => void;
}

const Field: React.FC<Row> = ({ id, label, type = 'text', value, autoComplete, onChange }) => (
  <tr>
    <td align="right"><label htmlFor={id}>{label}</label></td>
    <td>
      <input id={id} type={type} value={value} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} />
    </td>
  </tr>
);

const Shell: React.FC<{ className: string; title: string; children: React.ReactNode; kind: string }> = ({ className, title, children, kind }) => (
  <table className={`${kind} ${className}`.trim()} role="presentation">
    <tbody>
      <tr>
        <td>
          <table role="presentation">
            <tbody>
              <tr><td colSpan={2} className="title" align="center">{title}</td></tr>
              {children}
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
);

const Failure: React.FC<{ id: string; messages: string[] }> = ({ id, messages }) =>
  messages.length === 0 ? null : (
    <tr>
      <td colSpan={2} align="center">
        <span id={id} className="failure" role="alert">
          {messages.map((m, i) => (<React.Fragment key={i}>{i > 0 && <br />}{m}</React.Fragment>))}
        </span>
      </td>
    </tr>
  );

const Submit: React.FC<{ text: string; type?: 'submit' | 'button'; onClick?: () => void }> = ({ text, type = 'submit', onClick }) => (
  <tr>
    <td colSpan={2} align="right">
      <input type={type} value={text} onClick={onClick} />
    </td>
  </tr>
);

/* ------------------------------------------------------------------ ChangePassword */

export interface WebFormsChangePasswordProps {
  controller: ChangePasswordController;
  className?: string | undefined;
  titleText?: string | undefined;
  successTitleText?: string | undefined;
  currentPasswordLabelText?: string | undefined;
  newPasswordLabelText?: string | undefined;
  confirmPasswordLabelText?: string | undefined;
  changeButtonText?: string | undefined;
  continueButtonText?: string | undefined;
  /** Called when Continue is pressed (the controller also raises continueButtonClick). */
  onContinue?: (() => void) | undefined;
}

export const WebFormsChangePassword: React.FC<WebFormsChangePasswordProps> = ({
  controller,
  className = '',
  titleText = 'Change Your Password',
  successTitleText = 'Change Password Complete',
  currentPasswordLabelText = 'Password:',
  newPasswordLabelText = 'New Password:',
  confirmPasswordLabelText = 'Confirm New Password:',
  changeButtonText = 'Change Password',
  continueButtonText = 'Continue',
  onContinue,
}) => {
  const uid = useId();
  const state: ChangePasswordState = useSnapshot(controller);
  const [submitted, setSubmitted] = useState(false);

  if (state.isSuccess) {
    return (
      <Shell kind="wf-change-password" className={className} title={successTitleText}>
        <tr><td colSpan={2}>{state.successText}</td></tr>
        <Submit text={continueButtonText} type="button" onClick={() => { controller.continue(); onContinue?.(); }} />
      </Shell>
    );
  }

  const messages = state.failureMessage ? [state.failureMessage] : submitted ? state.validationErrors : [];
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitted(true);
        await controller.changePassword();
      }}
    >
      <Shell kind="wf-change-password" className={className} title={titleText}>
        <Field id={`${uid}-cur`} label={currentPasswordLabelText} type="password" autoComplete="current-password" value={controller.currentPassword} onChange={(v) => controller.setCurrentPassword(v)} />
        <Field id={`${uid}-new`} label={newPasswordLabelText} type="password" autoComplete="new-password" value={controller.newPassword} onChange={(v) => controller.setNewPassword(v)} />
        <Field id={`${uid}-confirm`} label={confirmPasswordLabelText} type="password" autoComplete="new-password" value={controller.confirmNewPassword} onChange={(v) => controller.setConfirmNewPassword(v)} />
        <Failure id={`${uid}-FailureText`} messages={messages} />
        <Submit text={changeButtonText} />
      </Shell>
    </form>
  );
};

/* ------------------------------------------------------------------ PasswordRecovery */

export interface WebFormsPasswordRecoveryProps {
  controller: PasswordRecoveryController;
  className?: string | undefined;
  titleText?: string | undefined;
  userNameInstructionText?: string | undefined;
  userNameLabelText?: string | undefined;
  answerLabelText?: string | undefined;
  submitButtonText?: string | undefined;
}

export const WebFormsPasswordRecovery: React.FC<WebFormsPasswordRecoveryProps> = ({
  controller,
  className = '',
  titleText = 'Forgot Your Password?',
  userNameInstructionText = 'Enter your User Name to receive your password.',
  userNameLabelText = 'User Name:',
  answerLabelText = 'Answer:',
  submitButtonText = 'Submit',
}) => {
  const uid = useId();
  const state: PasswordRecoveryState = useSnapshot(controller);

  if (state.currentStep === 'Success') {
    return (
      <Shell kind="wf-password-recovery" className={className} title={titleText}>
        <tr><td colSpan={2}>{state.successText}</td></tr>
      </Shell>
    );
  }

  const isQuestion = state.currentStep === 'Question';
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (isQuestion) await controller.submitAnswer();
        else await controller.submitUserName();
      }}
    >
      <Shell kind="wf-password-recovery" className={className} title={titleText}>
        {isQuestion ? (
          <>
            <tr><td align="right">Question:</td><td>{state.question}</td></tr>
            <Field id={`${uid}-answer`} label={answerLabelText} value={state.answer} onChange={(v) => controller.setAnswer(v)} />
          </>
        ) : (
          <>
            <tr><td colSpan={2} className="instruction">{userNameInstructionText}</td></tr>
            <Field id={`${uid}-user`} label={userNameLabelText} autoComplete="username" value={state.userName} onChange={(v) => controller.setUserName(v)} />
          </>
        )}
        <Failure id={`${uid}-FailureText`} messages={state.failureMessage ? [state.failureMessage] : []} />
        <Submit text={submitButtonText} />
      </Shell>
    </form>
  );
};

/* ------------------------------------------------------------------ CreateUserWizard */

export interface WebFormsCreateUserWizardProps {
  controller: CreateUserWizardController;
  className?: string | undefined;
  titleText?: string | undefined;
  completeTitleText?: string | undefined;
  completeText?: string | undefined;
  userNameLabelText?: string | undefined;
  passwordLabelText?: string | undefined;
  confirmPasswordLabelText?: string | undefined;
  emailLabelText?: string | undefined;
  questionLabelText?: string | undefined;
  answerLabelText?: string | undefined;
  createButtonText?: string | undefined;
  continueButtonText?: string | undefined;
  /** Show the security question and answer fields. Default false. */
  displayQuestionAndAnswer?: boolean | undefined;
  /** Called with the new user after a successful sign-up. */
  onCreated?: ((user: IUser) => void) | undefined;
  /** Called when Continue is pressed (the controller also raises continueButtonClick). */
  onContinue?: (() => void) | undefined;
}

export const WebFormsCreateUserWizard: React.FC<WebFormsCreateUserWizardProps> = ({
  controller,
  className = '',
  titleText = 'Sign Up for Your New Account',
  completeTitleText = 'Complete',
  completeText = 'Your account has been successfully created.',
  userNameLabelText = 'User Name:',
  passwordLabelText = 'Password:',
  confirmPasswordLabelText = 'Confirm Password:',
  emailLabelText = 'E-mail:',
  questionLabelText = 'Security Question:',
  answerLabelText = 'Security Answer:',
  createButtonText = 'Create User',
  continueButtonText = 'Continue',
  displayQuestionAndAnswer = false,
  onCreated,
  onContinue,
}) => {
  const uid = useId();
  const state: CreateUserWizardState = useSnapshot(controller);
  const [submitted, setSubmitted] = useState(false);

  if (state.activeStep === 'Complete') {
    return (
      <Shell kind="wf-create-user" className={className} title={completeTitleText}>
        <tr><td colSpan={2}>{completeText}</td></tr>
        <Submit text={continueButtonText} type="button" onClick={() => { controller.continue(); onContinue?.(); }} />
      </Shell>
    );
  }

  const messages = state.failureMessage ? [state.failureMessage] : submitted ? state.validationErrors : [];
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitted(true);
        const ok = await controller.createUser();
        if (ok && controller.user) onCreated?.(controller.user);
      }}
    >
      <Shell kind="wf-create-user" className={className} title={titleText}>
        <Field id={`${uid}-user`} label={userNameLabelText} autoComplete="username" value={state.userName} onChange={(v) => controller.setUserName(v)} />
        <Field id={`${uid}-pass`} label={passwordLabelText} type="password" autoComplete="new-password" value={controller.password} onChange={(v) => controller.setPassword(v)} />
        <Field id={`${uid}-confirm`} label={confirmPasswordLabelText} type="password" autoComplete="new-password" value={controller.confirmPassword} onChange={(v) => controller.setConfirmPassword(v)} />
        <Field id={`${uid}-email`} label={emailLabelText} type="email" autoComplete="email" value={state.email} onChange={(v) => controller.setEmail(v)} />
        {displayQuestionAndAnswer && (
          <>
            <Field id={`${uid}-question`} label={questionLabelText} value={state.question} onChange={(v) => controller.setQuestion(v)} />
            <Field id={`${uid}-answer`} label={answerLabelText} value={state.answer} onChange={(v) => controller.setAnswer(v)} />
          </>
        )}
        <Failure id={`${uid}-FailureText`} messages={messages} />
        <Submit text={createButtonText} />
      </Shell>
    </form>
  );
};
