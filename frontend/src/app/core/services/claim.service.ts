import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Claim, ClaimCreateRequest, ClaimSettlementRequest, ClaimStatus, ClaimStatusUpdateRequest } from '../models/claim.model';

@Injectable({
  providedIn: 'root'
})
export class ClaimService {
  constructor(private api: ApiService) {}

  getClaims(status?: ClaimStatus): Observable<Claim[]> {
    return this.api.get<Claim[]>('/claims', { status });
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

  recordSettlement(id: number, request: ClaimSettlementRequest): Observable<Claim> {
    return this.api.post<Claim>(`/claims/${id}/settlements`, request);
  }
}
