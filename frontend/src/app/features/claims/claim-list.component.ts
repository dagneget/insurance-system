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
      <div class="page-header">
        <div>
          <h1>Insurance Claims</h1>
          <p style="color: var(--text-muted)">Process claims from initial submission through review, approval, and settlement.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">+ Submit Claim</button>
      </div>

      <!-- Status Filters -->
      <div class="card" style="padding: 1rem; margin-bottom: 1.5rem;">
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
          <span style="font-size: 0.875rem; font-weight: 600; color: var(--text-muted);">Filter by Status:</span>
          <button
            class="btn btn-sm"
            [ngClass]="statusFilter === '' ? 'btn-primary' : 'btn-secondary'"
            (click)="setStatusFilter('')"
          >
            All
          </button>
          <button
            class="btn btn-sm"
            [ngClass]="statusFilter === 'SUBMITTED' ? 'btn-primary' : 'btn-secondary'"
            (click)="setStatusFilter('SUBMITTED')"
          >
            Submitted
          </button>
          <button
            class="btn btn-sm"
            [ngClass]="statusFilter === 'UNDER_REVIEW' ? 'btn-primary' : 'btn-secondary'"
            (click)="setStatusFilter('UNDER_REVIEW')"
          >
            Under Review
          </button>
          <button
            class="btn btn-sm"
            [ngClass]="statusFilter === 'APPROVED' ? 'btn-primary' : 'btn-secondary'"
            (click)="setStatusFilter('APPROVED')"
          >
            Approved
          </button>
          <button
            class="btn btn-sm"
            [ngClass]="statusFilter === 'SETTLED' ? 'btn-primary' : 'btn-secondary'"
            (click)="setStatusFilter('SETTLED')"
          >
            Settled
          </button>
          <button
            class="btn btn-sm"
            [ngClass]="statusFilter === 'REJECTED' ? 'btn-primary' : 'btn-secondary'"
            (click)="setStatusFilter('REJECTED')"
          >
            Rejected
          </button>
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
        <p>Loading claims...</p>
      </div>

      <!-- Table -->
      <div *ngIf="!loading" class="card" style="padding: 0;">
        <div *ngIf="claims.length === 0" class="empty-state">
          <h3>No claims found</h3>
          <p>Submit a claim against an active motor policy to begin review.</p>
          <button class="btn btn-primary" style="margin-top: 1rem;" (click)="openCreateModal()">+ Submit Claim</button>
        </div>

        <div *ngIf="claims.length > 0" class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Claim #</th>
                <th>Policy #</th>
                <th>Customer</th>
                <th>Vehicle Plate</th>
                <th>Incident Date</th>
                <th>Requested</th>
                <th>Approved</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of claims">
                <td><strong>{{ c.claimNumber }}</strong></td>
                <td>
                  <a [routerLink]="['/policies', c.policyId]"><strong>{{ c.policyNumber }}</strong></a>
                </td>
                <td>{{ c.customerName }}</td>
                <td>{{ c.vehicleRegistrationNumber }}</td>
                <td>{{ c.incidentDate }}</td>
                <td><strong>\${{ c.requestedAmount | number:'1.2-2' }}</strong></td>
                <td>
                  <span *ngIf="c.approvedAmount">\${{ c.approvedAmount | number:'1.2-2' }}</span>
                  <span *ngIf="!c.approvedAmount" style="color: var(--text-muted)">—</span>
                </td>
                <td>
                  <span [ngClass]="'badge badge-' + c.status.toLowerCase().replace('_', '-')">{{ c.status }}</span>
                </td>
                <td>
                  <a [routerLink]="['/claims', c.id]" class="btn btn-sm btn-secondary">Review</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Submit Claim Modal -->
      <div *ngIf="showModal" class="modal-backdrop">
        <div class="modal-dialog" style="max-width: 580px;">
          <div class="modal-header">
            <h3>Submit New Claim</h3>
            <button class="btn btn-sm btn-secondary" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger">
              {{ modalError }}
            </div>

            <form (ngSubmit)="submitCreate()">
              <div class="form-group">
                <label class="form-label">Insured Policy *</label>
                <select class="form-control" [(ngModel)]="newClaim.policyId" name="policyId" (change)="onPolicySelected()" required>
                  <option [ngValue]="0" disabled>Select Active Policy...</option>
                  <option *ngFor="let p of policyList" [ngValue]="p.id">
                    {{ p.policyNumber }} — {{ p.customerName }} ({{ p.vehicleRegistrationNumber }})
                  </option>
                </select>
              </div>

              <div *ngIf="selectedPolicy" class="alert alert-info" style="font-size: 0.8rem; padding: 0.75rem;">
                <strong>Policy Validity:</strong> {{ selectedPolicy.startDate }} to {{ selectedPolicy.endDate }}
                <br />
                <strong>Vehicle:</strong> {{ selectedPolicy.vehicleRegistrationNumber }} ({{ selectedPolicy.vehicleDescription }})
              </div>

              <div class="form-group">
                <label class="form-label">Incident Date *</label>
                <input
                  type="date"
                  class="form-control"
                  [min]="selectedPolicy?.startDate"
                  [max]="selectedPolicy?.endDate"
                  required
                  [(ngModel)]="newClaim.incidentDate"
                  name="incidentDate"
                />
                <span class="form-text">Must fall strictly within policy coverage dates.</span>
              </div>

              <div class="form-group">
                <label class="form-label">Requested Amount ($) *</label>
                <input
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
                <label class="form-label">Incident Description & Damage Details *</label>
                <textarea
                  class="form-control"
                  rows="3"
                  placeholder="Details of accident, location, and parts damaged..."
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
              <span *ngIf="submitting" class="spinner" style="width: 1rem; height: 1rem;"></span>
              Submit Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  `
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
