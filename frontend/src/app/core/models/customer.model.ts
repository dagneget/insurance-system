import { Policy } from './policy.model';
import { Vehicle } from './vehicle.model';
import { Payment } from './payment.model';
import { Claim } from './claim.model';

export interface Customer {
  id: number;
  fullName: string;
  phone: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  vehicleCount: number;
  agentId?: number;
  agentName?: string;
  kycStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED' | string;
  loginUsername?: string;
  temporaryPassword?: string;
}

export interface CustomerCreateRequest {
  fullName: string;
  phone: string;
  email?: string;
  agentId?: number;
  kycStatus?: string;
}

export interface ClientOnboardingRequest {
  fullName: string;
  phone: string;
  email?: string;
  kycStatus?: string;
  registrationNumber?: string;
  make?: string;
  model?: string;
  manufactureYear?: number;
  usageType?: string;
  estimatedValue?: number;
}

export interface ClientOnboardingResponse {
  customer: Customer;
  vehicle?: Vehicle;
  message: string;
  loginUsername?: string;
  temporaryPassword?: string;
}

export interface CustomerDirectoryItem {
  id: number;
  fullName: string;
  phone: string;
  email?: string;
  vehicleCount: number;
  activePoliciesCount: number;
  totalPoliciesCount: number;
  totalPremium: number;
  totalPaid: number;
  outstandingBalance: number;
  openClaimsCount: number;
  createdAt: string;
}

export interface CustomerMetrics {
  totalPolicies: number;
  activePolicies: number;
  totalVehicles: number;
  totalPremium: number;
  totalPaid: number;
  outstandingBalance: number;
  openClaimsCount: number;
}

export interface CustomerDashboard {
  customer: Customer;
  metrics: CustomerMetrics;
  policies: Policy[];
  vehicles: Vehicle[];
  payments: Payment[];
  claims: Claim[];
}
