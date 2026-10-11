import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Payment, PaymentCreateRequest } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private api: ApiService) {}

  getPaymentsByPolicy(policyId: number): Observable<Payment[]> {
    return this.api.get<Payment[]>(`/policies/${policyId}/payments`);
  }

  recordPayment(policyId: number, request: PaymentCreateRequest): Observable<Payment> {
    return this.api.post<Payment>(`/policies/${policyId}/payments`, request);
  }
}
