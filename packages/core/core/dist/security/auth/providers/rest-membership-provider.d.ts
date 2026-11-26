import { IMembershipProvider, IUser, MembershipCreateResult } from "../../membership-provider.js";
export type FetchLike = (url: string, init: {
    method: string;
    headers: Record<string, string>;
    body: string;
}) => Promise<{
    ok: boolean;
    status: number;
    json(): Promise<unknown>;
}>;
export interface RestMembershipProviderOptions {
    /** e.g. "/api/auth". Operations POST to `${baseUrl}/<operation>` as JSON. */
    baseUrl: string;
    /** Inject fetch (core has no DOM): `fetch.bind(globalThis)` in a browser. */
    fetchFn: FetchLike;
    name?: string | undefined;
    headers?: (() => Record<string, string>) | undefined;
}
/**
 * Membership provider that delegates to a server. Contract (all POST, JSON):
 *   login           {userName,password,rememberMe}      -> {success:boolean, user?:IUser}
 *   logout          {}                                  -> {}
 *   validateUser    {userName,password}                 -> {success}
 *   getUser         {userName}                          -> {user: IUser|null}
 *   createUser      {userName,password,email,...}       -> MembershipCreateResult
 *   changePassword  {userName,oldPassword,newPassword}  -> {success}
 *   resetPassword   {userName,answer}                   -> {password: string|null}
 *   getPasswordQuestion {userName}                      -> {question: string|null}
 *   unlockUser      {userName}                          -> {success}
 * Sessions/cookies are the server's responsibility; this class only caches the signed-in IUser for the UI.
 */
export declare class RestMembershipProvider implements IMembershipProvider {
    private readonly options;
    readonly name: string;
    private current;
    constructor(options: RestMembershipProviderOptions);
    private call;
    validateUser(userName: string, password: string): Promise<boolean>;
    getUser(userName: string): Promise<IUser | null>;
    getCurrentUser(): IUser | null;
    createUser(userName: string, password: string, email?: string, passwordQuestion?: string, passwordAnswer?: string, isApproved?: boolean): Promise<MembershipCreateResult>;
    changePassword(userName: string, oldPassword: string, newPassword: string): Promise<boolean>;
    resetPassword(userName: string, answer?: string): Promise<string | null>;
    getPasswordQuestion(userName: string): Promise<string | null>;
    unlockUser(userName: string): Promise<boolean>;
    login(userName: string, password: string, rememberMe?: boolean): Promise<boolean>;
    logout(): Promise<void>;
    isInRole(role: string, userName?: string): boolean;
    getRolesForUser(userName?: string): string[];
}
