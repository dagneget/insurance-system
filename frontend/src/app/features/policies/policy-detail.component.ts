import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PolicyService } from '../../core/services/policy.service';
import { PaymentService } from '../../core/services/payment.service';
import { ClaimService } from '../../core/services/claim.service';
import { Policy } from '../../core/models/policy.model';
import { Payment, PaymentCreateRequest } from '../../core/models/payment.model';
import { ClaimCreateRequest } from '../../core/models/claim.model';
import { ApiErrorResponse } from '../../core/models/api-error.model';

@Component({
  selector: 'app-policy-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <div style="margin-bottom: 1rem;">
        <a routerLink="/policies" style="color: var(--text-muted); font-size: 0.875rem;">← Back to Policies</a>
      </div>

      <!-- Loading / Error -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading policy details...</p>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>
      <div *ngIf="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <div *ngIf="!loading && policy">
        <!-- Header -->
        <div class="page-header">
          <div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <h1>{{ policy.policyNumber }}</h1>
              <span [ngClass]="'badge badge-' + policy.status.toLowerCase()">{{ policy.status }}</span>
            </div>
            <p style="color: var(--text-muted)">{{ policy.coverageDescription }}</p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button
              class="btn btn-primary"
              [disabled]="policy.outstandingBalance <= 0"
              (click)="openPaymentModal()"
            >
              + Record Payment
            </button>
            <button class="btn btn-secondary" (click)="openClaimModal()">
              + Submit Claim
            </button>
          </div>
        </div>

        <!-- Metric Summary -->
        <div class="metrics-grid">
          <div class="metric-card primary">
            <div class="label">Total Premium</div>
            <div class="value">\${{ policy.premium | number:'1.2-2' }}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Agreed policy premium</div>
          </div>
          <div class="metric-card success">
            <div class="label">Total Paid</div>
            <div class="value">\${{ policy.totalPaid | number:'1.2-2' }}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Simulated recorded receipts</div>
          </div>
          <div class="metric-card warning">
            <div class="label">Remaining Balance</div>
            <div class="value" [style.color]="policy.outstandingBalance > 0 ? 'var(--danger)' : 'var(--success)'">
              \${{ policy.outstandingBalance | number:'1.2-2' }}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
              {{ policy.outstandingBalance <= 0 ? 'Fully Paid' : 'Outstanding due' }}
            </div>
          </div>
        </div>

        <!-- Grid of Details -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
          <!-- Customer & Vehicle Info -->
          <div class="card">
            <div class="card-title">Policyholder & Insured Vehicle</div>
            <div style="margin-bottom: 1rem;">
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Customer Name</div>
              <div style="font-size: 1.1rem; font-weight: 600;">
                <a [routerLink]="['/customers', policy.customerId]">{{ policy.customerName }}</a>
              </div>
              <div style="font-size: 0.875rem; color: var(--text-muted);">Phone: {{ policy.customerPhone }}</div>
            </div>

            <hr style="border: 0; border-top: 1px solid var(--border); margin: 1rem 0;" />

            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Insured Vehicle</div>
              <div style="font-size: 1.1rem; font-weight: 600;">{{ policy.vehicleRegistrationNumber }}</div>
              <div style="font-size: 0.875rem; color: var(--text-muted);">{{ policy.vehicleDescription }}</div>
            </div>
          </div>

          <!-- Coverage Terms -->
          <div class="card">
            <div class="card-title">Coverage & Validity Period</div>
            <div style="margin-bottom: 1rem;">
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Coverage Description</div>
              <div style="font-size: 1rem; font-weight: 500;">{{ policy.coverageDescription }}</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Effective From</div>
                <div style="font-size: 1rem; font-weight: 600;">{{ policy.startDate }}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Expires On</div>
                <div style="font-size: 1rem; font-weight: 600;">{{ policy.endDate }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payments Section -->
        <div class="card" style="padding: 0;">
          <div style="padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border);">
            <div>
              <h3 style="margin: 0; font-size: 1.125rem;">Payment History (Simulated)</h3>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Demo transaction ledger records</p>
            </div>
            <button
              class="btn btn-sm btn-primary"
              [disabled]="policy.outstandingBalance <= 0"
              (click)="openPaymentModal()"
            >
              + Record Payment
            </button>
          </div>

          <div *ngIf="payments.length === 0" class="empty-state">
            <h4>No payments recorded</h4>
            <p>Simulate a premium installment payment to update the remaining balance.</p>
          </div>

          <div *ngIf="payments.length > 0" class="table-responsive" style="border: none;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Transaction Ref</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Note</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let pay of payments">
                  <td><code>{{ pay.transactionReference }}</code></td>
                  <td><strong style="color: var(--success);">\${{ pay.amount | number:'1.2-2' }}</strong></td>
                  <td><span class="badge badge-simulated">{{ pay.paymentMethod }}</span></td>
                  <td><span class="badge badge-success">{{ pay.status }}</span></td>
                  <td>{{ pay.note || '—' }}</td>
                  <td>{{ pay.paymentDate | date:'medium' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Record Payment Modal -->
      <div *ngIf="showPaymentModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Record Simulated Payment</h3>
            <button class="btn btn-sm btn-secondary" (click)="closePaymentModal()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="paymentModalError" class="alert alert-danger">
              {{ paymentModalError }}
            </div>

            <div class="alert alert-info">
              <strong>Remaining Policy Balance:</strong> \${{ policy?.outstandingBalance | number:'1.2-2' }}
              <div style="font-size: 0.75rem; margin-top: 0.25rem;">
                Payments exceeding the remaining balance are rejected by business rules.
              </div>
            </div>

            <form (ngSubmit)="submitPayment()">
              <div class="form-group">
                <label class="form-label">Payment Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  [max]="policy?.outstandingBalance || 0"
                  class="form-control"
                  required
                  [(ngModel)]="newPayment.amount"
                  name="amount"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Transaction Reference *</label>
                <input
                  type="text"
                  class="form-control"
                  required
                  [(ngModel)]="newPayment.transactionReference"
                  name="transactionReference"
                />
                <span class="form-text">Must be unique across all transactions.</span>
              </div>

              <div class="form-group">
                <label class="form-label">Payment Method</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="newPayment.paymentMethod"
                  name="paymentMethod"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Note / Remarks</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. Simulated teller/mobile payment"
                  [(ngModel)]="newPayment.note"
                  name="note"
                />
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closePaymentModal()" [disabled]="submittingPayment">Cancel</button>
            <button
              class="btn btn-primary"
              (click)="submitPayment()"
              [disabled]="submittingPayment || !newPayment.amount || !newPayment.transactionReference"
            >
              <span *ngIf="submittingPayment" class="spinner" style="width: 1rem; height: 1rem;"></span>
              Confirm Payment
            </button>
          </div>
        </div>
      </div>

      <!-- File Claim Modal -->
      <div *ngIf="showClaimModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Submit Insurance Claim</h3>
            <button class="btn btn-sm btn-secondary" (click)="closeClaimModal()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="claimModalError" class="alert alert-danger">
              {{ claimModalError }}
            </div>

            <div class="alert alert-info">
              <strong>Coverage Period:</strong> {{ policy?.startDate }} to {{ policy?.endDate }}
              <div style="font-size: 0.75rem; margin-top: 0.25rem;">
                Incident date must fall within coverage dates.
              </div>
            </div>

            <form (ngSubmit)="submitClaim()">
              <div class="form-group">
                <label class="form-label">Incident Date *</label>
                <input
                  type="date"
                  class="form-control"
                  [min]="policy?.startDate"
                  [max]="policy?.endDate"
                  required
                  [(ngModel)]="newClaim.incidentDate"
                  name="incidentDate"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Requested Claim Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  class="form-control"
                  placeholder="1500.00"
                  required
                  [(ngModel)]="newClaim.requestedAmount"
                  name="requestedAmount"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Incident Description *</label>
                <textarea
                  class="form-control"
                  rows="3"
                  placeholder="Describe the vehicle incident and damages..."
                  required
                  [(ngModel)]="newClaim.description"
                  name="description"
                ></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeClaimModal()" [disabled]="submittingClaim">Cancel</button>
            <button
              class="btn btn-primary"
              (click)="submitClaim()"
              [disabled]="submittingClaim || !newClaim.incidentDate || !newClaim.requestedAmount || !newClaim.description"
            >
              <span *ngIf="submittingClaim" class="spinner" style="width: 1rem; height: 1rem;"></span>
              Submit Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PolicyDetailComponent implements OnInit {
  policy: Policy | null = null;
  payments: Payment[] = [];
  policyId!: number;
  loading = true;
  errorMessage = '';
  successMessage = '';

  // Payment Modal
  showPaymentModal = false;
  submittingPayment = false;
  paymentModalError = '';
  newPayment: PaymentCreateRequest = {
    amount: 0,
    transactionReference: '',
    paymentMethod: 'DEMO',
    note: ''
  };

  // Claim Modal
  showClaimModal = false;
  submittingClaim = false;
  claimModalError = '';
  newClaim: ClaimCreateRequest = {
    policyId: 0,
    incidentDate: '',
    requestedAmount: 0,
    description: ''
  };

  constructor(
    private route: ActivatedRoute,
    private policyService: PolicyService,
    private paymentService: PaymentService,
    private claimService: ClaimService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.policyId = Number(idParam);
      this.loadPolicyDetails();
    }
  }

  loadPolicyDetails(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.policyService.getPolicyById(this.policyId).subscribe({
      next: (data) => {
        this.policy = data;
        this.cdr.markForCheck();
        this.paymentService.getPaymentsByPolicy(this.policyId).subscribe({
          next: (payList) => {
            this.payments = payList;
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
        this.errorMessage = err.message || 'Policy not found';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openPaymentModal(): void {
    if (!this.policy) return;
    const randNum = Math.floor(1000 + Math.random() * 9000);
    this.newPayment = {
      amount: this.policy.outstandingBalance > 0 ? this.policy.outstandingBalance : 1000,
      transactionReference: `DEMO-PAY-${randNum}`,
      paymentMethod: 'DEMO',
      note: 'Simulated demonstration payment'
    };
    this.paymentModalError = '';
    this.showPaymentModal = true;
    this.cdr.markForCheck();
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.cdr.markForCheck();
  }

  submitPayment(): void {
    if (!this.policy) return;

    if (this.newPayment.amount <= 0) {
      this.paymentModalError = 'Payment amount must be greater than zero.';
      this.cdr.markForCheck();
      return;
    }

    if (this.newPayment.amount > this.policy.outstandingBalance) {
      this.paymentModalError = `Payment amount ($${this.newPayment.amount}) exceeds remaining balance ($${this.policy.outstandingBalance}).`;
      this.cdr.markForCheck();
      return;
    }

    this.submittingPayment = true;
    this.paymentModalError = '';
    this.cdr.markForCheck();

    this.paymentService.recordPayment(this.policyId, this.newPayment).subscribe({
      next: (recorded) => {
        this.submittingPayment = false;
        this.showPaymentModal = false;
        this.successMessage = `Payment of $${recorded.amount} recorded successfully (Ref: ${recorded.transactionReference})!`;
        this.loadPolicyDetails();
        this.cdr.markForCheck();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.markForCheck();
        }, 4000);
      },
      error: (err: ApiErrorResponse) => {
        this.submittingPayment = false;
        this.paymentModalError = err.details?.length ? err.details.join(', ') : err.message;
        this.cdr.markForCheck();
      }
    });
  }

  openClaimModal(): void {
    if (!this.policy) return;
    this.newClaim = {
      policyId: this.policy.id,
      incidentDate: this.policy.startDate,
      requestedAmount: 1500,
      description: ''
    };
    this.claimModalError = '';
    this.showClaimModal = true;
    this.cdr.markForCheck();
  }

  closeClaimModal(): void {
    this.showClaimModal = false;
    this.cdr.markForCheck();
  }

  submitClaim(): void {
    if (!this.newClaim.description.trim()) {
      this.claimModalError = 'Incident description is required.';
      this.cdr.markForCheck();
      return;
    }

    this.submittingClaim = true;
    this.claimModalError = '';
    this.cdr.markForCheck();

    this.claimService.createClaim(this.newClaim).subscribe({
      next: (created) => {
        this.submittingClaim = false;
        this.showClaimModal = false;
        this.successMessage = `Claim ${created.claimNumber} submitted successfully!`;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.markForCheck();
        }, 4000);
      },
      error: (err: ApiErrorResponse) => {
        this.submittingClaim = false;
        this.claimModalError = err.details?.length ? err.details.join(', ') : err.message;
        this.cdr.markForCheck();
      }
    });
  }
}
