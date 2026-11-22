import { CancelEventArgs, EventDispatcher } from "../events.js";
import { IMembershipProvider } from "./membership-provider.js";
export type PasswordRecoveryStep = "UserName" | "Question" | "Success";
export interface PasswordRecoveryMailEventArgs extends CancelEventArgs {
    userName: string;
    recipientEmail?: string | undefined;
    newPassword?: string | undefined;
}
export interface PasswordRecoveryOptions {
    id?: string | undefined;
    userName?: string | undefined;
    userNameFailureText?: string | undefined;
    questionFailureText?: string | undefined;
    successText?: string | undefined;
    requireQuestionAndAnswer?: boolean | undefined;
    provider?: IMembershipProvider | undefined;
}
export interface PasswordRecoveryState {
    currentStep: PasswordRecoveryStep;
    userName: string;
    question: string | null;
    answer: string;
    failureMessage: string | null;
    successText: string;
    isComplete: boolean;
}
export declare class PasswordRecoveryController {
    readonly id: string;
    userName: string;
    answer: string;
    question: string | null;
    userNameFailureText: string;
    questionFailureText: string;
    successText: string;
    requireQuestionAndAnswer: boolean;
    private _currentStep;
    private _failureMessage;
    private readonly provider;
    readonly verifyingUser: EventDispatcher<PasswordRecoveryController, CancelEventArgs>;
    readonly verifyingAnswer: EventDispatcher<PasswordRecoveryController, CancelEventArgs>;
    readonly sendingMail: EventDispatcher<PasswordRecoveryController, PasswordRecoveryMailEventArgs>;
    readonly userLookupError: EventDispatcher<PasswordRecoveryController, string>;
    readonly answerLookupError: EventDispatcher<PasswordRecoveryController, string>;
    readonly stateChanged: EventDispatcher<PasswordRecoveryController, PasswordRecoveryState>;
    constructor(options?: PasswordRecoveryOptions);
    get currentStep(): PasswordRecoveryStep;
    get failureMessage(): string | null;
    get isComplete(): boolean;
    setUserName(value: string): void;
    setAnswer(value: string): void;
    submitUserName(): Promise<boolean>;
    submitAnswer(): Promise<boolean>;
    private completeRecovery;
    reset(): void;
    getState(): PasswordRecoveryState;
    private emitState;
}
