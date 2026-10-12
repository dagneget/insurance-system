export interface CommissionLineItem {
  policyId: number;
  policyNumber: string;
  customerName: string;
  vehicleRegistration: string;
  productCode: string;
  premium: number;
  commissionRatePercentage: number;
  commissionAmount: number;
  policyStatus: string;
  policyStartDate: string;
  payoutStatus: 'EARNED' | 'PIPELINE_PENDING' | 'VOIDED' | string;
}

export interface CommissionStatement {
  agentId: number;
  agentName: string;
  totalGrossPremium: number;
  totalCommissionEarned: number;
  totalPoliciesCount: number;
  lineItems: CommissionLineItem[];
}
