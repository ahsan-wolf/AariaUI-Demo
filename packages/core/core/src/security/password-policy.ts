/** Membership.MinRequiredPasswordLength / MinRequiredNonAlphanumericCharacters / PasswordStrengthRegularExpression. */
export interface PasswordPolicyOptions {
  minRequiredLength?: number | undefined;
  minRequiredNonAlphanumericCharacters?: number | undefined;
  requireDigit?: boolean | undefined;
  requireUppercase?: boolean | undefined;
  requireLowercase?: boolean | undefined;
  strengthRegularExpression?: string | undefined;
}

export class PasswordPolicy {
  readonly minRequiredLength: number;
  readonly minRequiredNonAlphanumericCharacters: number;
  readonly requireDigit: boolean;
  readonly requireUppercase: boolean;
  readonly requireLowercase: boolean;
  readonly strengthRegularExpression: string;

  constructor(o: PasswordPolicyOptions = {}) {
    this.minRequiredLength = o.minRequiredLength ?? 7;
    this.minRequiredNonAlphanumericCharacters = o.minRequiredNonAlphanumericCharacters ?? 1;
    this.requireDigit = o.requireDigit ?? false;
    this.requireUppercase = o.requireUppercase ?? false;
    this.requireLowercase = o.requireLowercase ?? false;
    this.strengthRegularExpression = o.strengthRegularExpression ?? "";
  }

  /** Returns the violated rules (empty = valid). */
  validate(password: string): string[] {
    const errors: string[] = [];
    if (password.length < this.minRequiredLength) errors.push(`Password must be at least ${this.minRequiredLength} characters.`);
    const nonAlpha = (password.match(/[^a-zA-Z0-9]/g) ?? []).length;
    if (nonAlpha < this.minRequiredNonAlphanumericCharacters) errors.push(`Password needs at least ${this.minRequiredNonAlphanumericCharacters} non-alphanumeric character(s).`);
    if (this.requireDigit && !/[0-9]/.test(password)) errors.push("Password needs a digit.");
    if (this.requireUppercase && !/[A-Z]/.test(password)) errors.push("Password needs an uppercase letter.");
    if (this.requireLowercase && !/[a-z]/.test(password)) errors.push("Password needs a lowercase letter.");
    if (this.strengthRegularExpression && !new RegExp(this.strengthRegularExpression).test(password)) errors.push("Password does not meet the strength requirements.");
    return errors;
  }

  isValid(password: string): boolean { return this.validate(password).length === 0; }
}
