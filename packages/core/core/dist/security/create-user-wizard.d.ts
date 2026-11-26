import { CancelEventArgs, EventDispatcher } from "../events.js";
import { IMembershipProvider, IUser } from "./membership-provider.js";
export type CreateUserWizardStep = "CreateUser" | "Complete";
export interface CreateUserCancelEventArgs extends CancelEventArgs {
    userName: string;
    password: string;
    email?: string | undefined;
}
export interface CreateUserWizardOptions {
    id?: string | undefined;
    userName?: string | undefined;
    password?: string | undefined;
    confirmPassword?: string | undefined;
    email?: string | undefined;
    question?: string | undefined;
    answer?: string | undefined;
    requireEmail?: boolean | undefined;
    disableCreatedUser?: boolean | undefined;
    continueDestinationPageUrl?: string | undefined;
    duplicateUserNameErrorMessage?: string | undefined;
    duplicateEmailErrorMessage?: string | undefined;
    invalidPasswordErrorMessage?: string | undefined;
    confirmPasswordCompareErrorMessage?: string | undefined;
    provider?: IMembershipProvider | undefined;
}
export interface CreateUserWizardState {
    activeStep: CreateUserWizardStep;
    userName: string;
    email: string;
    question: string;
    answer: string;
    validationErrors: string[];
    failureMessage: string | null;
    isComplete: boolean;
    user: IUser | null;
    continueDestinationPageUrl?: string | undefined;
}
export declare class CreateUserWizardController {
    readonly id: string;
    userName: string;
    password: string;
    confirmPassword: string;
    email: string;
    question: string;
    answer: string;
    requireEmail: boolean;
    disableCreatedUser: boolean;
    continueDestinationPageUrl?: string | undefined;
    duplicateUserNameErrorMessage: string;
    duplicateEmailErrorMessage: string;
    invalidPasswordErrorMessage: string;
    confirmPasswordCompareErrorMessage: string;
    private _activeStep;
    private _failureMessage;
    private _validationErrors;
    private _createdUser;
    private readonly provider;
    readonly creatingUser: EventDispatcher<CreateUserWizardController, CreateUserCancelEventArgs>;
    readonly createdUser: EventDispatcher<CreateUserWizardController, IUser>;
    readonly createUserError: EventDispatcher<CreateUserWizardController, string>;
    readonly continueButtonClick: EventDispatcher<CreateUserWizardController, void>;
    readonly stateChanged: EventDispatcher<CreateUserWizardController, CreateUserWizardState>;
    constructor(options?: CreateUserWizardOptions);
    get activeStep(): CreateUserWizardStep;
    get failureMessage(): string | null;
    get validationErrors(): string[];
    get isComplete(): boolean;
    get user(): IUser | null;
    setUserName(value: string): void;
    setPassword(value: string): void;
    setConfirmPassword(value: string): void;
    setEmail(value: string): void;
    setQuestion(value: string): void;
    setAnswer(value: string): void;
    validate(): boolean;
    createUser(): Promise<boolean>;
    continue(): void;
    reset(): void;
    getState(): CreateUserWizardState;
    private emitState;
}
