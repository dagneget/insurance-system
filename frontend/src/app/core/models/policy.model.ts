export type PolicyStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED' | 'EXPIRED';

export interface Policy {
  id: number;
  policyNumber: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  vehicleId: number;
  vehicleRegistrationNumber: string;
  vehicleDescription: string;
  coverageDescription: string;
  startDate: string;
  endDate: string;
  premium: number;
  totalPaid: number;
  outstandingBalance: number;
  status: PolicyStatus;
  createdAt: string;
}

export interface PolicyCreateRequest {
  customerId: number;
  vehicleId: number;
  coverageDescription: string;
  startDate: string;
  endDate: string;
  premium: number;
  status?: PolicyStatus;
}
