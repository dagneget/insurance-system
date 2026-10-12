import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Policy,
  PolicyCreateRequest,
  PolicyStatus,
  QuoteCalculationRequest,
  QuoteCalculationDto,
  PolicyRenewalRequest,
  PolicyCancelRequest,
  Endorsement,
  EndorsementCreateRequest
} from '../models/policy.model';
import { CommissionStatement } from '../models/commission.model';

@Injectable({
  providedIn: 'root'
})
export class PolicyService {
  constructor(private api: ApiService) {}

  getPolicies(search?: string, status?: PolicyStatus): Observable<Policy[]> {
    return this.api.get<Policy[]>('/policies', { search, status });
  }

  getReferralQueue(): Observable<Policy[]> {
    return this.api.get<Policy[]>('/policies/referrals');
  }

  getPoliciesByAgent(agentId: number): Observable<Policy[]> {
    return this.api.get<Policy[]>(`/policies/agent/${agentId}`);
  }

  getExpiringPolicies(days = 30): Observable<Policy[]> {
    return this.api.get<Policy[]>('/policies/expiring', { days });
  }

  getPolicyById(id: number): Observable<Policy> {
    return this.api.get<Policy>(`/policies/${id}`);
  }

  createPolicy(request: PolicyCreateRequest, actorUsername?: string): Observable<Policy> {
    const params = actorUsername ? { actorUsername } : undefined;
    return this.api.post<Policy>('/policies' + (actorUsername ? `?actorUsername=${encodeURIComponent(actorUsername)}` : ''), request);
  }

  calculateQuote(request: QuoteCalculationRequest): Observable<QuoteCalculationDto> {
    return this.api.post<QuoteCalculationDto>('/policies/quote', request);
  }

  approveReferral(id: number, notes?: string, underwriterUsername = 'alexander.uw'): Observable<Policy> {
    return this.api.post<Policy>(`/policies/${id}/referrals/approve?underwriterUsername=${encodeURIComponent(underwriterUsername)}`, { notes });
  }

  rejectReferral(id: number, reason: string, underwriterUsername = 'alexander.uw'): Observable<Policy> {
    return this.api.post<Policy>(`/policies/${id}/referrals/reject?underwriterUsername=${encodeURIComponent(underwriterUsername)}`, { reason });
  }

  renewPolicy(id: number, request: PolicyRenewalRequest): Observable<Policy> {
    return this.api.post<Policy>(`/policies/${id}/renew`, request);
  }

  cancelPolicy(id: number, request: PolicyCancelRequest): Observable<Policy> {
    return this.api.post<Policy>(`/policies/${id}/cancel`, request);
  }

  approvePolicy(id: number): Observable<Policy> {
    return this.api.post<Policy>(`/policies/${id}/approve`, {});
  }

  getEndorsements(id: number): Observable<Endorsement[]> {
    return this.api.get<Endorsement[]>(`/policies/${id}/endorsements`);
  }

  addEndorsement(id: number, request: EndorsementCreateRequest): Observable<Endorsement> {
    return this.api.post<Endorsement>(`/policies/${id}/endorsements`, request);
  }

  getCommissionStatement(agentId: number): Observable<CommissionStatement> {
    return this.api.get<CommissionStatement>(`/policies/commissions/agent/${agentId}`);
  }

  sendRenewalReminder(id: number, actorUsername = 'david.agent'): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/policies/${id}/reminders/renewal?actorUsername=${encodeURIComponent(actorUsername)}`, {});
  }

  sendPaymentReminder(id: number, actorUsername = 'david.agent'): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/policies/${id}/reminders/payment?actorUsername=${encodeURIComponent(actorUsername)}`, {});
  }
}
