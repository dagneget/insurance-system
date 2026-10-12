import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { AuthService } from '../../core/services/auth.service';
import { Customer } from '../../core/models/customer.model';
import { Vehicle, VehicleCreateRequest } from '../../core/models/vehicle.model';
import { ApiErrorResponse } from '../../core/models/api-error.model';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">

      <!-- Breadcrumb -->
      <nav class="breadcrumb-nav" aria-label="Breadcrumb">
        <a routerLink="/customers" class="breadcrumb-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="m19 12H5"/><path d="m12 19-7-7 7-7"/>
          </svg>
          Customers
        </a>
        <span class="breadcrumb-sep" aria-hidden="true">/</span>
        <span class="breadcrumb-current">{{ customer?.fullName || 'Loading…' }}</span>
      </nav>

      <!-- Loading / Error -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading customer profile…</p>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="alert alert-success" role="status">{{ successMessage }}</div>

      <!-- Content -->
      <div *ngIf="!loading && customer">

        <!-- Page header -->
        <div class="page-header">
          <div class="customer-profile-header">
            <div class="customer-profile-avatar" aria-hidden="true">{{ getInitials(customer.fullName) }}</div>
            <div>
              <h1>{{ customer.fullName }}</h1>
              <p>Customer #{{ customer.id }} · Registered {{ customer.createdAt | date:'mediumDate' }}</p>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
            <a *ngIf="canAccessCustomerPortal" [routerLink]="['/users', customer.id, 'dashboard']" class="btn btn-secondary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect width="7" height="9" x="3" y="3" rx="1.5"/><rect width="7" height="5" x="14" y="3" rx="1.5"/>
                <rect width="7" height="9" x="14" y="12" rx="1.5"/><rect width="7" height="5" x="3" y="16" rx="1.5"/>
              </svg>
              Customer portal
            </a>
            <button class="btn btn-primary" (click)="openVehicleModal()">+ Register vehicle</button>
            <a routerLink="/policies" class="btn btn-secondary">+ Issue policy</a>
          </div>
        </div>

        <!-- Contact info card -->
        <div class="card">
          <div class="card-title">Contact &amp; profile</div>
          <div class="profile-grid">
            <div class="profile-field">
              <div class="profile-field-label">Full name</div>
              <div class="profile-field-value">{{ customer.fullName }}</div>
            </div>
            <div class="profile-field">
              <div class="profile-field-label">Phone number</div>
              <div class="profile-field-value font-mono">{{ customer.phone }}</div>
            </div>
            <div class="profile-field">
              <div class="profile-field-label">Email address</div>
              <div class="profile-field-value">{{ customer.email || '—' }}</div>
            </div>
            <div class="profile-field">
              <div class="profile-field-label">Account created</div>
              <div class="profile-field-value">{{ customer.createdAt | date:'medium' }}</div>
            </div>
          </div>
        </div>

        <!-- Vehicles card -->
        <div class="card" style="padding: 0;">
          <div class="card-header">
            <div>
              <h3 style="margin:0; font-size: 0.9375rem; font-weight: 600;">Registered vehicles</h3>
              <p style="margin:0; font-size: 0.75rem; color: #64748b; margin-top: 2px;">{{ vehicles.length }} vehicle{{ vehicles.length === 1 ? '' : 's' }} on record</p>
            </div>
            <button class="btn btn-sm btn-primary" (click)="openVehicleModal()">+ Add vehicle</button>
          </div>

          <div *ngIf="vehicles.length === 0" class="empty-state" style="padding: 2.5rem;">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
            </svg>
            <h3>No vehicles registered</h3>
            <p>Register a vehicle for this customer to create motor policies.</p>
          </div>

          <div *ngIf="vehicles.length > 0" class="table-responsive" style="border:none; border-radius: 0;">
            <table class="data-table" aria-label="Registered vehicles">
              <thead>
                <tr>
                  <th>Registration plate</th>
                  <th>Make</th>
                  <th>Model</th>
                  <th>Year</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let v of vehicles">
                  <td><strong class="font-mono">{{ v.registrationNumber }}</strong></td>
                  <td>{{ v.make }}</td>
                  <td>{{ v.model }}</td>
                  <td>{{ v.manufactureYear }}</td>
                  <td class="cell-secondary">{{ v.createdAt | date:'mediumDate' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div><!-- /content -->

      <!-- Register vehicle modal -->
      <div *ngIf="showVehicleModal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title-add-vehicle">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 id="modal-title-add-vehicle">Register vehicle for {{ customer?.fullName }}</h3>
            <button type="button" class="modal-close-btn" (click)="closeVehicleModal()" aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div *ngIf="vehicleModalError" class="alert alert-danger" role="alert">{{ vehicleModalError }}</div>

            <form (ngSubmit)="submitVehicle()" novalidate>
              <div class="form-group">
                <label class="form-label" for="reg-number">Registration / plate number *</label>
                <input
                  id="reg-number"
                  type="text"
                  class="form-control"
                  placeholder="e.g. 3-A12345"
                  required
                  [(ngModel)]="newVehicle.registrationNumber"
                  name="registrationNumber"
                  style="font-variant-numeric: tabular-nums; text-transform: uppercase;"
                />
                <span class="form-text">Must be unique across all vehicles.</span>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="veh-make">Make *</label>
                  <input
                    id="veh-make"
                    type="text"
                    class="form-control"
                    placeholder="e.g. Toyota"
                    required
                    [(ngModel)]="newVehicle.make"
                    name="make"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label" for="veh-model">Model *</label>
                  <input
                    id="veh-model"
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
                <label class="form-label" for="veh-year">Manufacture year *</label>
                <input
                  id="veh-year"
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
            <button
              class="btn btn-primary"
              (click)="submitVehicle()"
              [disabled]="submittingVehicle || !newVehicle.registrationNumber || !newVehicle.make || !newVehicle.model"
            >
              <span *ngIf="submittingVehicle" class="spinner" style="width: 14px; height: 14px;" aria-hidden="true"></span>
              Save vehicle
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .breadcrumb-nav {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 1.25rem;
      font-size: 0.8125rem;
    }

    .breadcrumb-link {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #64748b;
      text-decoration: none;
      transition: color 0.1s ease;
    }
    .breadcrumb-link:hover { color: #4f46e5; text-decoration: none; }

    .breadcrumb-sep { color: #cbd5e1; }

    .breadcrumb-current {
      color: #0f172a;
      font-weight: 500;
    }

    .customer-profile-header {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .customer-profile-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: #ffffff;
      font-size: 1rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .profile-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .profile-field-label {
      font-size: 0.7rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .profile-field-value {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #0f172a;
    }

    .font-mono {
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.01em;
    }

    .cell-secondary {
      font-size: 0.75rem;
      color: #64748b;
    }
  `]
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

  get canAccessCustomerPortal(): boolean {
    return this.authService.hasRole(['ROLE_AGENT', 'ROLE_ADMIN']);
  }

  constructor(
    private route: ActivatedRoute,
    private customerService: CustomerService,
    private vehicleService: VehicleService,
    public authService: AuthService,
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

  getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
  }
}
