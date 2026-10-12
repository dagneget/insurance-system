import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Tariff } from '../models/tariff.model';

@Injectable({
  providedIn: 'root'
})
export class TariffService {
  constructor(private api: ApiService) {}

  getAllTariffs(): Observable<Tariff[]> {
    return this.api.get<Tariff[]>('/tariffs');
  }

  getTariff(productCode: string): Observable<Tariff> {
    return this.api.get<Tariff>(`/tariffs/${productCode}`);
  }

  updateTariff(productCode: string, tariff: Partial<Tariff>, updatedBy = 'elena.manager'): Observable<Tariff> {
    return this.api.put<Tariff>(`/tariffs/${productCode}?updatedBy=${encodeURIComponent(updatedBy)}`, tariff);
  }
}
