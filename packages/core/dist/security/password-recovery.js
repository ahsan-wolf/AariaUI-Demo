import { EventDispatcher } from "../events.js";
import { SecurityManager } from "./membership-provider.js";
export class PasswordRecoveryController {
    id;
    userName;
    answer;
    question = null;
    userNameFailureText;
    questionFailureText;
    successText;
    requireQuestionAndAnswer;
    _currentStep = "UserName";
    _failureMessage = null;
    provider;
    verifyingUser = new EventDispatcher();
    verifyingAnswer = new EventDispatcher();
    sendingMail = new EventDispatcher();
    userLookupError = new EventDispatcher();
    answerLookupError = new EventDispatcher();
    stateChanged = new EventDispatcher();
    constructor(options = {}) {
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
    get currentStep() {
        return this._currentStep;
    }
    get failureMessage() {
        return this._failureMessage;
    }
    get isComplete() {
        return this._currentStep === "Success";
    }
    setUserName(value) {
        this.userName = value;
        this.emitState();
    }
    setAnswer(value) {
        this.answer = value;
        this.emitState();
    }
    async submitUserName() {
        this._failureMessage = null;
        if (!this.userName || this.userName.trim().length === 0) {
            this._failureMessage = "User Name is required.";
            this.emitState();
            return false;
        }
        const cancelArgs = { cancel: false };
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
        }
        else {
            return this.completeRecovery();
        }
    }
    async submitAnswer() {
        this._failureMessage = null;
        if (!this.answer || this.answer.trim().length === 0) {
            this._failureMessage = "Answer is required.";
            this.emitState();
            return false;
        }
        const cancelArgs = { cancel: false };
        await this.verifyingAnswer.emit(this, cancelArgs);
        if (cancelArgs.cancel) {
            return false;
        }
        return this.completeRecovery(this.answer);
    }
    async completeRecovery(answer) {
        const tempPassword = await this.provider.resetPassword(this.userName, answer);
        if (!tempPassword) {
            this._failureMessage = this.questionFailureText;
            await this.answerLookupError.emit(this, this.questionFailureText);
            this.emitState();
            return false;
        }
        const user = await this.provider.getUser(this.userName);
        const mailArgs = {
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
    reset() {
        this._currentStep = "UserName";
        this._failureMessage = null;
        this.answer = "";
        this.question = null;
        this.emitState();
    }
    getState() {
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
    emitState() {
        this.stateChanged.emit(this, this.getState());
    }
}
//# sourceMappingURL=password-recovery.js.map