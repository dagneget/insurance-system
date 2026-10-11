import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { Customer } from '../../core/models/customer.model';
import { Vehicle, VehicleCreateRequest } from '../../core/models/vehicle.model';
import { ApiErrorResponse } from '../../core/models/api-error.model';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <div style="margin-bottom: 1rem;">
        <a routerLink="/customers" style="color: var(--text-muted); font-size: 0.875rem;">← Back to Customers</a>
      </div>

      <!-- Loading / Error -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading customer profile...</p>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>
      <div *ngIf="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <div *ngIf="!loading && customer">
        <div class="page-header">
          <div>
            <h1>{{ customer.fullName }}</h1>
            <p style="color: var(--text-muted)">Customer ID #{{ customer.id }} · Registered {{ customer.createdAt | date:'mediumDate' }}</p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-primary" (click)="openVehicleModal()">+ Register Vehicle</button>
            <a routerLink="/policies" class="btn btn-secondary">+ Issue Policy</a>
          </div>
        </div>

        <!-- Details Card -->
        <div class="card">
          <div class="card-title">Contact & Profile Information</div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Full Name</div>
              <div style="font-size: 1rem; font-weight: 600; margin-top: 0.25rem;">{{ customer.fullName }}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Phone Number</div>
              <div style="font-size: 1rem; font-weight: 600; margin-top: 0.25rem;">{{ customer.phone }}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Email Address</div>
              <div style="font-size: 1rem; font-weight: 600; margin-top: 0.25rem;">{{ customer.email || '—' }}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Account Created</div>
              <div style="font-size: 1rem; font-weight: 600; margin-top: 0.25rem;">{{ customer.createdAt | date:'medium' }}</div>
            </div>
          </div>
        </div>

        <!-- Registered Vehicles Card -->
        <div class="card" style="padding: 0;">
          <div style="padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border);">
            <h3 style="margin: 0; font-size: 1.125rem;">Registered Vehicles ({{ vehicles.length }})</h3>
            <button class="btn btn-sm btn-primary" (click)="openVehicleModal()">+ Add Vehicle</button>
          </div>

          <div *ngIf="vehicles.length === 0" class="empty-state">
            <h4>No vehicles registered</h4>
            <p>Register a vehicle for this customer to create motor policies.</p>
          </div>

          <div *ngIf="vehicles.length > 0" class="table-responsive" style="border: none;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Vehicle ID</th>
                  <th>Plate / Registration #</th>
                  <th>Make</th>
                  <th>Model</th>
                  <th>Year</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let v of vehicles">
                  <td>#{{ v.id }}</td>
                  <td><strong>{{ v.registrationNumber }}</strong></td>
                  <td>{{ v.make }}</td>
                  <td>{{ v.model }}</td>
                  <td>{{ v.manufactureYear }}</td>
                  <td>{{ v.createdAt | date:'mediumDate' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Add Vehicle Modal -->
      <div *ngIf="showVehicleModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Register Vehicle for {{ customer?.fullName }}</h3>
            <button class="btn btn-sm btn-secondary" (click)="closeVehicleModal()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="vehicleModalError" class="alert alert-danger">
              {{ vehicleModalError }}
            </div>

            <form (ngSubmit)="submitVehicle()">
              <div class="form-group">
                <label class="form-label">Registration / Plate Number *</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. 3-A12345"
                  required
                  [(ngModel)]="newVehicle.registrationNumber"
                  name="registrationNumber"
                />
                <span class="form-text">Must be unique across all vehicles.</span>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label">Make *</label>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="e.g. Toyota"
                    required
                    [(ngModel)]="newVehicle.make"
                    name="make"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Model *</label>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="e.g. Corolla"
                    required
                    [(ngModel)]="newVehicle.model"
                    name="model"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Manufacture Year *</label>
                <input
                  type="number"
                  class="form-control"
                  placeholder="2022"
                  required
                  min="1900"
                  max="2030"
                  [(ngModel)]="newVehicle.manufactureYear"
                  name="manufactureYear"
                />
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeVehicleModal()" [disabled]="submittingVehicle">Cancel</button>
            <button class="btn btn-primary" (click)="submitVehicle()" [disabled]="submittingVehicle || !newVehicle.registrationNumber || !newVehicle.make || !newVehicle.model">
              <span *ngIf="submittingVehicle" class="spinner" style="width: 1rem; height: 1rem;"></span>
              Save Vehicle
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CustomerDetailComponent implements OnInit {
  customer: Customer | null = null;
  vehicles: Vehicle[] = [];
  customerId!: number;
  loading = true;
  errorMessage = '';
  successMessage = '';

  showVehicleModal = false;
  submittingVehicle = false;
  vehicleModalError = '';
  newVehicle: VehicleCreateRequest = {
    customerId: 0,
    registrationNumber: '',
    make: '',
    model: '',
    manufactureYear: 2022
  };

  constructor(
    private route: ActivatedRoute,
    private customerService: CustomerService,
    private vehicleService: VehicleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.customerId = Number(idParam);
      this.loadDetails();
    }
  }

  loadDetails(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.customerService.getCustomerById(this.customerId).subscribe({
      next: (cust) => {
        this.customer = cust;
        this.cdr.markForCheck();
        this.vehicleService.getVehicles(undefined, this.customerId).subscribe({
          next: (vList) => {
            this.vehicles = vList;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.loading = false;
            this.cdr.markForCheck();
          }
        });
      },
      error: (err: ApiErrorResponse) => {
        this.errorMessage = err.message || 'Customer not found';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openVehicleModal(): void {
    this.newVehicle = {
      customerId: this.customerId,
      registrationNumber: '',
      make: '',
      model: '',
      manufactureYear: new Date().getFullYear() - 2
    };
    this.vehicleModalError = '';
    this.showVehicleModal = true;
    this.cdr.markForCheck();
  }

  closeVehicleModal(): void {
    this.showVehicleModal = false;
    this.cdr.markForCheck();
  }

  submitVehicle(): void {
    if (!this.newVehicle.registrationNumber.trim() || !this.newVehicle.make.trim() || !this.newVehicle.model.trim()) {
      this.vehicleModalError = 'All vehicle fields are required.';
      this.cdr.markForCheck();
      return;
    }

    this.submittingVehicle = true;
    this.vehicleModalError = '';
    this.cdr.markForCheck();

    this.vehicleService.createVehicle(this.newVehicle).subscribe({
      next: (created) => {
        this.submittingVehicle = false;
        this.showVehicleModal = false;
        this.successMessage = `Vehicle ${created.registrationNumber} registered successfully!`;
        this.loadDetails();
        this.cdr.markForCheck();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.markForCheck();
        }, 4000);
      },
      error: (err: ApiErrorResponse) => {
        this.submittingVehicle = false;
        this.vehicleModalError = err.details?.length ? err.details.join(', ') : err.message;
        this.cdr.markForCheck();
      }
    });
  }
}
