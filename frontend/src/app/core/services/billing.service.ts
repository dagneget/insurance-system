import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { BillingSchedule } from '../models/billing.model';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  constructor(private api: ApiService) {}

  getAllSchedules(): Observable<BillingSchedule[]> {
    return this.api.get<BillingSchedule[]>('/billing/schedules');
  }

  getSchedulesByPolicy(policyId: number): Observable<BillingSchedule[]> {
    return this.api.get<BillingSchedule[]>(`/billing/schedules/policy/${policyId}`);
  }

  getOverdueSchedules(): Observable<BillingSchedule[]> {
    return this.api.get<BillingSchedule[]>('/billing/overdue');
  }
}
