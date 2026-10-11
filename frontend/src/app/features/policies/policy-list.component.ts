import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PolicyService } from '../../core/services/policy.service';
import { CustomerService } from '../../core/services/customer.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { Policy, PolicyCreateRequest, PolicyStatus } from '../../core/models/policy.model';
import { Customer } from '../../core/models/customer.model';
import { Vehicle } from '../../core/models/vehicle.model';
import { ApiErrorResponse } from '../../core/models/api-error.model';

@Component({
  selector: 'app-policy-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="page-header">
        <div>
          <h1>Motor Policies</h1>
          <p style="color: var(--text-muted)">Manage motor insurance policies, premium schedules, and coverage terms.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">+ Create Policy</button>
      </div>

      <!-- Filters & Search -->
      <div class="card" style="padding: 1rem; margin-bottom: 1.5rem;">
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <input
            type="text"
            class="form-control"
            style="flex: 1; min-width: 250px;"
            placeholder="Search by policy #, customer name, or plate..."
            [(ngModel)]="searchQuery"
            (keyup.enter)="loadPolicies()"
          />
          <select class="form-control" style="width: 180px;" [(ngModel)]="statusFilter" (change)="loadPolicies()">
            <option value="">All Statuses</option>
            <option value="ISSUED">Issued (Active)</option>
            <option value="DRAFT">Draft</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="EXPIRED">Expired</option>
          </select>
          <button class="btn btn-secondary" (click)="loadPolicies()">Filter</button>
          <button *ngIf="searchQuery || statusFilter" class="btn btn-secondary" (click)="resetFilters()">Clear</button>
        </div>
      </div>

      <!-- Alert -->
      <div *ngIf="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>
      <div *ngIf="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading policies...</p>
      </div>

      <!-- Table -->
      <div *ngIf="!loading" class="card" style="padding: 0;">
        <div *ngIf="policies.length === 0" class="empty-state">
          <h3>No policies found</h3>
          <p>Create a motor insurance policy for a customer vehicle.</p>
          <button class="btn btn-primary" style="margin-top: 1rem;" (click)="openCreateModal()">+ Create Policy</button>
        </div>

        <div *ngIf="policies.length > 0" class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Policy #</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Coverage Period</th>
                <th>Premium</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of policies">
                <td><strong>{{ p.policyNumber }}</strong></td>
                <td>
                  <a [routerLink]="['/customers', p.customerId]">{{ p.customerName }}</a>
                </td>
                <td>
                  <strong>{{ p.vehicleRegistrationNumber }}</strong>
                  <div style="font-size: 0.75rem; color: var(--text-muted)">{{ p.vehicleDescription }}</div>
                </td>
                <td>
                  {{ p.startDate }} <span style="color: var(--text-muted)">to</span> {{ p.endDate }}
                </td>
                <td><strong>\${{ p.premium | number:'1.2-2' }}</strong></td>
                <td style="color: var(--success); font-weight: 500;">
                  \${{ p.totalPaid | number:'1.2-2' }}
                </td>
                <td>
                  <span [style.color]="p.outstandingBalance > 0 ? 'var(--danger)' : 'var(--text-muted)'" style="font-weight: 600;">
                    \${{ p.outstandingBalance | number:'1.2-2' }}
                  </span>
                </td>
                <td>
                  <span [ngClass]="'badge badge-' + p.status.toLowerCase()">{{ p.status }}</span>
                </td>
                <td>
                  <a [routerLink]="['/policies', p.id]" class="btn btn-sm btn-secondary">View Details</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create Policy Modal -->
      <div *ngIf="showModal" class="modal-backdrop">
        <div class="modal-dialog" style="max-width: 600px;">
          <div class="modal-header">
            <h3>Issue Motor Policy</h3>
            <button class="btn btn-sm btn-secondary" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger">
              {{ modalError }}
            </div>

            <form (ngSubmit)="submitCreate()">
              <div class="form-group">
                <label class="form-label">Customer *</label>
                <select class="form-control" [(ngModel)]="newPolicy.customerId" name="customerId" (change)="onCustomerSelected()" required>
                  <option [ngValue]="0" disabled>Select Policyholder...</option>
                  <option *ngFor="let c of customerList" [ngValue]="c.id">
                    {{ c.fullName }} ({{ c.phone }})
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Vehicle *</label>
                <select class="form-control" [(ngModel)]="newPolicy.vehicleId" name="vehicleId" [disabled]="!newPolicy.customerId" required>
                  <option [ngValue]="0" disabled>
                    {{ !newPolicy.customerId ? 'Select customer first...' : (customerVehicles.length === 0 ? 'No vehicles for this customer' : 'Select vehicle...') }}
                  </option>
                  <option *ngFor="let v of customerVehicles" [ngValue]="v.id">
                    {{ v.registrationNumber }} — {{ v.make }} {{ v.model }} ({{ v.manufactureYear }})
                  </option>
                </select>
                <span *ngIf="newPolicy.customerId && customerVehicles.length === 0" class="form-error">
                  This customer has no vehicles. Please register a vehicle for them first.
                </span>
              </div>

              <div class="form-group">
                <label class="form-label">Coverage Description *</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. Comprehensive Motor Insurance (Demo)"
                  required
                  [(ngModel)]="newPolicy.coverageDescription"
                  name="coverageDescription"
                />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label">Coverage Start Date *</label>
                  <input
                    type="date"
                    class="form-control"
                    required
                    [(ngModel)]="newPolicy.startDate"
                    name="startDate"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Coverage End Date *</label>
                  <input
                    type="date"
                    class="form-control"
                    required
                    [(ngModel)]="newPolicy.endDate"
                    name="endDate"
                  />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label">Premium Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    class="form-control"
                    placeholder="5000.00"
                    required
                    [(ngModel)]="newPolicy.premium"
                    name="premium"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Initial Status</label>
                  <select class="form-control" [(ngModel)]="newPolicy.status" name="status">
                    <option value="ISSUED">ISSUED (Active for claims & payments)</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()" [disabled]="submitting">Cancel</button>
            <button
              class="btn btn-primary"
              (click)="submitCreate()"
              [disabled]="submitting || !newPolicy.customerId || !newPolicy.vehicleId || !newPolicy.coverageDescription || !newPolicy.startDate || !newPolicy.endDate || !newPolicy.premium"
            >
              <span *ngIf="submitting" class="spinner" style="width: 1rem; height: 1rem;"></span>
              Issue Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PolicyListComponent implements OnInit {
  policies: Policy[] = [];
  customerList: Customer[] = [];
  customerVehicles: Vehicle[] = [];
  searchQuery = '';
  statusFilter = '';
  loading = true;
  errorMessage = '';
  successMessage = '';

  showModal = false;
  submitting = false;
  modalError = '';
  newPolicy: PolicyCreateRequest = {
    customerId: 0,
    vehicleId: 0,
    coverageDescription: 'Comprehensive Motor Insurance',
    startDate: '',
    endDate: '',
    premium: 5000,
    status: 'ISSUED'
  };

  constructor(
    private policyService: PolicyService,
    private customerService: CustomerService,
    private vehicleService: VehicleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPolicies();
  }

  loadPolicies(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();
    const statusParam = this.statusFilter ? (this.statusFilter as PolicyStatus) : undefined;
    this.policyService.getPolicies(this.searchQuery, statusParam).subscribe({
      next: (data) => {
        this.policies = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: ApiErrorResponse) => {
        this.errorMessage = err.message || 'Failed to load policies';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.statusFilter = '';
    this.loadPolicies();
  }

  openCreateModal(): void {
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);
    nextYear.setDate(nextYear.getDate() - 1);

    this.newPolicy = {
      customerId: 0,
      vehicleId: 0,
      coverageDescription: 'Comprehensive Motor Insurance (Demo)',
      startDate: today.toISOString().split('T')[0],
      endDate: nextYear.toISOString().split('T')[0],
      premium: 6500.00,
      status: 'ISSUED'
    };
    this.customerVehicles = [];
    this.modalError = '';

    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.customerList = customers;
        this.showModal = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Could not load customers for policy creation.';
        this.cdr.markForCheck();
      }
    });
  }

  onCustomerSelected(): void {
    this.newPolicy.vehicleId = 0;
    this.customerVehicles = [];
    this.cdr.markForCheck();
    if (this.newPolicy.customerId) {
      this.vehicleService.getVehicles(undefined, this.newPolicy.customerId).subscribe({
        next: (vehicles) => {
          this.customerVehicles = vehicles;
          if (vehicles.length > 0) {
            this.newPolicy.vehicleId = vehicles[0].id;
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
        }
      });
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.cdr.markForCheck();
  }

  submitCreate(): void {
    if (!this.newPolicy.customerId || !this.newPolicy.vehicleId) {
      this.modalError = 'Customer and vehicle are required.';
      this.cdr.markForCheck();
      return;
    }

    if (new Date(this.newPolicy.endDate) < new Date(this.newPolicy.startDate)) {
      this.modalError = 'End date cannot be before start date.';
      this.cdr.markForCheck();
      return;
    }

    this.submitting = true;
    this.modalError = '';
    this.cdr.markForCheck();

    this.policyService.createPolicy(this.newPolicy).subscribe({
      next: (created) => {
        this.submitting = false;
        this.showModal = false;
        this.successMessage = `Policy ${created.policyNumber} issued successfully!`;
        this.loadPolicies();
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
