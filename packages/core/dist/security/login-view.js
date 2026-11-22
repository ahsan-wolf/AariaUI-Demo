import { EventDispatcher } from "../events.js";
import { SecurityManager } from "./membership-provider.js";
export class LoginViewController {
    id;
    anonymousTemplate;
    loggedInTemplate;
    roleGroups;
    provider;
    unsubscribeSecurity;
    viewChanged = new EventDispatcher();
    constructor(options = {}) {
        this.id = options.id ?? `LoginView_${Math.random().toString(36).substring(2, 9)}`;
        this.anonymousTemplate = options.anonymousTemplate;
        this.loggedInTemplate = options.loggedInTemplate;
        this.roleGroups = options.roleGroups ? [...options.roleGroups] : [];
        this.provider = options.provider ?? SecurityManager.defaultProvider;
        this.unsubscribeSecurity = SecurityManager.currentUserChanged.subscribe(() => {
            this.notifyViewChanged();
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
    get isAuthenticated() {
        return this.currentUser !== null;
    }
    resolveActiveView() {
        const user = this.currentUser;
        if (!user) {
            return {
                type: "Anonymous",
                template: this.anonymousTemplate,
                user: null,
            };
        }
        const userRoles = user.roles ?? [];
        for (let i = 0; i < this.roleGroups.length; i++) {
            const rg = this.roleGroups[i];
            if (!rg)
                continue;
            for (const requiredRole of rg.roles) {
                if (userRoles.some((r) => r.toLowerCase() === requiredRole.toLowerCase())) {
                    return {
                        type: "RoleGroup",
                        template: rg.contentTemplate,
                        matchedRole: requiredRole,
                        matchedRoleGroupIndex: i,
                        user,
                    };
                }
            }
        }
        return {
            type: "LoggedIn",
            template: this.loggedInTemplate,
            user,
        };
    }
    notifyViewChanged() {
        const view = this.resolveActiveView();
        this.viewChanged.emit(this, view);
    }
}
//# sourceMappingURL=login-view.js.map