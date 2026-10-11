import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Policy, PolicyCreateRequest, PolicyStatus } from '../models/policy.model';

@Injectable({
  providedIn: 'root'
})
export class PolicyService {
  constructor(private api: ApiService) {}

  getPolicies(search?: string, status?: PolicyStatus): Observable<Policy[]> {
    return this.api.get<Policy[]>('/policies', { search, status });
  }

  getPolicyById(id: number): Observable<Policy> {
    return this.api.get<Policy>(`/policies/${id}`);
  }

  createPolicy(request: PolicyCreateRequest): Observable<Policy> {
    return this.api.post<Policy>('/policies', request);
  }
}
