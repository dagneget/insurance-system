export type UserRole =
  | 'ROLE_CUSTOMER'
  | 'ROLE_UNDERWRITER'
  | 'ROLE_CLAIMS_OFFICER'
  | 'ROLE_FINANCE_OFFICER'
  | 'ROLE_AGENT'
  | 'ROLE_ADMIN';

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  customerId?: number;
  roles: UserRole[];
  activeRole: UserRole;
  authToken: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RoleSwitchRequest {
  role: UserRole;
}

export interface ActorProfile {
  id: UserRole;
  title: string;
  shortRole: string;
  description: string;
  badge: string;
  defaultUsername: string;
  defaultPassword: string;
  personaName: string;
  personaTitle: string;
  iconSvgPath: string;
  primaryDashboardUrl: string;
}
