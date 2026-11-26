import { EventDispatcher } from "../events.js";
import { SecurityManager } from "./membership-provider.js";
export class LoginNameController {
    id;
    formatString;
    provider;
    unsubscribeSecurity;
    stateChanged = new EventDispatcher();
    constructor(options = {}) {
        this.id = options.id ?? `LoginName_${Math.random().toString(36).substring(2, 9)}`;
        this.formatString = options.formatString ?? "Welcome, {0}";
        this.provider = options.provider ?? SecurityManager.defaultProvider;
        this.unsubscribeSecurity = SecurityManager.currentUserChanged.subscribe(() => {
            this.emitState();
        });
    }
    dispose() {
        if (this.unsubscribeSecurity) {
            this.unsubscribeSecurity();
            this.unsubscribeSecurity = undefined;
        }
    }
    get currentUser() {
        return this.provider.getCurrentUser();
    }
    get isLoggedIn() {
        return this.currentUser !== null;
    }
    get userName() {
        return this.currentUser?.userName ?? "";
    }
    get formattedText() {
        if (!this.isLoggedIn)
            return "";
        return this.formatString.replace(/\{0\}/g, this.userName);
    }
    getState() {
        return {
            userName: this.userName,
            formattedText: this.formattedText,
            isLoggedIn: this.isLoggedIn,
            currentUser: this.currentUser,
        };
    }
    emitState() {
        this.stateChanged.emit(this, this.getState());
    }
}
//# sourceMappingURL=login-name.js.map