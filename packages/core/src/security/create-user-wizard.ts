import { CancelEventArgs, EventDispatcher } from "../events.js";
import { IMembershipProvider, IUser, SecurityManager } from "./membership-provider.js";

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

export class CreateUserWizardController {
  public readonly id: string;
  public userName: string;
  public password: string;
  public confirmPassword: string;
  public email: string;
  public question: string;
  public answer: string;
  public requireEmail: boolean;
  public disableCreatedUser: boolean;
  public continueDestinationPageUrl?: string | undefined;
  public duplicateUserNameErrorMessage: string;
  public duplicateEmailErrorMessage: string;
  public invalidPasswordErrorMessage: string;
  public confirmPasswordCompareErrorMessage: string;

  private _activeStep: CreateUserWizardStep = "CreateUser";
  private _failureMessage: string | null = null;
  private _validationErrors: string[] = [];
  private _createdUser: IUser | null = null;
  private readonly provider: IMembershipProvider;

  public readonly creatingUser = new EventDispatcher<CreateUserWizardController, CreateUserCancelEventArgs>();
  public readonly createdUser = new EventDispatcher<CreateUserWizardController, IUser>();
  public readonly createUserError = new EventDispatcher<CreateUserWizardController, string>();
  public readonly continueButtonClick = new EventDispatcher<CreateUserWizardController, void>();
  public readonly stateChanged = new EventDispatcher<CreateUserWizardController, CreateUserWizardState>();

  constructor(options: CreateUserWizardOptions = {}) {
    this.id = options.id ?? `CreateUserWizard_${Math.random().toString(36).substring(2, 9)}`;
    this.userName = options.userName ?? "";
    this.password = options.password ?? "";
    this.confirmPassword = options.confirmPassword ?? "";
    this.email = options.email ?? "";
    this.question = options.question ?? "";
    this.answer = options.answer ?? "";
    this.requireEmail = options.requireEmail ?? true;
    this.disableCreatedUser = options.disableCreatedUser ?? false;
    this.continueDestinationPageUrl = options.continueDestinationPageUrl;
    this.duplicateUserNameErrorMessage =
      options.duplicateUserNameErrorMessage ?? "Please enter a different user name.";
    this.duplicateEmailErrorMessage =
      options.duplicateEmailErrorMessage ??
      "A user name already exists to authorize this e-mail address. Please enter a different e-mail address.";
    this.invalidPasswordErrorMessage =
      options.invalidPasswordErrorMessage ?? "Password length minimum: 4 characters.";
    this.confirmPasswordCompareErrorMessage =
      options.confirmPasswordCompareErrorMessage ?? "The Confirm Password must match the Password entry.";
    this.provider = options.provider ?? SecurityManager.defaultProvider;
  }

  get activeStep(): CreateUserWizardStep {
    return this._activeStep;
  }

  get failureMessage(): string | null {
    return this._failureMessage;
  }

  get validationErrors(): string[] {
    return [...this._validationErrors];
  }

  get isComplete(): boolean {
    return this._activeStep === "Complete";
  }

  get user(): IUser | null {
    return this._createdUser;
  }

  setUserName(value: string): void {
    this.userName = value;
    this.emitState();
  }

  setPassword(value: string): void {
    this.password = value;
    this.emitState();
  }

  setConfirmPassword(value: string): void {
    this.confirmPassword = value;
    this.emitState();
  }

  setEmail(value: string): void {
    this.email = value;
    this.emitState();
  }

  setQuestion(value: string): void {
    this.question = value;
    this.emitState();
  }

  setAnswer(value: string): void {
    this.answer = value;
    this.emitState();
  }

  validate(): boolean {
    this._validationErrors = [];

    if (!this.userName || this.userName.trim().length === 0) {
      this._validationErrors.push("User Name is required.");
    }

    if (!this.password || this.password.length === 0) {
      this._validationErrors.push("Password is required.");
    } else if (this.password.length < 4) {
      this._validationErrors.push(this.invalidPasswordErrorMessage);
    }

    if (this.password !== this.confirmPassword) {
      this._validationErrors.push(this.confirmPasswordCompareErrorMessage);
    }

    if (this.requireEmail) {
      if (!this.email || this.email.trim().length === 0) {
        this._validationErrors.push("E-mail is required.");
      } else if (!this.email.includes("@")) {
        this._validationErrors.push("E-mail must be valid.");
      }
    }

    return this._validationErrors.length === 0;
  }

  async createUser(): Promise<boolean> {
    this._failureMessage = null;

    if (!this.validate()) {
      this.emitState();
      return false;
    }

    const cancelArgs: CreateUserCancelEventArgs = {
      userName: this.userName,
      password: this.password,
      email: this.email || undefined,
      cancel: false,
    };

    await this.creatingUser.emit(this, cancelArgs);
    if (cancelArgs.cancel) {
      return false;
    }

    const result = await this.provider.createUser(
      this.userName,
      this.password,
      this.email || undefined,
      this.question || undefined,
      this.answer || undefined,
      !this.disableCreatedUser
    );

    if (result.status === "Success" && result.user) {
      this._createdUser = result.user;
      this._activeStep = "Complete";
      this._failureMessage = null;
      this.password = "";
      this.confirmPassword = "";
      await this.createdUser.emit(this, result.user);
      this.emitState();
      return true;
    } else {
      let errMsg = result.errorMessage ?? "An error occurred creating the user.";
      if (result.status === "DuplicateUserName") errMsg = this.duplicateUserNameErrorMessage;
      if (result.status === "DuplicateEmail") errMsg = this.duplicateEmailErrorMessage;
      if (result.status === "InvalidPassword") errMsg = this.invalidPasswordErrorMessage;

      this._failureMessage = errMsg;
      await this.createUserError.emit(this, errMsg);
      this.emitState();
      return false;
    }
  }

  continue(): void {
    this.continueButtonClick.emit(this, undefined);
  }

  reset(): void {
    this._activeStep = "CreateUser";
    this._failureMessage = null;
    this._validationErrors = [];
    this._createdUser = null;
    this.userName = "";
    this.password = "";
    this.confirmPassword = "";
    this.email = "";
    this.question = "";
    this.answer = "";
    this.emitState();
  }

  getState(): CreateUserWizardState {
    return {
      activeStep: this._activeStep,
      userName: this.userName,
      email: this.email,
      question: this.question,
      answer: this.answer,
      validationErrors: [...this._validationErrors],
      failureMessage: this._failureMessage,
      isComplete: this.isComplete,
      user: this._createdUser,
      continueDestinationPageUrl: this.continueDestinationPageUrl,
    };
  }

  private emitState(): void {
    this.stateChanged.emit(this, this.getState());
  }
}
