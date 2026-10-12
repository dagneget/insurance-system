export interface UnderwriterAuthority {
  id?: number;
  userId?: number;
  maxSumInsured: number;
  maxLoadingPercentage: number;
  maxDiscountPercentage: number;
  canApproveReferrals: boolean;
}

export interface UserManagement {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  active: boolean;
  roles: string[];
  customerId?: number;
  customerName?: string;
  authority?: UnderwriterAuthority;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  email?: string;
  roles: string[];
  customerId?: number;
}
