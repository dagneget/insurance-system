import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PolicyService } from '../../core/services/policy.service';
import { CustomerService } from '../../core/services/customer.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { AuthService } from '../../core/services/auth.service';
import { Policy, PolicyCreateRequest, PolicyStatus, QuoteCalculationDto } from '../../core/models/policy.model';
import { Customer } from '../../core/models/customer.model';
import { Vehicle } from '../../core/models/vehicle.model';
import { ApiErrorResponse } from '../../core/models/api-error.model';

@Component({
  selector: 'app-policy-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">

      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1>Motor Policies</h1>
          <p>Manage motor insurance policies, premium schedules, endorsements, and renewals.</p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-secondary" (click)="exportToCsv()" [disabled]="policies.length === 0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
            Export CSV
          </button>
          <button *ngIf="canCreatePolicy" class="btn btn-primary" (click)="openCreateModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
            Create policy / quote
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <div class="search-input-group">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="search"
            placeholder="Search by policy #, customer name, or plate…"
            [(ngModel)]="searchQuery"
            (keyup.enter)="loadPolicies()"
            aria-label="Search policies"
          />
        </div>
        <select class="form-control" style="width: 220px;" [(ngModel)]="statusFilter" (change)="loadPolicies()" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="EXPIRING_30">⚠️ Expiring soon (30 days)</option>
          <option value="ISSUED">Issued (active)</option>
          <option value="QUOTED">Quoted</option>
          <option value="RENEWED">Renewed</option>
          <option value="DRAFT">Draft</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="EXPIRED">Expired</option>
        </select>
        <button class="btn btn-secondary" (click)="loadPolicies()">Filter</button>
        <button *ngIf="searchQuery || statusFilter" class="btn btn-ghost" (click)="resetFilters()">Clear</button>
      </div>

      <!-- Alerts -->
      <div *ngIf="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="alert alert-success" role="status">{{ successMessage }}</div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading policies…</p>
      </div>

      <!-- Table -->
      <div *ngIf="!loading" class="card table-card" style="padding: 0;">

        <!-- Empty state -->
        <div *ngIf="policies.length === 0" class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <h3>No policies found</h3>
          <p>No policy records match the selected filter criteria.</p>
          <button class="btn btn-primary" (click)="openCreateModal()">Issue policy / quote</button>
        </div>

        <div *ngIf="policies.length > 0" class="table-responsive" style="border:none; border-radius:0;">
          <table class="data-table" aria-label="Motor policies">
            <thead>
              <tr>
                <th>Policy</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Coverage period</th>
                <th class="th-num">Premium</th>
                <th class="th-num">Paid</th>
                <th class="th-num">Balance</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of displayedPolicies">
                <td>
                  <div>
                    <div class="policy-number-cell">{{ p.policyNumber }}</div>
                    <span class="badge" style="background:#f1f5f9;color:#334155;font-size:0.68rem;margin-top:3px;">{{ p.productCode || 'COMPREHENSIVE' }}</span>
                    <div *ngIf="p.renewedFromId" class="renewal-note">
                      ↳ Renewed from {{ p.renewedFromPolicyNumber || '#' + p.renewedFromId }}
                    </div>
                  </div>
                </td>
                <td>
                  <a *ngIf="canViewCustomer" [routerLink]="['/customers', p.customerId]" class="link-cell">{{ p.customerName }}</a>
                  <span *ngIf="!canViewCustomer" class="cell-primary">{{ p.customerName }}</span>
                </td>
                <td>
                  <div class="font-mono cell-primary">{{ p.vehicleRegistrationNumber }}</div>
                  <div class="cell-secondary">{{ p.vehicleDescription }}</div>
                </td>
                <td>
                  <div class="cell-secondary" style="font-size: 0.775rem; white-space: nowrap;">
                    {{ p.startDate }} <span style="color: #94a3b8;">→</span> {{ p.endDate }}
                  </div>
                </td>
                <td class="td-num"><strong class="amount">{{ p.premium | number:'1.2-2' }}</strong></td>
                <td class="td-num" style="color: var(--color-success); font-weight: 500;">{{ p.totalPaid | number:'1.2-2' }}</td>
                <td class="td-num">
                  <span
                    [style.color]="p.outstandingBalance > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)'"
                    style="font-weight: 600; font-variant-numeric: tabular-nums;"
                  >{{ p.outstandingBalance | number:'1.2-2' }}</span>
                </td>
                <td>
                  <span [ngClass]="'badge badge-' + p.status.toLowerCase()">{{ p.status }}</span>
                </td>
                <td>
                  <a [routerLink]="['/policies', p.id]" class="btn btn-sm btn-secondary">View</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table footer / Pagination bar -->
        <div *ngIf="policies.length > pageSize" class="table-pagination-bar">
          <span class="pagination-info">
            Showing <strong>{{ startIndex }}–{{ endIndex }}</strong> of <strong>{{ policies.length }}</strong> policies
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Create policy modal -->
      <div *ngIf="showModal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title-create-policy">
        <div class="modal-dialog" style="max-width: 660px;">
          <div class="modal-header">
            <h3 id="modal-title-create-policy">Issue motor policy or quote</h3>
            <button type="button" class="modal-close-btn" (click)="closeModal()" aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger" role="alert">{{ modalError }}</div>

            <form (ngSubmit)="submitCreate()" novalidate>
              <!-- Customer -->
              <div class="form-group">
                <label class="form-label" for="pol-customer">Customer *</label>
                <select
                  id="pol-customer"
                  class="form-control"
                  [(ngModel)]="newPolicy.customerId"
                  name="customerId"
                  (change)="onCustomerSelected()"
                  required
                >
                  <option [ngValue]="0" disabled>Select policyholder…</option>
                  <option *ngFor="let c of customerList" [ngValue]="c.id">{{ c.fullName }} ({{ c.phone }})</option>
                </select>
              </div>

              <!-- Vehicle -->
              <div class="form-group">
                <label class="form-label" for="pol-vehicle">Vehicle *</label>
                <select
                  id="pol-vehicle"
                  class="form-control"
                  [(ngModel)]="newPolicy.vehicleId"
                  name="vehicleId"
                  (change)="onVehicleSelected()"
                  [disabled]="!newPolicy.customerId"
                  required
                >
                  <option [ngValue]="0" disabled>
                    {{ !newPolicy.customerId ? 'Select customer first…' : (customerVehicles.length === 0 ? 'No vehicles for this customer' : 'Select vehicle…') }}
                  </option>
                  <option *ngFor="let v of customerVehicles" [ngValue]="v.id">
                    {{ v.registrationNumber }} — {{ v.make }} {{ v.model }} ({{ v.manufactureYear }})
                  </option>
                </select>
                <span *ngIf="newPolicy.customerId && customerVehicles.length === 0" class="form-error">
                  This customer has no vehicles. Register a vehicle first.
                </span>
              </div>

              <!-- Product & Deductible -->
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="pol-product">Insurance product *</label>
                  <select
                    id="pol-product"
                    class="form-control"
                    [(ngModel)]="newPolicy.productCode"
                    name="productCode"
                    (change)="onProductChanged()"
                  >
                    <option value="COMPREHENSIVE">Comprehensive cover</option>
                    <option value="THIRD_PARTY">Third-party only</option>
                    <option value="FIRE_AND_THEFT">Third-party, fire &amp; theft</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="pol-deductible">Deductible / excess ($)</label>
                  <input
                    id="pol-deductible"
                    type="number"
                    step="0.01"
                    min="0"
                    class="form-control"
                    [(ngModel)]="newPolicy.deductibleAmount"
                    name="deductibleAmount"
                  />
                </div>
              </div>

              <!-- Premium rating engine -->
              <div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius: 10px; padding: 1rem; margin-bottom: 1.25rem;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <div style="font-size: 0.8375rem; font-weight: 600; color: #0f172a;">Premium rating engine</div>
                    <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">Calculate a transparent formula quote from vehicle value and product risk.</div>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm btn-secondary"
                    [disabled]="!newPolicy.vehicleId || calculatingQuote"
                    (click)="calculateQuote()"
                  >
                    <span *ngIf="calculatingQuote" class="spinner" style="width: 12px; height: 12px;" aria-hidden="true"></span>
                    ⚡ Calculate quote
                  </button>
                </div>

                <div *ngIf="calculatedQuote" style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e2e8f0;">
                  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; font-size: 0.8rem; text-align: center;">
                    <div>
                      <div style="color: #64748b; margin-bottom: 2px;">Base</div>
                      <div style="font-weight: 600;">{{ calculatedQuote.basePremium | number:'1.2-2' }}</div>
                    </div>
                    <div>
                      <div style="color: #64748b; margin-bottom: 2px;">Risk adj.</div>
                      <div style="font-weight: 600;">{{ calculatedQuote.riskAdjustment | number:'1.2-2' }}</div>
                    </div>
                    <div>
                      <div style="color: #64748b; margin-bottom: 2px;">Taxes &amp; fees</div>
                      <div style="font-weight: 600;">{{ calculatedQuote.taxesAndFees | number:'1.2-2' }}</div>
                    </div>
                    <div>
                      <div style="color: #4f46e5; font-weight: 600; margin-bottom: 2px;">Total</div>
                      <div style="color: #4f46e5; font-weight: 700;">{{ calculatedQuote.totalPremium | number:'1.2-2' }}</div>
                    </div>
                  </div>
                  <div style="text-align: right; margin-top: 0.5rem;">
                    <button type="button" class="btn btn-sm btn-primary" (click)="applyQuote()">✓ Apply rate</button>
                  </div>
                </div>
              </div>

              <!-- Coverage description -->
              <div class="form-group">
                <label class="form-label" for="pol-coverage">Coverage description *</label>
                <input
                  id="pol-coverage"
                  type="text"
                  class="form-control"
                  placeholder="e.g. Comprehensive Motor Insurance (Demo)"
                  required
                  [(ngModel)]="newPolicy.coverageDescription"
                  name="coverageDescription"
                />
              </div>

              <!-- Dates -->
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="pol-start">Coverage start *</label>
                  <input id="pol-start" type="date" class="form-control" required [(ngModel)]="newPolicy.startDate" name="startDate" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="pol-end">Coverage end *</label>
                  <input id="pol-end" type="date" class="form-control" required [(ngModel)]="newPolicy.endDate" name="endDate" />
                </div>
              </div>

              <!-- Premium & status -->
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="pol-premium">Premium ($) *</label>
                  <input
                    id="pol-premium"
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
                  <label class="form-label" for="pol-status">Initial status</label>
                  <select id="pol-status" class="form-control" [(ngModel)]="newPolicy.status" name="status">
                    <option value="ISSUED">ISSUED (active policy)</option>
                    <option value="QUOTED">QUOTED (awaiting confirmation)</option>
                    <option value="DRAFT">DRAFT (underwriting draft)</option>
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
              <span *ngIf="submitting" class="spinner" style="width: 14px; height: 14px;" aria-hidden="true"></span>
              Issue policy / quote
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .policy-number-cell {
      font-size: 0.8375rem;
      font-weight: 600;
      color: #0f172a;
      font-variant-numeric: tabular-nums;
    }

    .renewal-note {
      font-size: 0.695rem;
      color: #4338ca;
      margin-top: 3px;
    }

    .font-mono {
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.01em;
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

    .amount {
      font-variant-numeric: tabular-nums;
    }

    .link-cell {
      font-size: 0.8375rem;
      font-weight: 500;
      color: #4f46e5;
      text-decoration: none;
    }
    .link-cell:hover {
      text-decoration: underline;
    }
  `]
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
  calculatingQuote = false;
  calculatedQuote: QuoteCalculationDto | null = null;

  newPolicy: PolicyCreateRequest = {
    customerId: 0,
    vehicleId: 0,
    productCode: 'COMPREHENSIVE',
    deductibleAmount: 500,
    coverageDescription: 'Comprehensive Motor Insurance Cover',
    startDate: '',
    endDate: '',
    premium: 5000,
    status: 'ISSUED'
  };

  pageSize = 6;
  currentPage = 1;

  get totalPages(): number {
    return Math.ceil(this.policies.length / this.pageSize) || 1;
  }

  get startIndex(): number {
    if (this.policies.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.policies.length);
  }

  get displayedPolicies(): Policy[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.policies.slice(start, start + this.pageSize);
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

  get canCreatePolicy(): boolean {
    return this.authService.hasRole(['ROLE_AGENT', 'ROLE_ADMIN']);
  }

  get canViewCustomer(): boolean {
    return this.authService.hasRole(['ROLE_AGENT', 'ROLE_ADMIN']);
  }

  constructor(
    private policyService: PolicyService,
    private customerService: CustomerService,
    private vehicleService: VehicleService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPolicies();
  }

  loadPolicies(): void {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = 1;
    this.cdr.markForCheck();

    if (this.statusFilter === 'EXPIRING_30') {
      this.policyService.getExpiringPolicies(30).subscribe({
        next: (data) => {
          this.policies = data;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err: ApiErrorResponse) => {
          this.errorMessage = err.message || 'Failed to load expiring policies';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
      return;
    }

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
    this.currentPage = 1;
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
      productCode: 'COMPREHENSIVE',
      deductibleAmount: 500,
      coverageDescription: 'Comprehensive Motor Insurance Cover',
      startDate: today.toISOString().split('T')[0],
      endDate: nextYear.toISOString().split('T')[0],
      premium: 5000.00,
      status: 'ISSUED'
    };
    this.customerVehicles = [];
    this.calculatedQuote = null;
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
    this.calculatedQuote = null;
    this.cdr.markForCheck();
    if (this.newPolicy.customerId) {
      this.vehicleService.getVehicles(undefined, this.newPolicy.customerId).subscribe({
        next: (vehicles) => {
          this.customerVehicles = vehicles;
          if (vehicles.length > 0) {
            this.newPolicy.vehicleId = vehicles[0].id;
            this.calculateQuote();
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
        }
      });
    }
  }

  onVehicleSelected(): void {
    this.calculateQuote();
  }

  onProductChanged(): void {
    if (this.newPolicy.productCode === 'COMPREHENSIVE') {
      this.newPolicy.deductibleAmount = 500;
      this.newPolicy.coverageDescription = 'Comprehensive Motor Insurance Cover';
    } else if (this.newPolicy.productCode === 'THIRD_PARTY') {
      this.newPolicy.deductibleAmount = 0;
      this.newPolicy.coverageDescription = 'Third-Party Liability Only';
    } else if (this.newPolicy.productCode === 'FIRE_AND_THEFT') {
      this.newPolicy.deductibleAmount = 250;
      this.newPolicy.coverageDescription = 'Third-Party, Fire & Theft Insurance';
    }
    this.calculateQuote();
  }

  calculateQuote(): void {
    if (!this.newPolicy.vehicleId) return;

    this.calculatingQuote = true;
    this.cdr.markForCheck();

    this.policyService.calculateQuote({
      vehicleId: this.newPolicy.vehicleId,
      productCode: this.newPolicy.productCode || 'COMPREHENSIVE'
    }).subscribe({
      next: (quote) => {
        this.calculatedQuote = quote;
        this.calculatingQuote = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.calculatingQuote = false;
        this.cdr.markForCheck();
      }
    });
  }

  applyQuote(): void {
    if (!this.calculatedQuote) return;
    this.newPolicy.premium = this.calculatedQuote.totalPremium;
    this.newPolicy.deductibleAmount = this.calculatedQuote.deductibleAmount;
    this.newPolicy.coverageDescription = this.calculatedQuote.coverageDescription;
    this.cdr.markForCheck();
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

  exportToCsv(): void {
    if (this.policies.length === 0) return;

    const headers = ['Policy #', 'Product', 'Customer', 'Vehicle', 'Start Date', 'End Date', 'Premium', 'Paid', 'Balance', 'Status'];
    const rows = this.policies.map(p => [
      p.policyNumber,
      p.productCode || 'COMPREHENSIVE',
      `"${p.customerName}"`,
      `"${p.vehicleRegistrationNumber}"`,
      p.startDate,
      p.endDate,
      p.premium,
      p.totalPaid,
      p.outstandingBalance,
      p.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `policies_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
