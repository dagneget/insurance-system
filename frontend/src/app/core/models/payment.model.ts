import { PaymentAllocation } from './billing.model';

export type PaymentStatus = 'SUCCESS' | 'FAILED' | 'VOIDED';

export interface Payment {
  id: number;
  policyId: number;
  policyNumber: string;
  customerName?: string;
  vehicleRegistrationNumber?: string;
  amount: number;
  transactionReference: string;
  paymentMethod: string;
  status: PaymentStatus;
  note?: string;
  voidReason?: string;
  voidedAt?: string;
  makerUsername?: string;
  checkerUsername?: string;
  voidStatus?: 'NONE' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  paymentDate: string;
  allocations?: PaymentAllocation[];
}

export interface PaymentCreateRequest {
  amount: number;
  transactionReference: string;
  paymentMethod?: string;
  note?: string;
  billingScheduleId?: number;
}

export interface PaymentVoidRequest {
  voidReason: string;
  checkerUsername?: string;
}
