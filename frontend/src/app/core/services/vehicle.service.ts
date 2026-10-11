import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Vehicle, VehicleCreateRequest } from '../models/vehicle.model';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  constructor(private api: ApiService) {}

  getVehicles(search?: string, customerId?: number): Observable<Vehicle[]> {
    return this.api.get<Vehicle[]>('/vehicles', { search, customerId });
  }

  getVehicleById(id: number): Observable<Vehicle> {
    return this.api.get<Vehicle>(`/vehicles/${id}`);
  }

  createVehicle(request: VehicleCreateRequest): Observable<Vehicle> {
    return this.api.post<Vehicle>('/vehicles', request);
  }
}
