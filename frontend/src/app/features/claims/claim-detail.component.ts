import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClaimService } from '../../core/services/claim.service';
import { Claim, ClaimSettlementRequest, ClaimStatusUpdateRequest } from '../../core/models/claim.model';
import { ApiErrorResponse } from '../../core/models/api-error.model';

@Component({
  selector: 'app-claim-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <div style="margin-bottom: 1rem;">
        <a routerLink="/claims" style="color: var(--text-muted); font-size: 0.875rem;">← Back to Claims</a>
      </div>

      <!-- Loading / Error -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading claim details...</p>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>
      <div *ngIf="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <div *ngIf="!loading && claim">
        <!-- Page Header -->
        <div class="page-header">
          <div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <h1>Claim {{ claim.claimNumber }}</h1>
              <span [ngClass]="'badge badge-' + claim.status.toLowerCase().replace('_', '-')">{{ claim.status }}</span>
            </div>
            <p style="color: var(--text-muted)">
              Linked to Policy
              <a [routerLink]="['/policies', claim.policyId]"><strong>{{ claim.policyNumber }}</strong></a>
              · {{ claim.customerName }} ({{ claim.vehicleRegistrationNumber }})
            </p>
          </div>

          <!-- Action Workflow Buttons -->
          <div style="display: flex; gap: 0.5rem;">
            <!-- SUBMITTED -> UNDER_REVIEW -->
            <button
              *ngIf="claim.status === 'SUBMITTED'"
              class="btn btn-primary"
              [disabled]="processing"
              (click)="startReview()"
            >
              Start Review
            </button>

            <!-- UNDER_REVIEW -> APPROVED or REJECTED -->
            <button
              *ngIf="claim.status === 'UNDER_REVIEW'"
              class="btn btn-success"
              [disabled]="processing"
              (click)="openApprovalModal()"
            >
              Approve Claim
            </button>
            <button
              *ngIf="claim.status === 'UNDER_REVIEW'"
              class="btn btn-danger"
              [disabled]="processing"
              (click)="openRejectionModal()"
            >
              Reject Claim
            </button>

            <!-- APPROVED -> SETTLED -->
            <button
              *ngIf="claim.status === 'APPROVED'"
              class="btn btn-primary"
              [disabled]="processing"
              (click)="openSettlementModal()"
            >
              Record Settlement
            </button>
          </div>
        </div>

        <!-- Metric Overview -->
        <div class="metrics-grid">
          <div class="metric-card primary">
            <div class="label">Requested Amount</div>
            <div class="value">\${{ claim.requestedAmount | number:'1.2-2' }}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Submitted by claimant</div>
          </div>
          <div class="metric-card info">
            <div class="label">Approved Amount</div>
            <div class="value">
              {{ claim.approvedAmount ? ('$' + (claim.approvedAmount | number:'1.2-2')) : '—' }}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Authorized following review</div>
          </div>
          <div class="metric-card success">
            <div class="label">Settled Amount</div>
            <div class="value">
              {{ claim.settlementAmount ? ('$' + (claim.settlementAmount | number:'1.2-2')) : '—' }}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Disbursed settlement payout</div>
          </div>
        </div>

        <!-- Claim Content Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
          <!-- Incident Details -->
          <div class="card">
            <div class="card-title">Incident Information</div>
            <div style="margin-bottom: 1rem;">
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Incident Date</div>
              <div style="font-size: 1.1rem; font-weight: 600;">{{ claim.incidentDate }}</div>
            </div>

            <div style="margin-bottom: 1rem;">
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Description & Damages</div>
              <p style="margin-top: 0.25rem; font-size: 0.95rem; white-space: pre-wrap;">{{ claim.description }}</p>
            </div>

            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Claim Submitted On</div>
              <div style="font-size: 0.875rem; color: var(--text-muted);">{{ claim.createdAt | date:'medium' }}</div>
            </div>
          </div>

          <!-- Review & Settlement Details -->
          <div class="card">
            <div class="card-title">Decision & Settlement Log</div>

            <div *ngIf="!claim.decisionDate && !claim.settlementDate" style="color: var(--text-muted); font-size: 0.875rem;">
              No formal decision recorded yet. Transition claim through review to approve or reject.
            </div>

            <div *ngIf="claim.decisionDate" style="margin-bottom: 1.25rem;">
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Assessment Decision</div>
              <div style="font-weight: 600; margin-top: 0.25rem;">
                <span [ngClass]="'badge badge-' + claim.status.toLowerCase().replace('_', '-')">{{ claim.status }}</span>
                <span *ngIf="claim.decisionDate" style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.5rem;">
                  {{ claim.decisionDate | date:'mediumDate' }}
                </span>
              </div>
              <div *ngIf="claim.decisionNote" style="font-size: 0.875rem; margin-top: 0.25rem; color: var(--text-main);">
                "{{ claim.decisionNote }}"
              </div>
            </div>

            <div *ngIf="claim.settlementDate" style="padding-top: 1rem; border-top: 1px solid var(--border);">
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Settlement Details (Simulated)</div>
              <div style="font-size: 1rem; font-weight: 700; color: var(--success); margin-top: 0.25rem;">
                \${{ claim.settlementAmount | number:'1.2-2' }}
              </div>
              <div style="font-size: 0.85rem; margin-top: 0.25rem;">
                <strong>Ref:</strong> <code>{{ claim.settlementReference }}</code>
              </div>
              <div *ngIf="claim.settlementNote" style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
                {{ claim.settlementNote }}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
                Settled on {{ claim.settlementDate | date:'medium' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Approve Modal -->
      <div *ngIf="showApprovalModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Approve Claim</h3>
            <button class="btn btn-sm btn-secondary" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger">
              {{ modalError }}
            </div>

            <div class="alert alert-info">
              <strong>Requested Amount:</strong> \${{ claim?.requestedAmount | number:'1.2-2' }}
              <div style="font-size: 0.75rem; margin-top: 0.25rem;">
                Approved amount must not exceed the requested amount.
              </div>
            </div>

            <form (ngSubmit)="submitApproval()">
              <div class="form-group">
                <label class="form-label">Approved Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  [max]="claim?.requestedAmount || 0"
                  class="form-control"
                  required
                  [(ngModel)]="approvalRequest.approvedAmount"
                  name="approvedAmount"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Decision Note / Findings</label>
                <textarea
                  class="form-control"
                  rows="3"
                  placeholder="e.g. Verified by assessor report; repair estimate confirmed."
                  [(ngModel)]="approvalRequest.decisionNote"
                  name="decisionNote"
                ></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()" [disabled]="processing">Cancel</button>
            <button
              class="btn btn-success"
              (click)="submitApproval()"
              [disabled]="processing || !approvalRequest.approvedAmount"
            >
              <span *ngIf="processing" class="spinner" style="width: 1rem; height: 1rem;"></span>
              Confirm Approval
            </button>
          </div>
        </div>
      </div>

      <!-- Reject Modal -->
      <div *ngIf="showRejectionModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Reject Claim</h3>
            <button class="btn btn-sm btn-secondary" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger">
              {{ modalError }}
            </div>

            <form (ngSubmit)="submitRejection()">
              <div class="form-group">
                <label class="form-label">Rejection Reason / Decision Note *</label>
                <textarea
                  class="form-control"
                  rows="3"
                  placeholder="State the reason for rejecting this claim..."
                  required
                  [(ngModel)]="rejectionRequest.decisionNote"
                  name="rejectionNote"
                ></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()" [disabled]="processing">Cancel</button>
            <button
              class="btn btn-danger"
              (click)="submitRejection()"
              [disabled]="processing || !rejectionRequest.decisionNote"
            >
              <span *ngIf="processing" class="spinner" style="width: 1rem; height: 1rem;"></span>
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>

      <!-- Settlement Modal -->
      <div *ngIf="showSettlementModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Record Claim Settlement</h3>
            <button class="btn btn-sm btn-secondary" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger">
              {{ modalError }}
            </div>

            <div class="alert alert-info">
              <strong>Approved Amount:</strong> \${{ claim?.approvedAmount | number:'1.2-2' }}
              <div style="font-size: 0.75rem; margin-top: 0.25rem;">
                Settlement amount must not exceed the approved amount.
              </div>
            </div>

            <form (ngSubmit)="submitSettlement()">
              <div class="form-group">
                <label class="form-label">Settlement Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  [max]="claim?.approvedAmount || 0"
                  class="form-control"
                  required
                  [(ngModel)]="settlementRequest.amount"
                  name="settlementAmount"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Settlement Reference *</label>
                <input
                  type="text"
                  class="form-control"
                  required
                  [(ngModel)]="settlementRequest.reference"
                  name="settlementReference"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Settlement Note / Disbursement Method</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. Simulated direct transfer to body shop"
                  [(ngModel)]="settlementRequest.note"
                  name="settlementNote"
                />
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()" [disabled]="processing">Cancel</button>
            <button
              class="btn btn-primary"
              (click)="submitSettlement()"
              [disabled]="processing || !settlementRequest.amount || !settlementRequest.reference"
            >
              <span *ngIf="processing" class="spinner" style="width: 1rem; height: 1rem;"></span>
              Disburse Settlement
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ClaimDetailComponent implements OnInit {
  claim: Claim | null = null;
  claimId!: number;
  loading = true;
  processing = false;
  errorMessage = '';
  successMessage = '';
  modalError = '';

  // Modals
  showApprovalModal = false;
  showRejectionModal = false;
  showSettlementModal = false;

  approvalRequest: ClaimStatusUpdateRequest = {
    status: 'APPROVED',
    decisionNote: '',
    approvedAmount: 0
  };

  rejectionRequest: ClaimStatusUpdateRequest = {
    status: 'REJECTED',
    decisionNote: '',
    approvedAmount: 0
  };

  settlementRequest: ClaimSettlementRequest = {
    amount: 0,
    reference: '',
    note: ''
  };

  constructor(
    private route: ActivatedRoute,
    private claimService: ClaimService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.claimId = Number(idParam);
      this.loadClaim();
    }
  }

  loadClaim(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();
    this.claimService.getClaimById(this.claimId).subscribe({
      next: (data) => {
        this.claim = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: ApiErrorResponse) => {
        this.errorMessage = err.message || 'Claim not found';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  startReview(): void {
    this.processing = true;
    this.errorMessage = '';
    this.cdr.markForCheck();
    const req: ClaimStatusUpdateRequest = {
      status: 'UNDER_REVIEW',
      decisionNote: 'Review initiated by claims officer'
    };

    this.claimService.updateStatus(this.claimId, req).subscribe({
      next: (updated) => {
        this.processing = false;
        this.claim = updated;
        this.successMessage = 'Claim status updated to UNDER_REVIEW.';
        this.cdr.markForCheck();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.markForCheck();
        }, 4000);
      },
      error: (err: ApiErrorResponse) => {
        this.processing = false;
        this.errorMessage = err.details?.length ? err.details.join(', ') : err.message;
        this.cdr.markForCheck();
      }
    });
  }

  openApprovalModal(): void {
    if (!this.claim) return;
    this.approvalRequest = {
      status: 'APPROVED',
      decisionNote: 'Approved following assessment',
      approvedAmount: this.claim.requestedAmount
    };
    this.modalError = '';
    this.showApprovalModal = true;
    this.cdr.markForCheck();
  }

  openRejectionModal(): void {
    this.rejectionRequest = {
      status: 'REJECTED',
      decisionNote: '',
      approvedAmount: 0
    };
    this.modalError = '';
    this.showRejectionModal = true;
    this.cdr.markForCheck();
  }

  openSettlementModal(): void {
    if (!this.claim) return;
    const randNum = Math.floor(1000 + Math.random() * 9000);
    this.settlementRequest = {
      amount: this.claim.approvedAmount || this.claim.requestedAmount,
      reference: `DEMO-SETTLE-${randNum}`,
      note: 'Simulated disbursement'
    };
    this.modalError = '';
    this.showSettlementModal = true;
    this.cdr.markForCheck();
  }

  closeModals(): void {
    this.showApprovalModal = false;
    this.showRejectionModal = false;
    this.showSettlementModal = false;
    this.cdr.markForCheck();
  }

  submitApproval(): void {
    if (!this.claim) return;
    if (this.approvalRequest.approvedAmount! <= 0) {
      this.modalError = 'Approved amount must be greater than zero.';
      this.cdr.markForCheck();
      return;
    }
    if (this.approvalRequest.approvedAmount! > this.claim.requestedAmount) {
      this.modalError = `Approved amount cannot exceed requested amount ($${this.claim.requestedAmount}).`;
      this.cdr.markForCheck();
      return;
    }

    this.processing = true;
    this.modalError = '';
    this.cdr.markForCheck();

    this.claimService.updateStatus(this.claimId, this.approvalRequest).subscribe({
      next: (updated) => {
        this.processing = false;
        this.closeModals();
        this.claim = updated;
        this.successMessage = `Claim approved for $${updated.approvedAmount}!`;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.markForCheck();
        }, 4000);
      },
      error: (err: ApiErrorResponse) => {
        this.processing = false;
        this.modalError = err.details?.length ? err.details.join(', ') : err.message;
        this.cdr.markForCheck();
      }
    });
  }

  submitRejection(): void {
    if (!this.rejectionRequest.decisionNote?.trim()) {
      this.modalError = 'Rejection reason is required.';
      this.cdr.markForCheck();
      return;
    }

    this.processing = true;
    this.modalError = '';
    this.cdr.markForCheck();

    this.claimService.updateStatus(this.claimId, this.rejectionRequest).subscribe({
      next: (updated) => {
        this.processing = false;
        this.closeModals();
        this.claim = updated;
        this.successMessage = 'Claim has been rejected.';
        this.cdr.markForCheck();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.markForCheck();
        }, 4000);
      },
      error: (err: ApiErrorResponse) => {
        this.processing = false;
        this.modalError = err.details?.length ? err.details.join(', ') : err.message;
        this.cdr.markForCheck();
      }
    });
  }

  submitSettlement(): void {
    if (!this.claim) return;
    if (this.settlementRequest.amount <= 0) {
      this.modalError = 'Settlement amount must be greater than zero.';
      this.cdr.markForCheck();
      return;
    }
    if (this.settlementRequest.amount > (this.claim.approvedAmount || 0)) {
      this.modalError = `Settlement amount cannot exceed approved amount ($${this.claim.approvedAmount}).`;
      this.cdr.markForCheck();
      return;
    }

    this.processing = true;
    this.modalError = '';
    this.cdr.markForCheck();

    this.claimService.recordSettlement(this.claimId, this.settlementRequest).subscribe({
      next: (updated) => {
        this.processing = false;
        this.closeModals();
        this.claim = updated;
        this.successMessage = `Claim settled successfully for $${updated.settlementAmount} (Ref: ${updated.settlementReference})!`;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.markForCheck();
        }, 4000);
      },
      error: (err: ApiErrorResponse) => {
        this.processing = false;
        this.modalError = err.details?.length ? err.details.join(', ') : err.message;
        this.cdr.markForCheck();
      }
    });
  }
}
