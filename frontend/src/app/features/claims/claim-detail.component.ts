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
    .breadcrumb-current { color: #0f172a; font-weight: 500; font-variant-numeric: tabular-nums; }

    .status-workflow {
      display: flex;
      align-items: center;
      gap: 0;
      margin-bottom: 1.5rem;
      padding: 0.875rem 1.25rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow-x: auto;
    }

    .workflow-step {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 500;
      color: #94a3b8;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .workflow-step.completed {
      color: var(--color-success);
    }

    .workflow-step.current {
      color: #4f46e5;
      font-weight: 700;
    }

    .workflow-step.rejected {
      color: var(--color-danger);
    }

    .workflow-dot {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid currentColor;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6rem;
      flex-shrink: 0;
    }

    .workflow-dot.filled {
      background: currentColor;
    }

    .workflow-connector {
      width: 32px;
      height: 1px;
      background: #e2e8f0;
      flex-shrink: 0;
      margin: 0 4px;
    }

    .field-label {
      font-size: 0.7rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 500;
      margin-bottom: 3px;
    }

    .field-value {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #0f172a;
    }

    .font-mono {
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.01em;
    }
  `],
  template: `
    <div class="container">

      <!-- Breadcrumb -->
      <nav class="breadcrumb-nav no-print" aria-label="Breadcrumb">
        <a routerLink="/claims" class="breadcrumb-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="m19 12H5"/><path d="m12 19-7-7 7-7"/>
          </svg>
          Claims
        </a>
        <span class="breadcrumb-sep" aria-hidden="true">/</span>
        <span class="breadcrumb-current">{{ claim?.claimNumber || 'Loading…' }}</span>
      </nav>

      <!-- Loading / Error -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading claim details…</p>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="alert alert-success" role="status">{{ successMessage }}</div>

      <div *ngIf="!loading && claim">

        <!-- Page header -->
        <div class="page-header no-print">
          <div>
            <div style="display:flex; align-items:center; gap: 0.75rem; flex-wrap: wrap;">
              <h1>{{ claim.claimNumber }}</h1>
              <span [ngClass]="'badge badge-' + claim.status.toLowerCase().replace('_', '-')">{{ claim.status }}</span>
            </div>
            <p>
              Policy
              <a [routerLink]="['/policies', claim.policyId]" style="font-weight: 600;">{{ claim.policyNumber }}</a>
              · {{ claim.customerName }} · {{ claim.vehicleRegistrationNumber }}
            </p>
          </div>

          <!-- Action workflow buttons -->
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn btn-secondary" (click)="printClaimSummary()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect width="12" height="8" x="6" y="14"/>
              </svg>
              Print summary
            </button>

            <!-- SUBMITTED → UNDER_REVIEW -->
            <button
              *ngIf="claim.status === 'SUBMITTED'"
              class="btn btn-primary"
              [disabled]="processing"
              (click)="startReview()"
            >
              <span *ngIf="processing" class="spinner" style="width: 14px; height: 14px;" aria-hidden="true"></span>
              Start review
            </button>

            <!-- UNDER_REVIEW → APPROVED / REJECTED -->
            <button
              *ngIf="claim.status === 'UNDER_REVIEW'"
              class="btn btn-success"
              [disabled]="processing"
              (click)="openApprovalModal()"
            >
              Approve claim
            </button>
            <button
              *ngIf="claim.status === 'UNDER_REVIEW'"
              class="btn btn-danger"
              [disabled]="processing"
              (click)="openRejectionModal()"
            >
              Reject claim
            </button>

            <!-- APPROVED → SETTLED -->
            <button
              *ngIf="claim.status === 'APPROVED'"
              class="btn btn-primary"
              [disabled]="processing"
              (click)="openSettlementModal()"
            >
              Record settlement
            </button>
          </div>
        </div>

        <!-- Status workflow tracker -->
        <div class="status-workflow no-print" role="status" aria-label="Claim workflow status">
          <div class="workflow-step" [class.completed]="isStepCompleted('SUBMITTED')" [class.current]="claim.status === 'SUBMITTED'">
            <div class="workflow-dot" [class.filled]="isStepCompleted('SUBMITTED') || claim.status === 'SUBMITTED'">
              <svg *ngIf="isStepCompleted('SUBMITTED')" width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            Submitted
          </div>
          <div class="workflow-connector"></div>
          <div class="workflow-step" [class.completed]="isStepCompleted('UNDER_REVIEW')" [class.current]="claim.status === 'UNDER_REVIEW'">
            <div class="workflow-dot" [class.filled]="isStepCompleted('UNDER_REVIEW') || claim.status === 'UNDER_REVIEW'">
              <svg *ngIf="isStepCompleted('UNDER_REVIEW')" width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            Under review
          </div>
          <div class="workflow-connector"></div>
          <div class="workflow-step"
            [class.completed]="claim.status === 'APPROVED' || claim.status === 'SETTLED'"
            [class.current]="claim.status === 'APPROVED'"
            [class.rejected]="claim.status === 'REJECTED'"
          >
            <div class="workflow-dot" [class.filled]="claim.status === 'APPROVED' || claim.status === 'SETTLED' || claim.status === 'REJECTED'">
              <svg *ngIf="claim.status === 'APPROVED' || claim.status === 'SETTLED'" width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <svg *ngIf="claim.status === 'REJECTED'" width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="3">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </div>
            {{ claim.status === 'REJECTED' ? 'Rejected' : 'Approved' }}
          </div>
          <div class="workflow-connector"></div>
          <div class="workflow-step" [class.completed]="claim.status === 'SETTLED'" [class.current]="claim.status === 'SETTLED'">
            <div class="workflow-dot" [class.filled]="claim.status === 'SETTLED'">
              <svg *ngIf="claim.status === 'SETTLED'" width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            Settled
          </div>
        </div>

        <!-- Metrics -->
        <div class="metrics-grid no-print">
          <div class="metric-card primary">
            <div class="label">Requested amount</div>
            <div class="value">{{ claim.requestedAmount | number:'1.2-2' }}</div>
            <div class="sub-value">Submitted by claimant</div>
          </div>
          <div class="metric-card info">
            <div class="label">Approved amount</div>
            <div class="value">{{ claim.approvedAmount ? ('$' + (claim.approvedAmount | number:'1.2-2')) : '—' }}</div>
            <div class="sub-value">Authorized following review</div>
          </div>
          <div class="metric-card success">
            <div class="label">Settled amount</div>
            <div class="value">{{ claim.settlementAmount ? ('$' + (claim.settlementAmount | number:'1.2-2')) : '—' }}</div>
            <div class="sub-value">Disbursed settlement payout</div>
          </div>
        </div>

        <!-- Details grid -->
        <div class="no-print" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">

          <!-- Incident -->
          <div class="card">
            <div class="card-title">Incident information</div>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <div>
                <div class="field-label">Incident date</div>
                <div class="field-value font-mono">{{ claim.incidentDate }}</div>
              </div>
              <div>
                <div class="field-label">Description &amp; damages</div>
                <p style="font-size: 0.875rem; color: #334155; line-height: 1.6; margin: 0; white-space: pre-wrap;">{{ claim.description }}</p>
              </div>
              <div>
                <div class="field-label">Claim submitted on</div>
                <div style="font-size: 0.875rem; color: #64748b;">{{ claim.createdAt | date:'medium' }}</div>
              </div>
            </div>
          </div>

          <!-- Decision & settlement -->
          <div class="card">
            <div class="card-title">Decision &amp; settlement log</div>

            <div *ngIf="!claim.decisionDate && !claim.settlementDate" style="color: #64748b; font-size: 0.875rem; line-height: 1.5;">
              No formal decision recorded yet. Transition claim through review to approve or reject.
            </div>

            <div *ngIf="claim.decisionDate">
              <div class="field-label">Assessment decision</div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 0.5rem; margin-top: 4px;">
                <span [ngClass]="'badge-dot badge-' + claim.status.toLowerCase().replace('_', '-')">{{ claim.status }}</span>
                <span style="font-size: 0.775rem; color: #64748b;">{{ claim.decisionDate | date:'mediumDate' }}</span>
              </div>
              <div *ngIf="claim.decisionNote" style="font-size: 0.875rem; color: #334155; font-style: italic; margin-bottom: 1.25rem;">
                "{{ claim.decisionNote }}"
              </div>
            </div>

            <div *ngIf="claim.settlementDate" style="padding-top: 1rem; border-top: 1px solid #f1f5f9;">
              <div class="field-label">Settlement (simulated)</div>
              <div style="font-size: 1.25rem; font-weight: 700; color: var(--color-success); margin: 4px 0;">{{ claim.settlementAmount | number:'1.2-2' }}</div>
              <div style="font-size: 0.8375rem; margin-bottom: 2px;">
                <strong>Ref:</strong> <code class="font-mono">{{ claim.settlementReference }}</code>
              </div>
              <div *ngIf="claim.settlementNote" style="font-size: 0.8375rem; color: #64748b;">{{ claim.settlementNote }}</div>
              <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">{{ claim.settlementDate | date:'medium' }}</div>
            </div>
          </div>
        </div>

        <!-- Print view -->
        <div class="print-only certificate-sheet">
          <div class="certificate-watermark">CLAIM RECORD</div>
          <div style="border-bottom: 2px solid #0f172a; padding-bottom: 0.75rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h2 style="margin: 0; font-size: 1.5rem;">MOTOR CLAIM ASSESSMENT RECORD</h2>
              <div style="font-size: 0.8rem; color: #64748b;">Formal Assessment, Determination &amp; Settlement Record</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 700; font-size: 1.1rem;">CLAIM: {{ claim.claimNumber }}</div>
              <div style="font-size: 0.85rem; text-transform: uppercase;">Status: {{ claim.status }}</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1.5rem;">
            <div>
              <h4 style="margin: 0 0 0.5rem 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem;">POLICY &amp; POLICYHOLDER</h4>
              <p style="margin: 0 0 0.25rem 0; font-weight: 600;">Policy #: {{ claim.policyNumber }}</p>
              <p style="margin: 0; font-size: 0.9rem; color: #475569;">Claimant: {{ claim.customerName }}</p>
            </div>
            <div>
              <h4 style="margin: 0 0 0.5rem 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem;">INSURED VEHICLE</h4>
              <p style="margin: 0 0 0.25rem 0; font-weight: 600;">Plate: {{ claim.vehicleRegistrationNumber }}</p>
            </div>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <h4 style="margin: 0 0 0.5rem 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem;">INCIDENT DETAILS</h4>
            <p style="margin: 0 0 0.25rem 0;"><strong>Incident Date:</strong> {{ claim.incidentDate }}</p>
            <p style="margin: 0; font-size: 0.9rem; color: #334155;">{{ claim.description }}</p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; border: 1px solid #cbd5e1; border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem; text-align: center;">
            <div>
              <div style="font-size: 0.75rem; color: #64748b;">REQUESTED AMOUNT</div>
              <div style="font-size: 1.25rem; font-weight: 700;">{{ claim.requestedAmount | number:'1.2-2' }}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: #64748b;">APPROVED AMOUNT</div>
              <div style="font-size: 1.25rem; font-weight: 700; color: #1d4ed8;">
                {{ claim.approvedAmount ? ('$' + (claim.approvedAmount | number:'1.2-2')) : '—' }}
              </div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: #64748b;">SETTLED PAYOUT</div>
              <div style="font-size: 1.25rem; font-weight: 700; color: #15803d;">
                {{ claim.settlementAmount ? ('$' + (claim.settlementAmount | number:'1.2-2')) : '—' }}
              </div>
            </div>
          </div>

          <div *ngIf="claim.decisionNote" style="margin-bottom: 1.5rem;">
            <h4 style="margin: 0 0 0.5rem 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem;">ASSESSOR DECISION NOTE</h4>
            <p style="margin: 0; font-size: 0.9rem; color: #334155;">"{{ claim.decisionNote }}"</p>
          </div>

          <div *ngIf="claim.settlementDate" style="margin-bottom: 1.5rem;">
            <h4 style="margin: 0 0 0.5rem 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem;">SETTLEMENT DISBURSEMENT</h4>
            <p style="margin: 0;">Ref: <code>{{ claim.settlementReference }}</code> · {{ claim.settlementNote || 'Disbursed' }}</p>
            <p style="margin: 0; font-size: 0.8rem; color: #64748b;">Disbursed on {{ claim.settlementDate | date:'medium' }}</p>
          </div>

          <div style="border-top: 1px solid #cbd5e1; padding-top: 1rem; margin-top: 2rem; font-size: 0.75rem; color: #64748b; display: flex; justify-content: space-between;">
            <div>Demonstration Motor Insurance System · Generated on {{ today | date:'medium' }}</div>
            <div>Claims Assessor Signature &amp; Stamp</div>
          </div>
        </div>

      </div><!-- /content -->

      <!-- Approve modal -->
      <div *ngIf="showApprovalModal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title-approve">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 id="modal-title-approve">Approve claim</h3>
            <button type="button" class="modal-close-btn" (click)="closeModals()" aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger" role="alert">{{ modalError }}</div>

            <div class="alert alert-info" style="font-size: 0.8125rem;">
              <strong>Requested amount:</strong> {{ claim?.requestedAmount | number:'1.2-2' }}
              <br><span style="font-size: 0.75rem;">Approved amount must not exceed the requested amount.</span>
            </div>

            <form (ngSubmit)="submitApproval()" novalidate>
              <div class="form-group">
                <label class="form-label" for="approve-amount">Approved amount ($) *</label>
                <input
                  id="approve-amount"
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
                <label class="form-label" for="approve-note">Decision note / findings</label>
                <textarea
                  id="approve-note"
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
            <button class="btn btn-success" (click)="submitApproval()" [disabled]="processing || !approvalRequest.approvedAmount">
              <span *ngIf="processing" class="spinner" style="width: 14px; height: 14px;" aria-hidden="true"></span>
              Confirm approval
            </button>
          </div>
        </div>
      </div>

      <!-- Reject modal -->
      <div *ngIf="showRejectionModal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title-reject">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 id="modal-title-reject">Reject claim</h3>
            <button type="button" class="modal-close-btn" (click)="closeModals()" aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger" role="alert">{{ modalError }}</div>
            <form (ngSubmit)="submitRejection()" novalidate>
              <div class="form-group">
                <label class="form-label" for="reject-note">Rejection reason / decision note *</label>
                <textarea
                  id="reject-note"
                  class="form-control"
                  rows="3"
                  placeholder="State the reason for rejecting this claim…"
                  required
                  [(ngModel)]="rejectionRequest.decisionNote"
                  name="rejectionNote"
                ></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()" [disabled]="processing">Cancel</button>
            <button class="btn btn-danger" (click)="submitRejection()" [disabled]="processing || !rejectionRequest.decisionNote">
              <span *ngIf="processing" class="spinner" style="width: 14px; height: 14px;" aria-hidden="true"></span>
              Confirm rejection
            </button>
          </div>
        </div>
      </div>

      <!-- Settlement modal -->
      <div *ngIf="showSettlementModal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title-settle">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 id="modal-title-settle">Record claim settlement</h3>
            <button type="button" class="modal-close-btn" (click)="closeModals()" aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger" role="alert">{{ modalError }}</div>

            <div class="alert alert-info" style="font-size: 0.8125rem;">
              <strong>Approved amount:</strong> {{ claim?.approvedAmount | number:'1.2-2' }}
              <br><span style="font-size: 0.75rem;">Settlement amount must not exceed the approved amount.</span>
            </div>

            <form (ngSubmit)="submitSettlement()" novalidate>
              <div class="form-group">
                <label class="form-label" for="settle-amount">Settlement amount ($) *</label>
                <input
                  id="settle-amount"
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
                <label class="form-label" for="settle-ref">Settlement reference *</label>
                <input
                  id="settle-ref"
                  type="text"
                  class="form-control"
                  required
                  [(ngModel)]="settlementRequest.reference"
                  name="settlementReference"
                />
              </div>
              <div class="form-group">
                <label class="form-label" for="settle-note">Settlement note / disbursement method</label>
                <input
                  id="settle-note"
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
            <button class="btn btn-primary" (click)="submitSettlement()" [disabled]="processing || !settlementRequest.amount || !settlementRequest.reference">
              <span *ngIf="processing" class="spinner" style="width: 14px; height: 14px;" aria-hidden="true"></span>
              Disburse settlement
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
  today = new Date();

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

  isStepCompleted(step: string): boolean {
    if (!this.claim) return false;
    const order = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'SETTLED'];
    const currentIdx = order.indexOf(this.claim.status);
    const stepIdx = order.indexOf(step);
    return currentIdx > stepIdx;
  }

  printClaimSummary(): void {
    window.print();
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
