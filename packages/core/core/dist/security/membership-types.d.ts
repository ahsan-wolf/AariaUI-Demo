/** A membership user as the UI sees it (ASP.NET `MembershipUser`). Secrets are never part of it. */
export interface IUser {
    userName: string;
    email?: string | undefined;
    roles?: string[] | undefined;
    isLockedOut?: boolean | undefined;
    isApproved?: boolean | undefined;
    lastLoginDate?: Date | undefined;
    passwordQuestion?: string | undefined;
    customData?: Record<string, unknown> | undefined;
    /** Stable key of the user in the store (`ProviderUserKey`). */
    providerUserKey?: string | undefined;
    comment?: string | undefined;
    creationDate?: Date | undefined;
    lastActivityDate?: Date | undefined;
    lastPasswordChangedDate?: Date | undefined;
    lastLockoutDate?: Date | undefined;
    /** True when the last activity is inside the "user is online" window. */
    isOnline?: boolean | undefined;
}
export type MembershipCreateStatus = "Success" | "InvalidUserName" | "InvalidPassword" | "InvalidQuestion" | "InvalidAnswer" | "InvalidEmail" | "DuplicateUserName" | "DuplicateEmail" | "UserRejected" | "ProviderError";
export interface MembershipCreateResult {
    status: MembershipCreateStatus;
    user?: IUser | undefined;
    errorMessage?: string | undefined;
}
/** What every provider offers; the Login family controls only use this. */
export interface IMembershipProvider {
    readonly name: string;
    validateUser(userName: string, password: string): Promise<boolean>;
    getUser(userName: string): Promise<IUser | null>;
    getCurrentUser(): IUser | null;
    createUser(userName: string, password: string, email?: string | undefined, passwordQuestion?: string | undefined, passwordAnswer?: string | undefined, isApproved?: boolean | undefined): Promise<MembershipCreateResult>;
    changePassword(userName: string, oldPassword: string, newPassword: string): Promise<boolean>;
    resetPassword(userName: string, answer?: string | undefined): Promise<string | null>;
    getPasswordQuestion(userName: string): Promise<string | null>;
    unlockUser(userName: string): Promise<boolean>;
    login(userName: string, password: string, rememberMe?: boolean | undefined): Promise<boolean>;
    logout(): Promise<void>;
    isInRole(role: string, userName?: string | undefined): boolean;
    getRolesForUser(userName?: string | undefined): string[];
}
export interface MembershipPage<T> {
    items: T[];
    /** Total matches (not just this page). */
    total: number;
}
/** Fields an administrator may change on an existing user. */
export interface UserUpdate {
    userName: string;
    email?: string | undefined;
    comment?: string | undefined;
    isApproved?: boolean | undefined;
}
export interface PasswordResetToken {
    /** The secret to send to the user (e-mail link). Only its hash is stored; it cannot be shown again. */
    token: string;
    /** Epoch ms when it stops working. */
    expiresAt: number;
}
export type PasswordResetStatus = "Success" | "InvalidToken" | "InvalidPassword";
/** The rest of the ASP.NET Membership API (administration, reset tokens, async role lookups). Optional for custom providers. */
export interface IMembershipAdmin {
    getUserNameByEmail(email: string): Promise<string | null>;
    getAllUsers(pageIndex: number, pageSize: number): Promise<MembershipPage<IUser>>;
    /** SQL LIKE pattern (`%`, `_`), case-insensitive. */
    findUsersByName(pattern: string, pageIndex: number, pageSize: number): Promise<MembershipPage<IUser>>;
    findUsersByEmail(pattern: string, pageIndex: number, pageSize: number): Promise<MembershipPage<IUser>>;
    getNumberOfUsersOnline(): Promise<number>;
    updateUser(update: UserUpdate): Promise<boolean>;
    deleteUser(userName: string): Promise<boolean>;
    changePasswordQuestionAndAnswer(userName: string, password: string, newQuestion: string, newAnswer: string): Promise<boolean>;
    /** Starts a reset: returns the token to deliver, or null when the user cannot reset (callers must answer the same either way). */
    createPasswordResetToken(userName: string): Promise<PasswordResetToken | null>;
    /** Completes a reset. Unknown user, wrong or expired token all give "InvalidToken". */
    resetPasswordWithToken(userName: string, token: string, newPassword: string): Promise<PasswordResetStatus>;
    getRolesForUserAsync(userName: string): Promise<string[]>;
    isInRoleAsync(userName: string, role: string): Promise<boolean>;
}
