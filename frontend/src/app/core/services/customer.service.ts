import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Customer,
  CustomerCreateRequest,
  CustomerDirectoryItem,
  CustomerDashboard,
  ClientOnboardingRequest,
  ClientOnboardingResponse
} from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(private api: ApiService) {}

  getCustomers(search?: string): Observable<Customer[]> {
    return this.api.get<Customer[]>('/customers', { search });
  }

  getCustomersByAgent(agentId: number): Observable<Customer[]> {
    return this.api.get<Customer[]>(`/customers/agent/${agentId}`);
  }

  getDirectory(search?: string): Observable<CustomerDirectoryItem[]> {
    return this.api.get<CustomerDirectoryItem[]>('/customers/directory', { search });
  }

  getCustomerById(id: number): Observable<Customer> {
    return this.api.get<Customer>(`/customers/${id}`);
  }

  getCustomerDashboard(id: number): Observable<CustomerDashboard> {
    return this.api.get<CustomerDashboard>(`/customers/${id}/dashboard`);
  }

  createCustomer(request: CustomerCreateRequest, actorUsername?: string): Observable<Customer> {
    const url = actorUsername ? `/customers?actorUsername=${encodeURIComponent(actorUsername)}` : '/customers';
    return this.api.post<Customer>(url, request);
  }

  onboardClient(request: ClientOnboardingRequest, agentUsername = 'david.agent'): Observable<ClientOnboardingResponse> {
    return this.api.post<ClientOnboardingResponse>(`/customers/onboard?agentUsername=${encodeURIComponent(agentUsername)}`, request);
  }

  updateCustomer(id: number, request: CustomerCreateRequest, actorUsername = 'abebe.customer'): Observable<Customer> {
    return this.api.put<Customer>(`/customers/${id}?actorUsername=${encodeURIComponent(actorUsername)}`, request);
  }

  updateKycStatus(id: number, kycStatus: string, documentType = 'NATIONAL_ID', actorUsername = 'abebe.customer'): Observable<Customer> {
    return this.api.post<Customer>(`/customers/${id}/kyc?actorUsername=${encodeURIComponent(actorUsername)}`, { kycStatus, documentType });
  }
}
