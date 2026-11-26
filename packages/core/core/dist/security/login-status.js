import { EventDispatcher } from "../events.js";
import { SecurityManager } from "./membership-provider.js";
export class LoginStatusController {
    id;
    loginText;
    logoutText;
    loginPageUrl;
    logoutPageUrl;
    logoutAction;
    provider;
    unsubscribeSecurity;
    loggingOut = new EventDispatcher();
    loggedOut = new EventDispatcher();
    stateChanged = new EventDispatcher();
    constructor(options = {}) {
        this.id = options.id ?? `LoginStatus_${Math.random().toString(36).substring(2, 9)}`;
        this.loginText = options.loginText ?? "Login";
        this.logoutText = options.logoutText ?? "Logout";
        this.loginPageUrl = options.loginPageUrl;
        this.logoutPageUrl = options.logoutPageUrl;
        this.logoutAction = options.logoutAction ?? "Refresh";
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
    get text() {
        return this.isLoggedIn ? this.logoutText : this.loginText;
    }
    get targetUrl() {
        return this.isLoggedIn ? this.logoutPageUrl : this.loginPageUrl;
    }
    async logout() {
        if (!this.isLoggedIn)
            return false;
        const cancelArgs = { cancel: false };
        await this.loggingOut.emit(this, cancelArgs);
        if (cancelArgs.cancel) {
            return false;
        }
        await this.provider.logout();
        await this.loggedOut.emit(this, undefined);
        this.emitState();
        return true;
    }
    async executeAction() {
        if (this.isLoggedIn) {
            return this.logout();
        }
        return true;
    }
    getState() {
        return {
            isLoggedIn: this.isLoggedIn,
            text: this.text,
            targetUrl: this.targetUrl,
            logoutAction: this.logoutAction,
            currentUser: this.currentUser,
        };
    }
    emitState() {
        this.stateChanged.emit(this, this.getState());
    }
}
//# sourceMappingURL=login-status.js.map