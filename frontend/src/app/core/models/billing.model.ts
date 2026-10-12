export interface PaymentAllocation {
  id: number;
  paymentId: number;
  billingScheduleId: number;
  allocatedAmount: number;
  allocatedAt: string;
  installmentNumber?: number;
  dueDate?: string;
}

export interface BillingSchedule {
  id: number;
  policyId: number;
  policyNumber: string;
  customerName?: string;
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  gracePeriodDays: number;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'LAPSED';
}
