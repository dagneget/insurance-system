import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Claim, ClaimCreateRequest, ClaimSettlementRequest, ClaimStatus, ClaimStatusUpdateRequest, ClaimInvestigationRequest } from '../models/claim.model';
import { ClaimPayout, ClaimDisbursementRequest } from '../models/claim-payout.model';

@Injectable({
  providedIn: 'root'
})
export class ClaimService {
  constructor(private api: ApiService) {}

  getClaims(status?: ClaimStatus): Observable<Claim[]> {
    return this.api.get<Claim[]>('/claims', status ? { status } : undefined);
  }

  getClaimById(id: number): Observable<Claim> {
    return this.api.get<Claim>(`/claims/${id}`);
  }

  createClaim(request: ClaimCreateRequest): Observable<Claim> {
    return this.api.post<Claim>('/claims', request);
  }

  updateStatus(id: number, request: ClaimStatusUpdateRequest): Observable<Claim> {
    return this.api.patch<Claim>(`/claims/${id}/status`, request);
  }

  reviewClaim(id: number, request: ClaimStatusUpdateRequest): Observable<Claim> {
    return this.api.post<Claim>(`/claims/${id}/review`, request);
  }

  investigateClaim(id: number, request: ClaimInvestigationRequest, adjusterUsername = 'sarah.adjuster'): Observable<Claim> {
    const url = `/claims/${id}/investigate?adjusterUsername=${encodeURIComponent(adjusterUsername)}`;
    return this.api.post<Claim>(url, request);
  }

  recordSettlement(id: number, request: ClaimSettlementRequest): Observable<Claim> {
    return this.api.post<Claim>(`/claims/${id}/settlements`, request);
  }

  getPendingDisbursements(): Observable<ClaimPayout[]> {
    return this.api.get<ClaimPayout[]>('/claims/disbursements/pending');
  }

  disburseClaim(claimId: number, request: ClaimDisbursementRequest, financeOfficerUsername = 'marcus.finance'): Observable<ClaimPayout> {
    const url = `/claims/${claimId}/disburse?financeOfficerUsername=${encodeURIComponent(financeOfficerUsername)}`;
    return this.api.post<ClaimPayout>(url, request);
  }

  getPayoutByClaimId(claimId: number): Observable<ClaimPayout> {
    return this.api.get<ClaimPayout>(`/claims/${claimId}/payout`);
  }
}
