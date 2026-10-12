export interface ClaimPayout {
  id: number;
  claimId: number;
  claimNumber: string;
  claimantName: string;
  approvedAmount: number;
  disbursedAmount: number;
  payoutMethod: string;
  transactionReference: string;
  idempotencyKey?: string;
  disbursedBy: string;
  disbursedAt: string;
  status: string;
  notes?: string;
}

export interface ClaimDisbursementRequest {
  amount: number;
  payoutMethod: string;
  transactionReference: string;
  idempotencyKey?: string;
  notes?: string;
}
