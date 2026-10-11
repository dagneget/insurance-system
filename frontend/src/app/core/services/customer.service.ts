import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Customer, CustomerCreateRequest } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(private api: ApiService) {}

  getCustomers(search?: string): Observable<Customer[]> {
    return this.api.get<Customer[]>('/customers', { search });
  }

  getCustomerById(id: number): Observable<Customer> {
    return this.api.get<Customer>(`/customers/${id}`);
  }

  createCustomer(request: CustomerCreateRequest): Observable<Customer> {
    return this.api.post<Customer>('/customers', request);
  }
}
