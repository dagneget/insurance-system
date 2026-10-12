export type ClaimStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SETTLED';

export interface ClaimInvestigation {
  id: number;
  claimId: number;
  assignedAdjusterId?: number;
  assignedAdjusterName?: string;
  claimType: 'OWN_DAMAGE' | 'THIRD_PARTY' | 'TOTAL_LOSS';
  surveyorName?: string;
  surveyorNotes?: string;
  repairEstimate: number;
  depreciationAmount: number;
  excessApplied: number;
  salvageValue: number;
  sumInsured?: number;
  marketValue?: number;
  totalLoss: boolean;
  fraudFlags?: string;
  recommendedPayout?: number;
  investigationStatus: string;
}

export interface ClaimInvestigationRequest {
  assignedAdjusterId?: number;
  claimType?: string;
  surveyorName?: string;
  surveyorNotes?: string;
  repairEstimate?: number;
  depreciationAmount?: number;
  excessApplied?: number;
  salvageValue?: number;
  sumInsured?: number;
  marketValue?: number;
  investigationStatus?: string;
}

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
  investigation?: ClaimInvestigation;
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
