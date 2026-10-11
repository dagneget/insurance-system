export type PaymentStatus = 'SUCCESS' | 'FAILED';

export interface Payment {
  id: number;
  policyId: number;
  policyNumber: string;
  amount: number;
  transactionReference: string;
  paymentMethod: string;
  status: PaymentStatus;
  note?: string;
  paymentDate: string;
}

export interface PaymentCreateRequest {
  amount: number;
  transactionReference: string;
  paymentMethod?: string;
  note?: string;
}
