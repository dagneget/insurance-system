export type ClaimStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SETTLED';

export interface Claim {
  id: number;
  claimNumber: string;
  policyId: number;
  policyNumber: string;
  customerName: string;
  vehicleRegistrationNumber: string;
  incidentDate: string;
  description: string;
  requestedAmount: number;
  status: ClaimStatus;
  decisionNote?: string;
  approvedAmount?: number;
  decisionDate?: string;
  settlementAmount?: number;
  settlementReference?: string;
  settlementNote?: string;
  settlementDate?: string;
  createdAt: string;
}

export interface ClaimCreateRequest {
  policyId: number;
  incidentDate: string;
  description: string;
  requestedAmount: number;
}

export interface ClaimStatusUpdateRequest {
  status: ClaimStatus;
  decisionNote?: string;
  approvedAmount?: number;
}

export interface ClaimSettlementRequest {
  amount: number;
  reference: string;
  note?: string;
}
