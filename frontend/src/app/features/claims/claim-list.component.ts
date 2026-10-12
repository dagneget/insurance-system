import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClaimService } from '../../core/services/claim.service';
import { PolicyService } from '../../core/services/policy.service';
import { Claim, ClaimCreateRequest, ClaimStatus } from '../../core/models/claim.model';
import { Policy } from '../../core/models/policy.model';
import { ApiErrorResponse } from '../../core/models/api-error.model';

@Component({
  selector: 'app-claim-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">

      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1>Insurance claims</h1>
          <p>Process claims from initial submission through review, approval, and settlement.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
          Submit claim
        </button>
      </div>

      <!-- Status filter tabs -->
      <div class="filter-bar">
        <span style="font-size: 0.8rem; font-weight: 500; color: #64748b; white-space: nowrap;">Status:</span>
        <div class="filter-tabs">
          <button class="filter-tab" [class.active]="statusFilter === ''" (click)="setStatusFilter('')">All</button>
          <button class="filter-tab" [class.active]="statusFilter === 'SUBMITTED'" (click)="setStatusFilter('SUBMITTED')">Submitted</button>
          <button class="filter-tab" [class.active]="statusFilter === 'UNDER_REVIEW'" (click)="setStatusFilter('UNDER_REVIEW')">Under review</button>
          <button class="filter-tab" [class.active]="statusFilter === 'APPROVED'" (click)="setStatusFilter('APPROVED')">Approved</button>
          <button class="filter-tab" [class.active]="statusFilter === 'SETTLED'" (click)="setStatusFilter('SETTLED')">Settled</button>
          <button class="filter-tab" [class.active]="statusFilter === 'REJECTED'" (click)="setStatusFilter('REJECTED')">Rejected</button>
        </div>
      </div>

      <!-- Alerts -->
      <div *ngIf="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="alert alert-success" role="status">{{ successMessage }}</div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading claims…</p>
      </div>

      <!-- Table -->
      <div *ngIf="!loading" class="card table-card" style="padding: 0;">

        <!-- Empty state -->
        <div *ngIf="claims.length === 0" class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect width="8" height="4" x="8" y="2" rx="1"/>
            <path d="m9 14 2 2 4-4"/>
          </svg>
          <h3>No claims found</h3>
          <p>Submit a claim against an active motor policy to begin review.</p>
          <button class="btn btn-primary" (click)="openCreateModal()">Submit claim</button>
        </div>

        <div *ngIf="claims.length > 0" class="table-responsive" style="border:none; border-radius:0;">
          <table class="data-table" aria-label="Insurance claims">
            <thead>
              <tr>
                <th>Claim</th>
                <th>Policy</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Incident date</th>
                <th class="th-num">Requested</th>
                <th class="th-num">Approved</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of displayedClaims">
                <td>
                  <span class="claim-number">{{ c.claimNumber }}</span>
                </td>
                <td>
                  <a [routerLink]="['/policies', c.policyId]" class="policy-link">{{ c.policyNumber }}</a>
                </td>
                <td class="cell-primary">{{ c.customerName }}</td>
                <td class="cell-mono">{{ c.vehicleRegistrationNumber }}</td>
                <td class="cell-secondary">{{ c.incidentDate }}</td>
                <td class="td-num"><strong class="amount">{{ c.requestedAmount | number:'1.2-2' }}</strong></td>
                <td class="td-num">
                  <span *ngIf="c.approvedAmount" class="amount" style="color: var(--color-success);">{{ c.approvedAmount | number:'1.2-2' }}</span>
                  <span *ngIf="!c.approvedAmount" class="cell-secondary">—</span>
                </td>
                <td>
                  <span [ngClass]="'badge-dot badge-' + c.status.toLowerCase().replace('_', '-')">{{ c.status }}</span>
                </td>
                <td>
                  <a [routerLink]="['/claims', c.id]" class="btn btn-sm btn-secondary">Review</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table footer / Pagination bar -->
        <div *ngIf="claims.length > pageSize" class="table-pagination-bar">
          <span class="pagination-info">
            Showing <strong>{{ startIndex }}–{{ endIndex }}</strong> of <strong>{{ claims.length }}</strong> claims
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

      <!-- Submit claim modal -->
      <div *ngIf="showModal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title-submit-claim">
        <div class="modal-dialog" style="max-width: 580px;">
          <div class="modal-header">
            <h3 id="modal-title-submit-claim">Submit new claim</h3>
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
                <label class="form-label" for="claim-policy">Insured policy *</label>
                <select
                  id="claim-policy"
                  class="form-control"
                  [(ngModel)]="newClaim.policyId"
                  name="policyId"
                  (change)="onPolicySelected()"
                  required
                >
                  <option [ngValue]="0" disabled>Select active policy…</option>
                  <option *ngFor="let p of policyList" [ngValue]="p.id">
                    {{ p.policyNumber }} — {{ p.customerName }} ({{ p.vehicleRegistrationNumber }})
                  </option>
                </select>
              </div>

              <div *ngIf="selectedPolicy" class="alert alert-info" style="font-size: 0.8125rem; padding: 0.75rem;">
                <strong>Coverage period:</strong> {{ selectedPolicy.startDate }} to {{ selectedPolicy.endDate }}
                &nbsp;|&nbsp; <strong>Vehicle:</strong> {{ selectedPolicy.vehicleRegistrationNumber }} ({{ selectedPolicy.vehicleDescription }})
              </div>

              <div class="form-group">
                <label class="form-label" for="claim-date">Incident date *</label>
                <input
                  id="claim-date"
                  type="date"
                  class="form-control"
                  [min]="selectedPolicy?.startDate"
                  [max]="selectedPolicy?.endDate"
                  required
                  [(ngModel)]="newClaim.incidentDate"
                  name="incidentDate"
                />
                <span class="form-text">Must fall strictly within the policy coverage dates.</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="claim-amount">Requested amount ($) *</label>
                <input
                  id="claim-amount"
                  type="number"
                  step="0.01"
                  min="1"
                  class="form-control"
                  placeholder="2500.00"
                  required
                  [(ngModel)]="newClaim.requestedAmount"
                  name="requestedAmount"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="claim-desc">Incident description &amp; damage details *</label>
                <textarea
                  id="claim-desc"
                  class="form-control"
                  rows="3"
                  placeholder="Details of accident, location, and parts damaged…"
                  required
                  [(ngModel)]="newClaim.description"
                  name="description"
                ></textarea>
              </div>
            </form>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()" [disabled]="submitting">Cancel</button>
            <button
              class="btn btn-primary"
              (click)="submitCreate()"
              [disabled]="submitting || !newClaim.policyId || !newClaim.incidentDate || !newClaim.requestedAmount || !newClaim.description"
            >
              <span *ngIf="submitting" class="spinner" style="width: 14px; height: 14px;" aria-hidden="true"></span>
              Submit claim
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .claim-number {
      font-size: 0.8375rem;
      font-weight: 600;
      color: #0f172a;
      font-variant-numeric: tabular-nums;
    }

    .policy-link {
      font-size: 0.8375rem;
      font-weight: 500;
      color: #4f46e5;
      text-decoration: none;
    }
    .policy-link:hover { text-decoration: underline; }

    .cell-primary { font-size: 0.8375rem; font-weight: 500; color: #0f172a; }
    .cell-secondary { font-size: 0.775rem; color: #64748b; }
    .cell-mono { font-variant-numeric: tabular-nums; font-size: 0.8375rem; color: #334155; }
    .amount { font-variant-numeric: tabular-nums; }
  `]
})
export class ClaimListComponent implements OnInit {
  claims: Claim[] = [];
  policyList: Policy[] = [];
  selectedPolicy: Policy | null = null;
  statusFilter = '';
  loading = true;
  errorMessage = '';
  successMessage = '';

  showModal = false;
  submitting = false;
  modalError = '';
  newClaim: ClaimCreateRequest = {
    policyId: 0,
    incidentDate: '',
    requestedAmount: 1500,
    description: ''
  };

  pageSize = 6;
  currentPage = 1;

  get totalPages(): number {
    return Math.ceil(this.claims.length / this.pageSize) || 1;
  }

  get startIndex(): number {
    if (this.claims.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.claims.length);
  }

  get displayedClaims(): Claim[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.claims.slice(start, start + this.pageSize);
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
    private claimService: ClaimService,
    private policyService: PolicyService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadClaims();
  }

  loadClaims(): void {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = 1;
    this.cdr.markForCheck();
    const filterParam = this.statusFilter ? (this.statusFilter as ClaimStatus) : undefined;
    this.claimService.getClaims(filterParam).subscribe({
      next: (data) => {
        this.claims = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: ApiErrorResponse) => {
        this.errorMessage = err.message || 'Failed to load claims';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  setStatusFilter(status: string): void {
    this.statusFilter = status;
    this.currentPage = 1;
    this.loadClaims();
  }

  openCreateModal(): void {
    this.selectedPolicy = null;
    this.modalError = '';
    this.newClaim = {
      policyId: 0,
      incidentDate: '',
      requestedAmount: 2000,
      description: ''
    };

    this.policyService.getPolicies(undefined, 'ISSUED').subscribe({
      next: (policies) => {
        this.policyList = policies;
        this.showModal = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Could not load active policies.';
        this.cdr.markForCheck();
      }
    });
  }

  onPolicySelected(): void {
    this.selectedPolicy = this.policyList.find(p => p.id === this.newClaim.policyId) || null;
    if (this.selectedPolicy) {
      this.newClaim.incidentDate = this.selectedPolicy.startDate;
    }
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.showModal = false;
    this.cdr.markForCheck();
  }

  submitCreate(): void {
    if (!this.newClaim.policyId || !this.newClaim.incidentDate || !this.newClaim.requestedAmount || !this.newClaim.description.trim()) {
      this.modalError = 'All claim fields are required.';
      this.cdr.markForCheck();
      return;
    }

    this.submitting = true;
    this.modalError = '';
    this.cdr.markForCheck();

    this.claimService.createClaim(this.newClaim).subscribe({
      next: (created) => {
        this.submitting = false;
        this.showModal = false;
        this.successMessage = `Claim ${created.claimNumber} submitted successfully!`;
        this.loadClaims();
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
