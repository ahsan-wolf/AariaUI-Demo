import React from 'react';
import type { ChangePasswordController, CreateUserWizardController, IUser, PasswordRecoveryController } from '@wf-controls/core';
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
export declare const WebFormsChangePassword: React.FC<WebFormsChangePasswordProps>;
export interface WebFormsPasswordRecoveryProps {
    controller: PasswordRecoveryController;
    className?: string | undefined;
    titleText?: string | undefined;
    userNameInstructionText?: string | undefined;
    userNameLabelText?: string | undefined;
    answerLabelText?: string | undefined;
    submitButtonText?: string | undefined;
}
export declare const WebFormsPasswordRecovery: React.FC<WebFormsPasswordRecoveryProps>;
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
export declare const WebFormsCreateUserWizard: React.FC<WebFormsCreateUserWizardProps>;
