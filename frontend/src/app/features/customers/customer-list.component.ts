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

      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1>Customers</h1>
          <p>Manage policyholders and their registered vehicles.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          Register customer
        </button>
      </div>

      <!-- Search bar -->
      <div class="filter-bar" style="margin-bottom: 1.25rem;">
        <div class="search-input-group">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="search"
            placeholder="Search by name or phone…"
            [(ngModel)]="searchQuery"
            (keyup.enter)="loadCustomers()"
            aria-label="Search customers"
          />
        </div>
        <button class="btn btn-secondary" (click)="loadCustomers()">Search</button>
        <button *ngIf="searchQuery" class="btn btn-ghost" (click)="resetSearch()">Clear</button>
      </div>

      <!-- Alerts -->
      <div *ngIf="errorMessage" class="alert alert-danger" role="alert">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="flex-shrink:0">
          <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
        </svg>
        {{ errorMessage }}
      </div>
      <div *ngIf="successMessage" class="alert alert-success" role="status">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="flex-shrink:0">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        {{ successMessage }}
      </div>

      <!-- Loading state -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading customers…</p>
      </div>

      <!-- Table -->
      <div *ngIf="!loading" class="card table-card" style="padding: 0;">

        <!-- Empty state -->
        <div *ngIf="customers.length === 0" class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <h3>No customers found</h3>
          <p>Register a new customer to start issuing policies.</p>
          <button class="btn btn-primary" (click)="openCreateModal()">Register customer</button>
        </div>

        <div *ngIf="customers.length > 0" class="table-responsive" style="border: none; border-radius: 0;">
          <table class="data-table" aria-label="Customer directory">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Vehicles</th>
                <th>Registered</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of displayedCustomers">
                <td>
                  <div class="customer-cell">
                    <div class="customer-avatar" aria-hidden="true">{{ getInitials(c.fullName) }}</div>
                    <div>
                      <div class="cell-primary">{{ c.fullName }}</div>
                      <div class="cell-secondary">#{{ c.id }}</div>
                    </div>
                  </div>
                </td>
                <td class="cell-mono">{{ c.phone }}</td>
                <td class="cell-secondary">{{ c.email || '—' }}</td>
                <td>
                  <span class="badge badge-info">{{ c.vehicleCount }} vehicle{{ c.vehicleCount === 1 ? '' : 's' }}</span>
                </td>
                <td class="cell-secondary">{{ c.createdAt | date:'mediumDate' }}</td>
                <td>
                  <a [routerLink]="['/customers', c.id]" class="btn btn-sm btn-secondary">View profile</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table footer / Pagination bar -->
        <div *ngIf="customers.length > pageSize" class="table-pagination-bar">
          <span class="pagination-info">
            Showing <strong>{{ startIndex }}–{{ endIndex }}</strong> of <strong>{{ customers.length }}</strong> customers
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

      <!-- Create customer modal -->
      <div *ngIf="showModal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title-create-customer">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 id="modal-title-create-customer">Register new customer</h3>
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
                <label class="form-label" for="new-full-name">Full name <span class="form-label-required-marker" aria-hidden="true">*</span></label>
                <input
                  id="new-full-name"
                  type="text"
                  class="form-control"
                  placeholder="e.g. Abebe Bikila"
                  required
                  [(ngModel)]="newCustomer.fullName"
                  name="fullName"
                  autocomplete="name"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="new-phone">Phone number <span class="form-label-required-marker" aria-hidden="true">*</span></label>
                <input
                  id="new-phone"
                  type="tel"
                  class="form-control"
                  placeholder="e.g. +251911234567"
                  required
                  [(ngModel)]="newCustomer.phone"
                  name="phone"
                  autocomplete="tel"
                />
                <span class="form-text">Used for identity lookups and policy tracking.</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="new-email">Email address</label>
                <input
                  id="new-email"
                  type="email"
                  class="form-control"
                  placeholder="e.g. abebe.bikila@demo.test"
                  [(ngModel)]="newCustomer.email"
                  name="email"
                  autocomplete="email"
                />
              </div>
            </form>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()" [disabled]="submitting">Cancel</button>
            <button
              class="btn btn-primary"
              (click)="submitCreate()"
              [disabled]="submitting || !newCustomer.fullName || !newCustomer.phone"
            >
              <span *ngIf="submitting" class="spinner" style="width: 14px; height: 14px;" aria-hidden="true"></span>
              Save customer
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .customer-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .customer-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      letter-spacing: 0;
    }

    .cell-primary {
      font-size: 0.8375rem;
      font-weight: 500;
      color: #0f172a;
    }

    .cell-secondary {
      font-size: 0.75rem;
      color: #64748b;
    }

    .cell-mono {
      font-variant-numeric: tabular-nums;
      font-size: 0.8375rem;
      color: #334155;
    }

    .form-label-required-marker {
      color: #dc2626;
    }
  `]
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

  pageSize = 6;
  currentPage = 1;

  get totalPages(): number {
    return Math.ceil(this.customers.length / this.pageSize) || 1;
  }

  get startIndex(): number {
    if (this.customers.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.customers.length);
  }

  get displayedCustomers(): Customer[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.customers.slice(start, start + this.pageSize);
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
    this.currentPage = 1;
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
    this.currentPage = 1;
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

  getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
  }
}
