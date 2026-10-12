import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Payment, PaymentCreateRequest, PaymentStatus, PaymentVoidRequest } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private api: ApiService) {}

  getAllPayments(query?: string, status?: PaymentStatus): Observable<Payment[]> {
    let params = new HttpParams();
    if (query) {
      params = params.set('query', query);
    }
    if (status) {
      params = params.set('status', status);
    }
    return this.api.get<Payment[]>('/payments', params);
  }

  getPaymentById(id: number): Observable<Payment> {
    return this.api.get<Payment>(`/payments/${id}`);
  }

  getPaymentsByPolicy(policyId: number): Observable<Payment[]> {
    return this.api.get<Payment[]>(`/policies/${policyId}/payments`);
  }

  recordPayment(policyId: number, request: PaymentCreateRequest): Observable<Payment> {
    return this.api.post<Payment>(`/policies/${policyId}/payments`, request);
  }

  voidPayment(paymentId: number, request: PaymentVoidRequest): Observable<Payment> {
    return this.api.post<Payment>(`/payments/${paymentId}/void`, request);
  }

  approveVoid(paymentId: number, checkerUsername?: string): Observable<Payment> {
    return this.api.post<Payment>(`/payments/${paymentId}/approve-void`, { checkerUsername: checkerUsername || 'elena.manager' });
  }
}
