import { CancelEventArgs, EventDispatcher } from "../events.js";
import { IMembershipProvider, SecurityManager } from "./membership-provider.js";

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

export class PasswordRecoveryController {
  public readonly id: string;
  public userName: string;
  public answer: string;
  public question: string | null = null;
  public userNameFailureText: string;
  public questionFailureText: string;
  public successText: string;
  public requireQuestionAndAnswer: boolean;

  private _currentStep: PasswordRecoveryStep = "UserName";
  private _failureMessage: string | null = null;
  private readonly provider: IMembershipProvider;

  public readonly verifyingUser = new EventDispatcher<PasswordRecoveryController, CancelEventArgs>();
  public readonly verifyingAnswer = new EventDispatcher<PasswordRecoveryController, CancelEventArgs>();
  public readonly sendingMail = new EventDispatcher<PasswordRecoveryController, PasswordRecoveryMailEventArgs>();
  public readonly userLookupError = new EventDispatcher<PasswordRecoveryController, string>();
  public readonly answerLookupError = new EventDispatcher<PasswordRecoveryController, string>();
  public readonly stateChanged = new EventDispatcher<PasswordRecoveryController, PasswordRecoveryState>();

  constructor(options: PasswordRecoveryOptions = {}) {
    this.id = options.id ?? `PasswordRecovery_${Math.random().toString(36).substring(2, 9)}`;
    this.userName = options.userName ?? "";
    this.answer = "";
    this.userNameFailureText =
      options.userNameFailureText ?? "We were unable to access your information. Please try again.";
    this.questionFailureText =
      options.questionFailureText ?? "Your answer could not be verified. Please try again.";
    this.successText = options.successText ?? "Your password has been sent to you.";
    this.requireQuestionAndAnswer = options.requireQuestionAndAnswer ?? true;
    this.provider = options.provider ?? SecurityManager.defaultProvider;
  }

  get currentStep(): PasswordRecoveryStep {
    return this._currentStep;
  }

  get failureMessage(): string | null {
    return this._failureMessage;
  }

  get isComplete(): boolean {
    return this._currentStep === "Success";
  }

  setUserName(value: string): void {
    this.userName = value;
    this.emitState();
  }

  setAnswer(value: string): void {
    this.answer = value;
    this.emitState();
  }

  async submitUserName(): Promise<boolean> {
    this._failureMessage = null;

    if (!this.userName || this.userName.trim().length === 0) {
      this._failureMessage = "User Name is required.";
      this.emitState();
      return false;
    }

    const cancelArgs: CancelEventArgs = { cancel: false };
    await this.verifyingUser.emit(this, cancelArgs);
    if (cancelArgs.cancel) {
      return false;
    }

    const user = await this.provider.getUser(this.userName);
    if (!user || user.isLockedOut) {
      this._failureMessage = this.userNameFailureText;
      await this.userLookupError.emit(this, this.userNameFailureText);
      this.emitState();
      return false;
    }

    if (this.requireQuestionAndAnswer) {
      const q = await this.provider.getPasswordQuestion(this.userName);
      this.question = q;
      this._currentStep = "Question";
      this._failureMessage = null;
      this.emitState();
      return true;
    } else {
      return this.completeRecovery();
    }
  }

  async submitAnswer(): Promise<boolean> {
    this._failureMessage = null;

    if (!this.answer || this.answer.trim().length === 0) {
      this._failureMessage = "Answer is required.";
      this.emitState();
      return false;
    }

    const cancelArgs: CancelEventArgs = { cancel: false };
    await this.verifyingAnswer.emit(this, cancelArgs);
    if (cancelArgs.cancel) {
      return false;
    }

    return this.completeRecovery(this.answer);
  }

  private async completeRecovery(answer?: string | undefined): Promise<boolean> {
    const tempPassword = await this.provider.resetPassword(this.userName, answer);
    if (!tempPassword) {
      this._failureMessage = this.questionFailureText;
      await this.answerLookupError.emit(this, this.questionFailureText);
      this.emitState();
      return false;
    }

    const user = await this.provider.getUser(this.userName);
    const mailArgs: PasswordRecoveryMailEventArgs = {
      userName: this.userName,
      recipientEmail: user?.email,
      newPassword: tempPassword,
      cancel: false,
    };

    await this.sendingMail.emit(this, mailArgs);
    if (mailArgs.cancel) {
      return false;
    }

    this._currentStep = "Success";
    this._failureMessage = null;
    this.emitState();
    return true;
  }

  reset(): void {
    this._currentStep = "UserName";
    this._failureMessage = null;
    this.answer = "";
    this.question = null;
    this.emitState();
  }

  getState(): PasswordRecoveryState {
    return {
      currentStep: this._currentStep,
      userName: this.userName,
      question: this.question,
      answer: this.answer,
      failureMessage: this._failureMessage,
      successText: this.successText,
      isComplete: this._currentStep === "Success",
    };
  }

  private emitState(): void {
    this.stateChanged.emit(this, this.getState());
  }
}
