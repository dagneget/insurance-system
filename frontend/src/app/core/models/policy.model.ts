import { BillingSchedule } from './billing.model';
export type { BillingSchedule };

export type PolicyStatus = 'DRAFT' | 'QUOTED' | 'ISSUED' | 'CANCELLED' | 'EXPIRED' | 'RENEWED';

export interface Policy {
  id: number;
  policyNumber: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  vehicleId: number;
  vehicleRegistrationNumber: string;
  vehicleDescription: string;
  productCode: string;
  deductibleAmount: number;
  coverageDescription: string;
  startDate: string;
  endDate: string;
  premium: number;
  totalPaid: number;
  outstandingBalance: number;
  status: PolicyStatus;
  cancellationReason?: string;
  cancelledAt?: string;
  renewedFromId?: number;
  renewedFromPolicyNumber?: string;
  endorsementsCount?: number;
  referralFlag?: boolean;
  referralReason?: string;
  underwritingSubjectivities?: string;
  vehicleMarketValue?: number;
  agentId?: number;
  agentName?: string;
  billingSchedules?: BillingSchedule[];
  createdAt: string;
}

export interface PolicyCreateRequest {
  customerId: number;
  vehicleId: number;
  coverageDescription: string;
  productCode?: string;
  deductibleAmount?: number;
  startDate: string;
  endDate: string;
  premium: number;
  status?: PolicyStatus;
  vehicleMarketValue?: number;
  underwritingSubjectivities?: string;
  agentId?: number;
  installmentsCount?: number;
  referralFlag?: boolean;
  referralReason?: string;
}

export interface QuoteCalculationRequest {
  vehicleId: number;
  productCode: string;
  estimatedValue?: number;
}

export interface QuoteCalculationDto {
  productCode: string;
  productName: string;
  coverageDescription: string;
  basePremium: number;
  riskAdjustment: number;
  taxesAndFees: number;
  totalPremium: number;
  deductibleAmount: number;
  brokerCommission?: number;
  referralRequired?: boolean;
}

export interface PolicyRenewalRequest {
  startDate: string;
  endDate: string;
  premium: number;
  coverageDescription?: string;
  deductibleAmount?: number;
}

export interface PolicyCancelRequest {
  cancellationReason: string;
}

export interface Endorsement {
  id: number;
  endorsementNumber: string;
  policyId: number;
  endorsementType: string;
  reason: string;
  changesSummary: string;
  effectiveDate: string;
  createdAt: string;
}

export interface EndorsementCreateRequest {
  endorsementType: string;
  reason: string;
  changesSummary: string;
  effectiveDate: string;
}
