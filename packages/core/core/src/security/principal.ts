// System.Security.Principal equivalents. Headless: no DOM, no OS access. FREE (MIT).
// A Windows / Kerberos / SSO identity is established by a SERVER; the Enterprise package
// (@wf-controls/enterprise-security) can wrap what the server reports (WindowsLikeIdentity, OidcPrincipalFactory).

export interface IIdentity {
  readonly name: string;
  readonly isAuthenticated: boolean;
  readonly authenticationType: string;
}

/** A statement about the user (ASP.NET `Claim`): e.g. { type: "department", value: "Finance" }. */
export interface Claim {
  readonly type: string;
  readonly value: string;
}

export interface IPrincipal {
  readonly identity: IIdentity;
  isInRole(role: string): boolean;
  readonly roles: readonly string[];
  /** Claims about the user besides roles. Optional: principals without claims simply have none. */
  readonly claims?: readonly Claim[] | undefined;
}

/** True when the principal has a claim of `type` (and, when given, exactly `value`). Roles count as `role` claims. */
export function principalHasClaim(principal: IPrincipal, type: string, value?: string): boolean {
  const t = type.toLowerCase();
  if (t === "role") return value === undefined ? principal.roles.length > 0 : principal.isInRole(value);
  return (principal.claims ?? []).some((c) => c.type.toLowerCase() === t && (value === undefined || c.value === value));
}

export class GenericIdentity implements IIdentity {
  constructor(
    public readonly name: string,
    public readonly authenticationType: string = ""
  ) {}
  get isAuthenticated(): boolean {
    return this.name.length > 0;
  }
}

export class AnonymousIdentity implements IIdentity {
  readonly name = "";
  readonly isAuthenticated = false;
  readonly authenticationType = "";
}

export class GenericPrincipal implements IPrincipal {
  public readonly roles: readonly string[];
  public readonly claims: readonly Claim[];
  private readonly roleSet: Set<string>;
  constructor(public readonly identity: IIdentity, roles: readonly string[] = [], claims: readonly Claim[] = []) {
    this.roles = [...roles];
    this.claims = claims.map((c) => ({ type: c.type, value: c.value }));
    this.roleSet = new Set(roles.map((r) => r.toLowerCase()));
  }
  isInRole(role: string): boolean {
    return this.roleSet.has(role.toLowerCase());
  }
}

export const AnonymousPrincipal: IPrincipal = Object.freeze(new GenericPrincipal(new AnonymousIdentity(), []));
