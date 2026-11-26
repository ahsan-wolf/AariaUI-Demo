/** Membership.MinRequiredPasswordLength / MinRequiredNonAlphanumericCharacters / PasswordStrengthRegularExpression. */
export interface PasswordPolicyOptions {
    minRequiredLength?: number | undefined;
    minRequiredNonAlphanumericCharacters?: number | undefined;
    requireDigit?: boolean | undefined;
    requireUppercase?: boolean | undefined;
    requireLowercase?: boolean | undefined;
    strengthRegularExpression?: string | undefined;
}
export declare class PasswordPolicy {
    readonly minRequiredLength: number;
    readonly minRequiredNonAlphanumericCharacters: number;
    readonly requireDigit: boolean;
    readonly requireUppercase: boolean;
    readonly requireLowercase: boolean;
    readonly strengthRegularExpression: string;
    constructor(o?: PasswordPolicyOptions);
    /** Returns the violated rules (empty = valid). */
    validate(password: string): string[];
    isValid(password: string): boolean;
}
