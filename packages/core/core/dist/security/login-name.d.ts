import { EventDispatcher } from "../events.js";
import { IMembershipProvider, IUser } from "./membership-provider.js";
export interface LoginNameOptions {
    id?: string | undefined;
    formatString?: string | undefined;
    provider?: IMembershipProvider | undefined;
}
export interface LoginNameState {
    userName: string;
    formattedText: string;
    isLoggedIn: boolean;
    currentUser: IUser | null;
}
export declare class LoginNameController {
    readonly id: string;
    formatString: string;
    private readonly provider;
    private unsubscribeSecurity?;
    readonly stateChanged: EventDispatcher<LoginNameController, LoginNameState>;
    constructor(options?: LoginNameOptions);
    dispose(): void;
    get currentUser(): IUser | null;
    get isLoggedIn(): boolean;
    get userName(): string;
    get formattedText(): string;
    getState(): LoginNameState;
    private emitState;
}
