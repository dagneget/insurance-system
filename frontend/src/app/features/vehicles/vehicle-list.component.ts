import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VehicleService } from '../../core/services/vehicle.service';
import { CustomerService } from '../../core/services/customer.service';
import { Vehicle, VehicleCreateRequest } from '../../core/models/vehicle.model';
import { Customer } from '../../core/models/customer.model';
import { ApiErrorResponse } from '../../core/models/api-error.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">

      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1>Vehicles</h1>
          <p>Manage registered motor vehicles linked to customers.</p>
        </div>
        <button *ngIf="canRegisterVehicle" class="btn btn-primary" (click)="openCreateModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
          Register vehicle
        </button>
      </div>

      <!-- Search bar -->
      <div class="filter-bar">
        <div class="search-input-group">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="search"
            placeholder="Search by plate, make, model, or customer name…"
            [(ngModel)]="searchQuery"
            (keyup.enter)="loadVehicles()"
            aria-label="Search vehicles"
          />
        </div>
        <button class="btn btn-secondary" (click)="loadVehicles()">Search</button>
        <button *ngIf="searchQuery" class="btn btn-ghost" (click)="resetSearch()">Clear</button>
      </div>

      <!-- Alerts -->
      <div *ngIf="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="alert alert-success" role="status">{{ successMessage }}</div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading registered vehicles…</p>
      </div>

      <!-- Table -->
      <div *ngIf="!loading" class="card table-card" style="padding: 0;">

        <!-- Empty state -->
        <div *ngIf="vehicles.length === 0" class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
          </svg>
          <h3>No vehicles found</h3>
          <p>Register a vehicle for an existing customer.</p>
          <button class="btn btn-primary" (click)="openCreateModal()">Register vehicle</button>
        </div>

        <div *ngIf="vehicles.length > 0" class="table-responsive" style="border:none; border-radius:0;">
          <table class="data-table" aria-label="Registered vehicles">
            <thead>
              <tr>
                <th>Registration plate</th>
                <th>Make &amp; model</th>
                <th>Year</th>
                <th>Owner</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let v of displayedVehicles">
                <td>
                  <strong class="font-mono">{{ v.registrationNumber }}</strong>
                </td>
                <td>
                  <div class="cell-primary">{{ v.make }} {{ v.model }}</div>
                </td>
                <td class="cell-secondary">{{ v.manufactureYear }}</td>
                <td>
                  <a *ngIf="canViewCustomer" [routerLink]="['/customers', v.customerId]" class="link-cell">{{ v.customerName }}</a>
                  <span *ngIf="!canViewCustomer" class="cell-primary">{{ v.customerName }}</span>
                </td>
                <td class="cell-secondary">{{ v.createdAt | date:'mediumDate' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table footer / Pagination bar -->
        <div *ngIf="vehicles.length > pageSize" class="table-pagination-bar">
          <span class="pagination-info">
            Showing <strong>{{ startIndex }}–{{ endIndex }}</strong> of <strong>{{ vehicles.length }}</strong> vehicles
          </span>
          <div class="pagination-controls">
            <span class="pagination-page-indicator">Page {{ currentPage }} of {{ totalPages }}</span>
            <div class="pagination-nav-buttons">
              <button
                type="button"
                class="btn-pagination"
                [disabled]="currentPage === 1"
                (click)="prevPage()"
                aria-label="Previous page"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                Prev
              </button>
              <button
                type="button"
                class="btn-pagination"
                [disabled]="currentPage >= totalPages"
                (click)="nextPage()"
                aria-label="Next page"
              >
                Next
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Register vehicle modal -->
      <div *ngIf="showModal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title-reg-vehicle">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 id="modal-title-reg-vehicle">Register new vehicle</h3>
            <button type="button" class="modal-close-btn" (click)="closeModal()" aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger" role="alert">{{ modalError }}</div>

            <form (ngSubmit)="submitCreate()" novalidate>
              <div class="form-group">
                <label class="form-label" for="veh-owner">Vehicle owner (customer) *</label>
                <select
                  id="veh-owner"
                  class="form-control"
                  [(ngModel)]="newVehicle.customerId"
                  name="customerId"
                  required
                >
                  <option [ngValue]="0" disabled>Select customer…</option>
                  <option *ngFor="let c of customerList" [ngValue]="c.id">{{ c.fullName }} ({{ c.phone }})</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="veh-reg">Registration / plate number *</label>
                <input
                  id="veh-reg"
                  type="text"
                  class="form-control"
                  placeholder="e.g. 3-A12345"
                  required
                  [(ngModel)]="newVehicle.registrationNumber"
                  name="registrationNumber"
                  style="text-transform: uppercase; font-variant-numeric: tabular-nums;"
                />
                <span class="form-text">Unique identification plate for the motor vehicle.</span>
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
                  placeholder="2021"
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
            <button class="btn btn-secondary" (click)="closeModal()" [disabled]="submitting">Cancel</button>
            <button
              class="btn btn-primary"
              (click)="submitCreate()"
              [disabled]="submitting || !newVehicle.customerId || !newVehicle.registrationNumber || !newVehicle.make || !newVehicle.model"
            >
              <span *ngIf="submitting" class="spinner" style="width: 14px; height: 14px;" aria-hidden="true"></span>
              Save vehicle
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .font-mono { font-variant-numeric: tabular-nums; letter-spacing: 0.01em; font-weight: 600; color: #0f172a; }
    .cell-primary { font-size: 0.8375rem; font-weight: 500; color: #0f172a; }
    .cell-secondary { font-size: 0.775rem; color: #64748b; }
    .link-cell { font-size: 0.8375rem; font-weight: 500; color: #4f46e5; text-decoration: none; }
    .link-cell:hover { text-decoration: underline; }
  `]
})
export class VehicleListComponent implements OnInit {
  vehicles: Vehicle[] = [];
  customerList: Customer[] = [];
  searchQuery = '';
  loading = true;
  errorMessage = '';
  successMessage = '';

  showModal = false;
  submitting = false;
  modalError = '';
  newVehicle: VehicleCreateRequest = {
    customerId: 0,
    registrationNumber: '',
    make: '',
    model: '',
    manufactureYear: 2022
  };

  pageSize = 6;
  currentPage = 1;

  get totalPages(): number {
    return Math.ceil(this.vehicles.length / this.pageSize) || 1;
  }

  get startIndex(): number {
    if (this.vehicles.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.vehicles.length);
  }

  get displayedVehicles(): Vehicle[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.vehicles.slice(start, start + this.pageSize);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cdr.markForCheck();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.cdr.markForCheck();
    }
  }

  get canRegisterVehicle(): boolean {
    return this.authService.hasRole(['ROLE_AGENT', 'ROLE_ADMIN']);
  }

  get canViewCustomer(): boolean {
    return this.authService.hasRole(['ROLE_AGENT', 'ROLE_ADMIN']);
  }

  constructor(
    private vehicleService: VehicleService,
    private customerService: CustomerService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = 1;
    this.cdr.markForCheck();
    this.vehicleService.getVehicles(this.searchQuery).subscribe({
      next: (data) => {
        this.vehicles = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: ApiErrorResponse) => {
        this.errorMessage = err.message || 'Failed to load vehicles';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  resetSearch(): void {
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadVehicles();
  }

  openCreateModal(): void {
    this.modalError = '';
    this.newVehicle = {
      customerId: 0,
      registrationNumber: '',
      make: '',
      model: '',
      manufactureYear: new Date().getFullYear() - 2
    };

    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.customerList = customers;
        this.showModal = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Could not load customer list for vehicle registration.';
        this.cdr.markForCheck();
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.cdr.markForCheck();
  }

  submitCreate(): void {
    if (!this.newVehicle.customerId || !this.newVehicle.registrationNumber.trim() || !this.newVehicle.make.trim() || !this.newVehicle.model.trim()) {
      this.modalError = 'All vehicle fields are required.';
      this.cdr.markForCheck();
      return;
    }

    this.submitting = true;
    this.modalError = '';
    this.cdr.markForCheck();

    this.vehicleService.createVehicle(this.newVehicle).subscribe({
      next: (created) => {
        this.submitting = false;
        this.showModal = false;
        this.successMessage = `Vehicle ${created.registrationNumber} registered successfully!`;
        this.loadVehicles();
        this.cdr.markForCheck();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.markForCheck();
        }, 4000);
      },
      error: (err: ApiErrorResponse) => {
        this.submitting = false;
        this.modalError = err.details?.length ? err.details.join(', ') : err.message;
        this.cdr.markForCheck();
      }
    });
  }
}
