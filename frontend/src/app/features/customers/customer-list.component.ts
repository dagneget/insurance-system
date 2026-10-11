import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { Customer, CustomerCreateRequest } from '../../core/models/customer.model';
import { ApiErrorResponse } from '../../core/models/api-error.model';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="page-header">
        <div>
          <h1>Customers</h1>
          <p style="color: var(--text-muted)">Manage policyholders and their registered vehicles.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">+ Register Customer</button>
      </div>

      <!-- Search Bar -->
      <div class="card" style="padding: 1rem; margin-bottom: 1.5rem;">
        <div style="display: flex; gap: 0.75rem;">
          <input
            type="text"
            class="form-control"
            placeholder="Search customers by name or phone..."
            [(ngModel)]="searchQuery"
            (keyup.enter)="loadCustomers()"
          />
          <button class="btn btn-secondary" (click)="loadCustomers()">Search</button>
          <button *ngIf="searchQuery" class="btn btn-secondary" (click)="resetSearch()">Clear</button>
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
        <p>Loading customers...</p>
      </div>

      <!-- Table -->
      <div *ngIf="!loading" class="card" style="padding: 0;">
        <div *ngIf="customers.length === 0" class="empty-state">
          <h3>No customers found</h3>
          <p>Register a new customer to start issuing policies.</p>
          <button class="btn btn-primary" style="margin-top: 1rem;" (click)="openCreateModal()">+ Register Customer</button>
        </div>

        <div *ngIf="customers.length > 0" class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Phone Number</th>
                <th>Email Address</th>
                <th>Vehicles</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of customers">
                <td>#{{ c.id }}</td>
                <td><strong>{{ c.fullName }}</strong></td>
                <td>{{ c.phone }}</td>
                <td>{{ c.email || '—' }}</td>
                <td>
                  <span class="badge badge-info">{{ c.vehicleCount }} vehicle(s)</span>
                </td>
                <td>{{ c.createdAt | date:'mediumDate' }}</td>
                <td>
                  <a [routerLink]="['/customers', c.id]" class="btn btn-sm btn-secondary">View Profile</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create Customer Modal -->
      <div *ngIf="showModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Register New Customer</h3>
            <button class="btn btn-sm btn-secondary" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger">
              {{ modalError }}
            </div>

            <form (ngSubmit)="submitCreate()">
              <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. Abebe Bikila"
                  required
                  [(ngModel)]="newCustomer.fullName"
                  name="fullName"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Phone Number *</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. +251911234567"
                  required
                  [(ngModel)]="newCustomer.phone"
                  name="phone"
                />
                <span class="form-text">Used for identity lookups and policy tracking.</span>
              </div>

              <div class="form-group">
                <label class="form-label">Email Address (Optional)</label>
                <input
                  type="email"
                  class="form-control"
                  placeholder="e.g. abebe.bikila@demo.test"
                  [(ngModel)]="newCustomer.email"
                  name="email"
                />
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()" [disabled]="submitting">Cancel</button>
            <button class="btn btn-primary" (click)="submitCreate()" [disabled]="submitting || !newCustomer.fullName || !newCustomer.phone">
              <span *ngIf="submitting" class="spinner" style="width: 1rem; height: 1rem;"></span>
              Save Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
  searchQuery = '';
  loading = true;
  errorMessage = '';
  successMessage = '';

  showModal = false;
  submitting = false;
  modalError = '';
  newCustomer: CustomerCreateRequest = {
    fullName: '',
    phone: '',
    email: ''
  };

  constructor(
    private customerService: CustomerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();
    this.customerService.getCustomers(this.searchQuery).subscribe({
      next: (data) => {
        this.customers = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: ApiErrorResponse) => {
        this.errorMessage = err.message || 'Failed to load customers';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  resetSearch(): void {
    this.searchQuery = '';
    this.loadCustomers();
  }

  openCreateModal(): void {
    this.newCustomer = { fullName: '', phone: '', email: '' };
    this.modalError = '';
    this.showModal = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.showModal = false;
    this.cdr.markForCheck();
  }

  submitCreate(): void {
    if (!this.newCustomer.fullName.trim() || !this.newCustomer.phone.trim()) {
      this.modalError = 'Please fill in required fields (Full Name, Phone)';
      this.cdr.markForCheck();
      return;
    }

    this.submitting = true;
    this.modalError = '';
    this.cdr.markForCheck();

    this.customerService.createCustomer(this.newCustomer).subscribe({
      next: (created) => {
        this.submitting = false;
        this.showModal = false;
        this.successMessage = `Customer ${created.fullName} created successfully!`;
        this.loadCustomers();
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
