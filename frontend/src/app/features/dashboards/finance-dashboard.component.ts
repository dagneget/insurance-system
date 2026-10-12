import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../core/services/payment.service';
import { BillingService } from '../../core/services/billing.service';
import { ClaimService } from '../../core/services/claim.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { PolicyService } from '../../core/services/policy.service';
import { Payment, PaymentCreateRequest, PaymentVoidRequest } from '../../core/models/payment.model';
import { BillingSchedule } from '../../core/models/billing.model';
import { ClaimPayout, ClaimDisbursementRequest } from '../../core/models/claim-payout.model';
import { DashboardSummary } from '../../core/models/dashboard.model';
import { Policy } from '../../core/models/policy.model';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container">

      <!-- Header & Actor Profile -->
      <div class="page-header no-print">
        <div>
          <div class="role-badge-row">
            <span class="role-tag role-tag-finance">Finance &amp; Billing Desk</span>
            <span class="badge-dot badge-issued">Marcus Vance</span>
          </div>
          <h1>Collections, Premium Schedules &amp; Claims Disbursement</h1>
          <p>Enforce maker-checker controls, allocate multi-channel payments to installment schedules, and disburse approved claim payouts.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="openPaymentModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Record Collection
          </button>
          <a routerLink="/payments" class="btn btn-secondary">Full Ledger</a>
        </div>
      </div>

      <!-- Financial Metrics Ribbon -->
      <div *ngIf="summary" class="metrics-grid no-print">
        <div class="metric-card primary">
          <div class="label">Gross billed premium</div>
          <div class="value">{{ summary.totalPremium | number:'1.0-0' }}</div>
          <div class="sub-value">Total underwriting debits</div>
        </div>
        <div class="metric-card success">
          <div class="label">Settled collections</div>
          <div class="value">{{ summary.totalPaid | number:'1.0-0' }}</div>
          <div class="sub-value">Verified cash &amp; bank receipts</div>
        </div>
        <div class="metric-card warning">
          <div class="label">Outstanding receivables</div>
          <div class="value" [style.color]="summary.totalOutstanding > 0 ? 'var(--color-danger)' : 'var(--color-success)'">
            {{ summary.totalOutstanding | number:'1.0-0' }}
          </div>
          <div class="sub-value">{{ overdueSchedules.length }} overdue installment(s)</div>
        </div>
        <div class="metric-card info">
          <div class="label">Pending claim payouts</div>
          <div class="value">{{ pendingDisbursements.length }}</div>
          <div class="sub-value">{{ totalPendingDisbursementAmount | number:'1.0-0' }} approved awaiting wire</div>
        </div>
        <div class="metric-card danger">
          <div class="label">Voided adjustments</div>
          <div class="value">{{ voidedCount }}</div>
          <div class="sub-value">Reversed ledger records</div>
        </div>
      </div>

      <!-- Desk Navigation Tabs -->
      <div class="desk-tabs no-print">
        <button
          type="button"
          class="desk-tab"
          [class.active]="activeTab === 'collections'"
          (click)="setActiveTab('collections')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
          Collections Ledger ({{ payments.length }})
        </button>
        <button
          type="button"
          class="desk-tab"
          [class.active]="activeTab === 'billing'"
          (click)="setActiveTab('billing')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Billing Schedules ({{ billingSchedules.length }})
          <span *ngIf="overdueSchedules.length > 0" class="tab-count-badge warning">{{ overdueSchedules.length }} overdue</span>
        </button>
        <button
          type="button"
          class="desk-tab"
          [class.active]="activeTab === 'disbursements'"
          (click)="setActiveTab('disbursements')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          Claims Disbursement Desk ({{ pendingDisbursements.length }})
          <span *ngIf="pendingDisbursements.length > 0" class="tab-count-badge info">{{ pendingDisbursements.length }} pending</span>
        </button>
        <button
          type="button"
          class="desk-tab"
          [class.active]="activeTab === 'reconciliation'"
          (click)="setActiveTab('reconciliation')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          Financial Reconciliation &amp; Reports
        </button>
      </div>

      <!-- Alerts -->
      <div *ngIf="errorMessage" class="alert alert-danger no-print" role="alert">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="alert alert-success no-print" role="status">{{ successMessage }}</div>

      <!-- TAB 1: COLLECTIONS LEDGER -->
      <div *ngIf="activeTab === 'collections'" class="card no-print" style="padding: 0; margin-top: 1rem;">
        <div class="section-header">
          <div>
            <h3 class="section-title">Collections Ledger &amp; Cash Inflow</h3>
            <p class="section-desc">Audit journal entries with real-time installment allocation trace and maker-checker status</p>
          </div>
          <div class="header-right-tools">
            <div class="search-field-inline">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                type="search"
                placeholder="Search ref, policy, customer…"
                [(ngModel)]="searchQuery"
                (input)="applyFilter()"
              />
            </div>
            <button class="btn btn-sm btn-secondary" (click)="openPaymentModal()">
              + Record Payment
            </button>
          </div>
        </div>

        <div class="table-responsive" style="border: none;">
          <table class="data-table" aria-label="Collections Ledger">
            <thead>
              <tr>
                <th>Tx Reference</th>
                <th>Policy &amp; Vehicle</th>
                <th>Customer</th>
                <th>Allocation</th>
                <th class="th-num">Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Status / Approval</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of displayedPayments">
                <td>
                  <code class="ref-code">{{ p.transactionReference }}</code>
                  <div *ngIf="p.voidReason" class="void-note">Voided: {{ p.voidReason }}</div>
                </td>
                <td>
                  <a [routerLink]="['/policies', p.policyId]" class="link-cell">{{ p.policyNumber }}</a>
                  <div class="cell-secondary">{{ p.vehicleRegistrationNumber }}</div>
                </td>
                <td class="cell-secondary">{{ p.customerName || '—' }}</td>
                <td>
                  <span *ngIf="p.allocations && p.allocations.length > 0; else unallocated" class="allocation-badge">
                    Inst #{{ p.allocations[0].installmentNumber || '—' }} ({{ p.allocations[0].allocatedAmount | number:'1.2-2' }})
                  </span>
                  <ng-template #unallocated>
                    <span class="cell-secondary">Policy general</span>
                  </ng-template>
                </td>
                <td class="td-num">
                  <strong [style.color]="p.status === 'SUCCESS' ? 'var(--color-text)' : '#94a3b8'" class="amount">
                    {{ p.amount | number:'1.2-2' }}
                  </strong>
                </td>
                <td><span class="badge badge-simulated">{{ p.paymentMethod }}</span></td>
                <td class="cell-secondary" style="white-space: nowrap;">{{ p.paymentDate | date:'mediumDate' }}</td>
                <td>
                  <span *ngIf="p.status === 'SUCCESS'" class="badge-dot badge-issued">SUCCESS</span>
                  <span *ngIf="p.status === 'VOIDED'" class="badge-dot badge-cancelled">VOIDED</span>
                  <div *ngIf="p.voidStatus === 'PENDING_APPROVAL'" class="maker-checker-tag">
                    Pending 2nd Sign-off (&gt;$2.5k)
                  </div>
                </td>
                <td>
                  <div class="row-actions">
                    <button class="btn btn-xs btn-secondary" (click)="viewReceipt(p)" title="View & Print Official Receipt">
                      Receipt
                    </button>
                    <button
                      *ngIf="p.status === 'SUCCESS' && p.voidStatus !== 'PENDING_APPROVAL'"
                      class="btn btn-xs btn-outline-danger"
                      (click)="openVoidModal(p)"
                      title="Void transaction">
                      Void
                    </button>
                    <button
                      *ngIf="p.voidStatus === 'PENDING_APPROVAL'"
                      class="btn btn-xs btn-primary"
                      (click)="approveVoid(p)"
                      title="Manager dual sign-off">
                      Approve Void
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredPayments.length === 0">
                <td colspan="9"><div class="empty-state" style="padding: 1.5rem;"><p>No transactions match filter.</p></div></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div *ngIf="filteredPayments.length > pageSize" class="table-pagination-bar">
          <span class="pagination-info">
            Showing <strong>{{ startIndex }}–{{ endIndex }}</strong> of <strong>{{ filteredPayments.length }}</strong> transactions
          </span>
          <div class="pagination-controls">
            <span class="pagination-page-indicator">Page {{ currentPage }} of {{ totalPages }}</span>
            <div class="pagination-nav-buttons">
              <button type="button" class="btn-pagination" [disabled]="currentPage === 1" (click)="prevPage()">Prev</button>
              <button type="button" class="btn-pagination" [disabled]="currentPage >= totalPages" (click)="nextPage()">Next</button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: BILLING SCHEDULES & OVERDUE -->
      <div *ngIf="activeTab === 'billing'" class="card no-print" style="padding: 0; margin-top: 1rem;">
        <div class="section-header">
          <div>
            <h3 class="section-title">Policy Premium Billing Schedules</h3>
            <p class="section-desc">Track installment debits, grace periods, and overdue arrears across all issued policies</p>
          </div>
          <div class="schedule-filters">
            <button class="filter-chip" [class.active]="scheduleFilter === 'ALL'" (click)="setScheduleFilter('ALL')">
              All Schedules ({{ billingSchedules.length }})
            </button>
            <button class="filter-chip" [class.active]="scheduleFilter === 'OVERDUE'" (click)="setScheduleFilter('OVERDUE')">
              Overdue / Lapsed ({{ overdueSchedules.length }})
            </button>
            <button class="filter-chip" [class.active]="scheduleFilter === 'PENDING'" (click)="setScheduleFilter('PENDING')">
              Pending / Partial
            </button>
          </div>
        </div>

        <div class="table-responsive" style="border: none;">
          <table class="data-table" aria-label="Billing Schedules">
            <thead>
              <tr>
                <th>Schedule ID</th>
                <th>Policy &amp; Customer</th>
                <th>Installment</th>
                <th>Due Date</th>
                <th class="th-num">Amount Due</th>
                <th class="th-num">Paid</th>
                <th class="th-num">Balance</th>
                <th>Grace Period</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of displayedSchedules">
                <td><code class="ref-code">SCH-{{ s.id }}</code></td>
                <td>
                  <a [routerLink]="['/policies', s.policyId]" class="link-cell">{{ s.policyNumber }}</a>
                  <div class="cell-secondary">{{ s.customerName || 'Policyholder' }}</div>
                </td>
                <td>
                  <span class="inst-pill">#{{ s.installmentNumber }} of {{ s.totalInstallments }}</span>
                </td>
                <td style="white-space: nowrap;">
                  <span [style.color]="isOverdueDate(s.dueDate) && s.balance > 0 ? 'var(--color-danger)' : 'inherit'">
                    {{ s.dueDate | date:'mediumDate' }}
                  </span>
                </td>
                <td class="td-num amount">{{ s.amountDue | number:'1.2-2' }}</td>
                <td class="td-num amount" style="color: var(--color-success);">{{ s.amountPaid | number:'1.2-2' }}</td>
                <td class="td-num amount" [style.color]="s.balance > 0 ? 'var(--color-danger)' : '#64748b'">
                  <strong>{{ s.balance | number:'1.2-2' }}</strong>
                </td>
                <td class="cell-secondary">{{ s.gracePeriodDays }} days</td>
                <td>
                  <span *ngIf="s.status === 'PAID'" class="badge-dot badge-issued">PAID</span>
                  <span *ngIf="s.status === 'PARTIALLY_PAID'" class="badge-dot badge-under_review">PARTIAL</span>
                  <span *ngIf="s.status === 'PENDING'" class="badge-dot badge-quoted">PENDING</span>
                  <span *ngIf="s.status === 'OVERDUE' || s.status === 'LAPSED'" class="badge-dot badge-cancelled">{{ s.status }}</span>
                </td>
                <td>
                  <button
                    *ngIf="s.balance > 0"
                    class="btn btn-xs btn-primary"
                    (click)="collectInstallment(s)"
                    title="Record collection against this installment">
                    Collect
                  </button>
                  <span *ngIf="s.balance <= 0" class="cell-secondary">Settled</span>
                </td>
              </tr>
              <tr *ngIf="displayedSchedules.length === 0">
                <td colspan="10"><div class="empty-state" style="padding: 1.5rem;"><p>No billing schedules found.</p></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: CLAIMS DISBURSEMENT DESK (Segregation of Duties) -->
      <div *ngIf="activeTab === 'disbursements'" class="card no-print" style="padding: 0; margin-top: 1rem;">
        <div class="section-header">
          <div>
            <h3 class="section-title">Claims Payout &amp; Settlement Disbursement</h3>
            <p class="section-desc">Segregation of Duties: Claims Officer Sarah Chen approves loss vouchers; Marcus Vance executes electronic disbursement.</p>
          </div>
          <button class="btn btn-sm btn-secondary" (click)="loadPendingDisbursements()">
            Refresh Queue
          </button>
        </div>

        <div class="segregation-banner">
          <div class="seg-icon">🛡️</div>
          <div>
            <strong>Internal Control Active:</strong> Adjusters assess and approve claims up to their authority limit. Only the Finance Desk holds disbursement rights to issue wire, mobile money, or cheque payouts and close settlement vouchers.
          </div>
        </div>

        <div class="table-responsive" style="border: none;">
          <table class="data-table" aria-label="Claims Payout Desk">
            <thead>
              <tr>
                <th>Claim #</th>
                <th>Claimant</th>
                <th class="th-num">Approved Amount</th>
                <th>Disbursed Amount</th>
                <th>Method</th>
                <th>Tx Reference</th>
                <th>Disbursed By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let dp of pendingDisbursements">
                <td>
                  <a [routerLink]="['/claims', dp.claimId]" class="link-cell">{{ dp.claimNumber }}</a>
                  <div *ngIf="dp.notes" class="cell-secondary">{{ dp.notes }}</div>
                </td>
                <td class="cell-secondary">{{ dp.claimantName }}</td>
                <td class="td-num amount">
                  <strong>{{ dp.approvedAmount | number:'1.2-2' }}</strong>
                </td>
                <td class="td-num amount">
                  <span *ngIf="dp.disbursedAmount">{{ dp.disbursedAmount | number:'1.2-2' }}</span>
                  <span *ngIf="!dp.disbursedAmount" class="cell-secondary">—</span>
                </td>
                <td>
                  <span class="badge badge-simulated">{{ dp.payoutMethod || 'WIRE / BANK' }}</span>
                </td>
                <td>
                  <code *ngIf="dp.transactionReference" class="ref-code">{{ dp.transactionReference }}</code>
                  <span *ngIf="!dp.transactionReference" class="cell-secondary">Pending issuance</span>
                </td>
                <td class="cell-secondary">{{ dp.disbursedBy || 'Unassigned' }}</td>
                <td>
                  <span *ngIf="dp.status === 'DISBURSED'" class="badge-dot badge-issued">DISBURSED</span>
                  <span *ngIf="dp.status !== 'DISBURSED'" class="badge-dot badge-under_review">APPROVED / PENDING WIRE</span>
                </td>
                <td>
                  <div class="row-actions">
                    <button
                      *ngIf="dp.status !== 'DISBURSED'"
                      class="btn btn-xs btn-primary"
                      (click)="openDisburseModal(dp)">
                      Disburse Funds
                    </button>
                    <button
                      *ngIf="dp.status === 'DISBURSED'"
                      class="btn btn-xs btn-secondary"
                      (click)="viewDisbursementVoucher(dp)">
                      Voucher
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="pendingDisbursements.length === 0">
                <td colspan="9">
                  <div class="empty-state" style="padding: 2rem;">
                    <p>No claims currently awaiting disbursement. Claims approved by Adjusters will automatically route here.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 4: RECONCILIATION & FINANCIAL REPORTS -->
      <div *ngIf="activeTab === 'reconciliation'" class="card no-print" style="margin-top: 1rem;">
        <div class="section-header" style="border: none; padding: 0 0 1rem 0;">
          <div>
            <h3 class="section-title">Financial Audit &amp; Balance Reconciliation</h3>
            <p class="section-desc">Balance sheet controls and portfolio cashflow reconciliation</p>
          </div>
          <button class="btn btn-secondary" (click)="exportReconciliationSummary()">
            Export Reconciliation (CSV)
          </button>
        </div>

        <div class="recon-grid">
          <div class="recon-card">
            <h4>Gross Underwriting Debits</h4>
            <div class="recon-val">{{ summary?.totalPremium | number:'1.2-2' }}</div>
            <p>Total premium booked on all active/issued policies.</p>
          </div>
          <div class="recon-card success">
            <h4>Total Settled Receipts</h4>
            <div class="recon-val">{{ summary?.totalPaid | number:'1.2-2' }}</div>
            <p>Cash and electronic collections verified in ledger.</p>
          </div>
          <div class="recon-card warning">
            <h4>Outstanding Premium Receivable</h4>
            <div class="recon-val">{{ summary?.totalOutstanding | number:'1.2-2' }}</div>
            <p>Pending installment balances across all policyholders.</p>
          </div>
          <div class="recon-card info">
            <h4>Claims Incurred &amp; Paid</h4>
            <div class="recon-val">{{ totalSettledClaimsAmount | number:'1.2-2' }}</div>
            <p>Total loss payouts disbursed by finance.</p>
          </div>
        </div>

        <div class="recon-table-box" style="margin-top: 1.5rem;">
          <h4 style="margin-bottom: 0.75rem; font-size: 0.95rem;">Aging of Installment Receivables</h4>
          <table class="data-table">
            <thead>
              <tr>
                <th>Bucket</th>
                <th>Schedules Count</th>
                <th>Outstanding Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Current &amp; Grace Period (&lt; 15 days)</td>
                <td>{{ pendingSchedulesCount }}</td>
                <td class="amount">{{ pendingSchedulesBalance | number:'1.2-2' }}</td>
                <td><span class="badge-dot badge-issued">Good Standing</span></td>
              </tr>
              <tr>
                <td>Overdue Arrears (&gt; 15 days past due)</td>
                <td>{{ overdueSchedules.length }}</td>
                <td class="amount" style="color: var(--color-danger);">{{ overdueSchedulesBalance | number:'1.2-2' }}</td>
                <td><span class="badge-dot badge-cancelled">Collection Follow-up</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL: RECORD PAYMENT -->
      <div *ngIf="showPaymentModal" class="modal-backdrop no-print" role="dialog" aria-modal="true">
        <div class="modal-dialog" style="max-width: 540px;">
          <div class="modal-header">
            <h3>Record Premium Collection</h3>
            <button type="button" class="modal-close-btn" (click)="closePaymentModal()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger">{{ modalError }}</div>

            <div class="form-group">
              <label class="form-label">Select Issued Policy *</label>
              <select
                class="form-control"
                [(ngModel)]="paymentForm.policyId"
                (change)="onPolicySelected()"
                name="policyId">
                <option [ngValue]="null">-- Select Policy --</option>
                <option *ngFor="let pol of issuedPolicies" [ngValue]="pol.id">
                  {{ pol.policyNumber }} — {{ pol.customerName }} (Bal: {{ pol.outstandingBalance | number:'1.2-2' }})
                </option>
              </select>
            </div>

            <div *ngIf="policySchedules.length > 0" class="form-group">
              <label class="form-label">Allocate to Specific Installment (Optional)</label>
              <select
                class="form-control"
                [(ngModel)]="paymentForm.billingScheduleId"
                (change)="onScheduleSelected()"
                name="scheduleId">
                <option [ngValue]="undefined">Auto-allocate / FIFO installment</option>
                <option *ngFor="let s of policySchedules" [ngValue]="s.id">
                  Inst #{{ s.installmentNumber }} (Due: {{ s.dueDate }}, Bal: {{ s.balance | number:'1.2-2' }})
                </option>
              </select>
            </div>

            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  class="form-control"
                  [(ngModel)]="paymentForm.amount"
                  placeholder="0.00"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Payment Method *</label>
                <select class="form-control" [(ngModel)]="paymentForm.paymentMethod">
                  <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
                  <option value="MOBILE_MONEY">Mobile Money (Telebirr/M-Pesa)</option>
                  <option value="CASH">Cash Deposit</option>
                  <option value="CARD">Debit / Credit Card</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Transaction Reference *</label>
              <input
                type="text"
                class="form-control font-mono"
                [(ngModel)]="paymentForm.transactionReference"
                placeholder="TXN-2026-..."
              />
            </div>

            <div class="form-group">
              <label class="form-label">Memo / Teller Note</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="paymentForm.note"
                placeholder="e.g. Branch teller receipt #4021"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closePaymentModal()" [disabled]="submittingPayment">Cancel</button>
            <button
              class="btn btn-primary"
              (click)="submitPayment()"
              [disabled]="submittingPayment || !paymentForm.policyId || !paymentForm.amount || !paymentForm.transactionReference">
              <span *ngIf="submittingPayment" class="spinner" style="width: 14px; height: 14px;"></span>
              Confirm &amp; Issue Receipt
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: VOID TRANSACTION WITH MAKER-CHECKER -->
      <div *ngIf="showVoidModal" class="modal-backdrop no-print" role="dialog" aria-modal="true">
        <div class="modal-dialog" style="max-width: 500px;">
          <div class="modal-header">
            <h3>Void Payment Transaction</h3>
            <button type="button" class="modal-close-btn" (click)="closeVoidModal()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="voidModalError" class="alert alert-danger">{{ voidModalError }}</div>

            <div class="alert alert-danger">
              <strong>Caution:</strong> Voiding <code>{{ paymentToVoid?.transactionReference }}</code>
              for <strong>{{ paymentToVoid?.amount | number:'1.2-2' }}</strong> will revert the billing schedule installment balances and restore receivables.
            </div>

            <div *ngIf="paymentToVoid && paymentToVoid.amount > 2500" class="maker-checker-box">
              <div class="mc-icon">⚖️</div>
              <div>
                <strong>Maker-Checker Rule (&gt; $2,500):</strong>
                This transaction exceeds the single-sign-off limit. Void requires a Senior Finance Checker co-signature to complete.
              </div>
            </div>

            <div class="form-group" style="margin-top: 1rem;">
              <label class="form-label">Mandatory Void Reason *</label>
              <textarea
                class="form-control"
                rows="3"
                placeholder="e.g. Disputed chargeback, erroneous duplicate entry, bank NSF return..."
                [(ngModel)]="voidForm.voidReason"
              ></textarea>
            </div>

            <div *ngIf="paymentToVoid && paymentToVoid.amount > 2500" class="form-group">
              <label class="form-label">Senior Checker Username (Co-Signer) *</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="voidForm.checkerUsername"
                placeholder="e.g. elena.manager"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeVoidModal()" [disabled]="submittingVoid">Cancel</button>
            <button
              class="btn btn-danger"
              (click)="submitVoid()"
              [disabled]="submittingVoid || !voidForm.voidReason.trim()">
              <span *ngIf="submittingVoid" class="spinner" style="width: 14px; height: 14px;"></span>
              Submit Void
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: DISBURSE CLAIM PAYOUT -->
      <div *ngIf="showDisburseModal" class="modal-backdrop no-print" role="dialog" aria-modal="true">
        <div class="modal-dialog" style="max-width: 520px;">
          <div class="modal-header">
            <h3>Disburse Claim Settlement</h3>
            <button type="button" class="modal-close-btn" (click)="closeDisburseModal()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="disburseModalError" class="alert alert-danger">{{ disburseModalError }}</div>

            <div class="segregation-callout">
              <div><strong>Claim #:</strong> {{ claimToDisburse?.claimNumber }}</div>
              <div><strong>Claimant:</strong> {{ claimToDisburse?.claimantName }}</div>
              <div><strong>Approved Loss Voucher:</strong> {{ claimToDisburse?.approvedAmount | number:'1.2-2' }}</div>
            </div>

            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
              <div class="form-group">
                <label class="form-label">Disbursement Amount ($) *</label>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="disburseForm.amount"
                  step="0.01"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Payout Method *</label>
                <select class="form-control" [(ngModel)]="disburseForm.payoutMethod">
                  <option value="BANK_TRANSFER">Bank Electronic Wire</option>
                  <option value="MOBILE_MONEY">Mobile Money Transfer</option>
                  <option value="CHEQUE">Banker's Cheque</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Wire / Transaction Reference *</label>
              <input
                type="text"
                class="form-control font-mono"
                [(ngModel)]="disburseForm.transactionReference"
                placeholder="DISB-WIRE-2026-..."
              />
            </div>

            <div class="form-group">
              <label class="form-label">Finance Disbursement Notes</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="disburseForm.notes"
                placeholder="e.g. Processed via Swift MT103"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeDisburseModal()" [disabled]="submittingDisbursement">Cancel</button>
            <button
              class="btn btn-primary"
              (click)="submitDisbursement()"
              [disabled]="submittingDisbursement || !disburseForm.amount || !disburseForm.transactionReference">
              <span *ngIf="submittingDisbursement" class="spinner" style="width: 14px; height: 14px;"></span>
              Execute Wire &amp; Close Claim
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: OFFICIAL RECEIPT VOUCHER -->
      <div *ngIf="selectedReceipt" class="modal-backdrop no-print" role="dialog" aria-modal="true">
        <div class="modal-dialog" style="max-width: 580px;">
          <div class="modal-header">
            <h3>Official Payment Receipt</h3>
            <button type="button" class="modal-close-btn" (click)="closeReceipt()">✕</button>
          </div>
          <div class="modal-body">
            <div class="receipt-card">
              <div class="receipt-watermark">RECEIPT</div>
              <div class="receipt-header">
                <div>
                  <div class="receipt-title">OFFICIAL RECEIPT</div>
                  <div class="receipt-subtitle">Motor Insurance Premium Collection</div>
                </div>
                <div style="text-align: right;">
                  <div class="receipt-ref">{{ selectedReceipt.transactionReference }}</div>
                  <span [ngClass]="selectedReceipt.status === 'SUCCESS' ? 'badge badge-success' : 'badge badge-cancelled'">
                    {{ selectedReceipt.status }}
                  </span>
                </div>
              </div>

              <div class="receipt-grid">
                <div>
                  <div class="receipt-field-label">Policyholder</div>
                  <div class="receipt-field-value">{{ selectedReceipt.customerName || 'Insured Client' }}</div>
                </div>
                <div>
                  <div class="receipt-field-label">Policy Number</div>
                  <div class="receipt-field-value font-mono">{{ selectedReceipt.policyNumber }}</div>
                </div>
                <div>
                  <div class="receipt-field-label">Vehicle Registration</div>
                  <div class="receipt-field-value font-mono">{{ selectedReceipt.vehicleRegistrationNumber || 'Fleet Unit' }}</div>
                </div>
                <div>
                  <div class="receipt-field-label">Payment Channel</div>
                  <div class="receipt-field-value">{{ selectedReceipt.paymentMethod }}</div>
                </div>
              </div>

              <div class="receipt-amount-box">
                <div class="receipt-amount-label">Amount Received</div>
                <div class="receipt-amount-value">{{ selectedReceipt.amount | number:'1.2-2' }}</div>
                <div *ngIf="selectedReceipt.note" class="receipt-amount-note">{{ selectedReceipt.note }}</div>
              </div>

              <div *ngIf="selectedReceipt.status === 'VOIDED'" class="receipt-void-notice">
                <strong>VOID AUDIT RECORD:</strong> {{ selectedReceipt.voidReason }}
                <div style="font-size: 0.75rem; margin-top: 2px;">
                  Voided at {{ selectedReceipt.voidedAt | date:'medium' }}
                </div>
              </div>

              <div class="receipt-footer">
                <span>Date: {{ selectedReceipt.paymentDate | date:'medium' }}</span>
                <span>Authorized Officer: Marcus Vance (Finance)</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeReceipt()">Close</button>
            <button class="btn btn-primary" (click)="printReceipt()">
              Print Receipt
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .role-badge-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .role-tag { font-size: 0.725rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
    .role-tag-finance { color: #059669; background: #ecfdf5; }
    .header-actions { display: flex; align-items: center; gap: 0.75rem; }

    .desk-tabs { display: flex; gap: 0.5rem; margin-top: 1.25rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem; }
    .desk-tab { display: inline-flex; align-items: center; gap: 6px; background: transparent; border: none; padding: 0.625rem 1rem; font-size: 0.8375rem; font-weight: 500; color: #64748b; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.15s; }
    .desk-tab:hover { color: #0f172a; }
    .desk-tab.active { color: #059669; border-bottom-color: #059669; font-weight: 600; }
    .tab-count-badge { font-size: 0.7rem; padding: 1px 6px; border-radius: 10px; margin-left: 4px; }
    .tab-count-badge.warning { background: #fef3c7; color: #92400e; }
    .tab-count-badge.info { background: #e0f2fe; color: #0369a1; }

    .section-header { padding: 0.875rem 1.25rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
    .section-title { font-size: 0.95rem; font-weight: 600; color: #0f172a; margin: 0; }
    .section-desc { font-size: 0.75rem; color: #64748b; margin: 2px 0 0; }
    .header-right-tools { display: flex; align-items: center; gap: 0.75rem; }

    .search-field-inline { display: flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0 10px; height: 34px; }
    .search-field-inline svg { color: #94a3b8; flex-shrink: 0; }
    .search-field-inline input { border: none; background: transparent; outline: none; font-size: 0.8125rem; color: #0f172a; font-family: inherit; width: 190px; }

    .schedule-filters { display: flex; gap: 0.5rem; }
    .filter-chip { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 10px; font-size: 0.75rem; font-weight: 500; color: #475569; cursor: pointer; }
    .filter-chip.active { background: #ecfdf5; border-color: #a7f3d0; color: #059669; font-weight: 600; }

    .ref-code { font-family: 'Fira Code', ui-monospace, monospace; font-size: 0.75rem; color: #334155; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
    .void-note { font-size: 0.7rem; color: var(--color-danger); margin-top: 2px; }
    .cell-secondary { font-size: 0.775rem; color: #64748b; }
    .link-cell { font-size: 0.8375rem; font-weight: 500; color: #4f46e5; text-decoration: none; }
    .link-cell:hover { text-decoration: underline; }
    .amount { font-variant-numeric: tabular-nums; }
    .inst-pill { font-size: 0.725rem; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; color: #334155; }
    .allocation-badge { font-size: 0.7rem; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .maker-checker-tag { font-size: 0.675rem; font-weight: 700; color: #b45309; background: #fffbeb; border: 1px solid #fde68a; padding: 2px 5px; border-radius: 4px; margin-top: 2px; display: inline-block; }

    .segregation-banner { display: flex; align-items: center; gap: 0.75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem 1rem; margin: 0.75rem 1.25rem 0.25rem 1.25rem; font-size: 0.8125rem; color: #334155; }
    .seg-icon { font-size: 1.25rem; }
    .segregation-callout { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.75rem; font-size: 0.8125rem; color: #334155; display: flex; flex-direction: column; gap: 4px; }
    .maker-checker-box { display: flex; align-items: center; gap: 0.75rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 0.75rem; font-size: 0.8rem; color: #92400e; }
    .mc-icon { font-size: 1.25rem; }

    .recon-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
    .recon-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; }
    .recon-card.success { border-left: 4px solid #10b981; }
    .recon-card.warning { border-left: 4px solid #f59e0b; }
    .recon-card.info { border-left: 4px solid #0284c7; }
    .recon-card h4 { margin: 0 0 0.5rem 0; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; }
    .recon-val { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .recon-card p { margin: 0; font-size: 0.75rem; color: #64748b; }

    .receipt-card { background: #ffffff; border: 2px solid #0f172a; border-radius: 8px; padding: 1.5rem; position: relative; overflow: hidden; }
    .receipt-watermark { position: absolute; right: 10px; top: 10px; font-size: 4rem; font-weight: 900; color: rgba(15, 23, 42, 0.04); pointer-events: none; }
    .receipt-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 0.75rem; margin-bottom: 1rem; }
    .receipt-title { font-size: 1.15rem; font-weight: 800; color: #0f172a; }
    .receipt-subtitle { font-size: 0.75rem; color: #64748b; }
    .receipt-ref { font-family: monospace; font-weight: 700; font-size: 0.875rem; }
    .receipt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; margin-bottom: 1rem; }
    .receipt-field-label { font-size: 0.7rem; text-transform: uppercase; color: #64748b; }
    .receipt-field-value { font-size: 0.875rem; font-weight: 600; color: #0f172a; }
    .receipt-amount-box { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 1rem; text-align: center; margin-bottom: 1rem; }
    .receipt-amount-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; }
    .receipt-amount-value { font-size: 1.75rem; font-weight: 800; color: #059669; }
    .receipt-amount-note { font-size: 0.75rem; color: #64748b; margin-top: 4px; }
    .receipt-void-notice { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-bottom: 1rem; }
    .receipt-footer { display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 0.75rem; }

    .btn-xs { padding: 3px 8px; font-size: 0.725rem; border-radius: 4px; }
    .btn-outline-danger { border: 1px solid #fca5a5; background: #fff; color: #dc2626; }
    .btn-outline-danger:hover { background: #fee2e2; }
    .row-actions { display: flex; gap: 4px; align-items: center; }
  `]
})
export class FinanceDashboardComponent implements OnInit {
  summary: DashboardSummary | null = null;
  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  billingSchedules: BillingSchedule[] = [];
  overdueSchedules: BillingSchedule[] = [];
  pendingDisbursements: ClaimPayout[] = [];
  issuedPolicies: Policy[] = [];

  activeTab: 'collections' | 'billing' | 'disbursements' | 'reconciliation' = 'collections';
  searchQuery = '';
  scheduleFilter: 'ALL' | 'OVERDUE' | 'PENDING' = 'ALL';
  voidedCount = 0;

  pageSize = 6;
  currentPage = 1;

  // Feedback messages
  errorMessage = '';
  successMessage = '';

  // Modals state
  showPaymentModal = false;
  submittingPayment = false;
  modalError = '';
  paymentForm: {
    policyId: number | null;
    billingScheduleId?: number;
    amount: number | null;
    paymentMethod: string;
    transactionReference: string;
    note: string;
  } = {
    policyId: null,
    billingScheduleId: undefined,
    amount: null,
    paymentMethod: 'BANK_TRANSFER',
    transactionReference: '',
    note: ''
  };
  policySchedules: BillingSchedule[] = [];

  showVoidModal = false;
  submittingVoid = false;
  voidModalError = '';
  paymentToVoid: Payment | null = null;
  voidForm = {
    voidReason: '',
    checkerUsername: 'elena.manager'
  };

  showDisburseModal = false;
  submittingDisbursement = false;
  disburseModalError = '';
  claimToDisburse: ClaimPayout | null = null;
  disburseForm: {
    amount: number | null;
    payoutMethod: string;
    transactionReference: string;
    notes: string;
  } = {
    amount: null,
    payoutMethod: 'BANK_TRANSFER',
    transactionReference: '',
    notes: ''
  };

  selectedReceipt: Payment | null = null;

  constructor(
    private paymentService: PaymentService,
    private billingService: BillingService,
    private claimService: ClaimService,
    private dashboardService: DashboardService,
    private policyService: PolicyService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loadSummary();
    this.loadPayments();
    this.loadBillingSchedules();
    this.loadPendingDisbursements();
    this.loadPolicies();
  }

  loadSummary(): void {
    this.dashboardService.getSummary().subscribe({
      next: (res) => { this.summary = res; this.cdr.markForCheck(); }
    });
  }

  loadPayments(): void {
    this.paymentService.getAllPayments().subscribe({
      next: (list: Payment[]) => {
        this.payments = list;
        this.voidedCount = list.filter((p: Payment) => p.status === 'VOIDED').length;
        this.applyFilter();
        this.cdr.markForCheck();
      }
    });
  }

  loadBillingSchedules(): void {
    this.billingService.getAllSchedules().subscribe({
      next: (schedules: BillingSchedule[]) => {
        this.billingSchedules = schedules;
        this.overdueSchedules = schedules.filter(s => s.status === 'OVERDUE' || s.status === 'LAPSED' || (this.isOverdueDate(s.dueDate) && s.balance > 0));
        this.cdr.markForCheck();
      }
    });
  }

  loadPendingDisbursements(): void {
    this.claimService.getPendingDisbursements().subscribe({
      next: (payouts: ClaimPayout[]) => {
        this.pendingDisbursements = payouts;
        this.cdr.markForCheck();
      }
    });
  }

  loadPolicies(): void {
    this.policyService.getPolicies().subscribe({
      next: (policies: Policy[]) => {
        this.issuedPolicies = policies.filter(p => p.status === 'ISSUED');
        this.cdr.markForCheck();
      }
    });
  }

  setActiveTab(tab: 'collections' | 'billing' | 'disbursements' | 'reconciliation'): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  setScheduleFilter(filter: 'ALL' | 'OVERDUE' | 'PENDING'): void {
    this.scheduleFilter = filter;
    this.cdr.markForCheck();
  }

  isOverdueDate(dueDate: string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  get displayedSchedules(): BillingSchedule[] {
    if (this.scheduleFilter === 'OVERDUE') {
      return this.overdueSchedules;
    }
    if (this.scheduleFilter === 'PENDING') {
      return this.billingSchedules.filter(s => s.balance > 0 && s.status !== 'OVERDUE');
    }
    return this.billingSchedules;
  }

  get totalPendingDisbursementAmount(): number {
    return this.pendingDisbursements
      .filter(p => p.status !== 'DISBURSED')
      .reduce((sum, p) => sum + (p.approvedAmount || 0), 0);
  }

  get totalSettledClaimsAmount(): number {
    return this.pendingDisbursements
      .filter(p => p.status === 'DISBURSED')
      .reduce((sum, p) => sum + (p.disbursedAmount || 0), 0);
  }

  get pendingSchedulesCount(): number {
    return this.billingSchedules.filter(s => s.balance > 0 && !this.isOverdueDate(s.dueDate)).length;
  }

  get pendingSchedulesBalance(): number {
    return this.billingSchedules
      .filter(s => s.balance > 0 && !this.isOverdueDate(s.dueDate))
      .reduce((sum, s) => sum + (s.balance || 0), 0);
  }

  get overdueSchedulesBalance(): number {
    return this.overdueSchedules.reduce((sum, s) => sum + (s.balance || 0), 0);
  }

  // --- Collections Pagination & Filter ---
  get totalPages(): number {
    return Math.ceil(this.filteredPayments.length / this.pageSize) || 1;
  }

  get startIndex(): number {
    if (this.filteredPayments.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredPayments.length);
  }

  get displayedPayments(): Payment[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredPayments.slice(start, start + this.pageSize);
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

  applyFilter(): void {
    if (!this.searchQuery.trim()) {
      this.filteredPayments = this.payments;
      this.currentPage = 1;
      this.cdr.markForCheck();
      return;
    }
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredPayments = this.payments.filter(p =>
      p.transactionReference.toLowerCase().includes(q) ||
      p.policyNumber.toLowerCase().includes(q) ||
      (p.customerName && p.customerName.toLowerCase().includes(q))
    );
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  // --- Payment Modal Actions ---
  openPaymentModal(): void {
    this.modalError = '';
    this.paymentForm = {
      policyId: this.issuedPolicies.length > 0 ? this.issuedPolicies[0].id : null,
      billingScheduleId: undefined,
      amount: null,
      paymentMethod: 'BANK_TRANSFER',
      transactionReference: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      note: ''
    };
    this.showPaymentModal = true;
    if (this.paymentForm.policyId) {
      this.onPolicySelected();
    }
    this.cdr.markForCheck();
  }

  collectInstallment(schedule: BillingSchedule): void {
    this.modalError = '';
    this.paymentForm = {
      policyId: schedule.policyId,
      billingScheduleId: schedule.id,
      amount: schedule.balance,
      paymentMethod: 'BANK_TRANSFER',
      transactionReference: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      note: `Settlement for Installment #${schedule.installmentNumber}`
    };
    this.policySchedules = [schedule];
    this.showPaymentModal = true;
    this.cdr.markForCheck();
  }

  onPolicySelected(): void {
    if (!this.paymentForm.policyId) {
      this.policySchedules = [];
      return;
    }
    this.billingService.getSchedulesByPolicy(this.paymentForm.policyId).subscribe({
      next: (schedules) => {
        this.policySchedules = schedules.filter(s => s.balance > 0);
        if (this.policySchedules.length > 0) {
          const firstPending = this.policySchedules[0];
          this.paymentForm.billingScheduleId = firstPending.id;
          this.paymentForm.amount = firstPending.balance;
        } else {
          const pol = this.issuedPolicies.find(p => p.id === this.paymentForm.policyId);
          if (pol) {
            this.paymentForm.amount = pol.outstandingBalance;
          }
        }
        this.cdr.markForCheck();
      }
    });
  }

  onScheduleSelected(): void {
    if (this.paymentForm.billingScheduleId) {
      const sch = this.policySchedules.find(s => s.id === this.paymentForm.billingScheduleId);
      if (sch) {
        this.paymentForm.amount = sch.balance;
      }
    }
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.modalError = '';
    this.cdr.markForCheck();
  }

  submitPayment(): void {
    if (!this.paymentForm.policyId || !this.paymentForm.amount || !this.paymentForm.transactionReference) {
      this.modalError = 'Please fill out all required payment fields.';
      return;
    }

    this.submittingPayment = true;
    this.modalError = '';

    const req: PaymentCreateRequest = {
      amount: this.paymentForm.amount,
      transactionReference: this.paymentForm.transactionReference,
      paymentMethod: this.paymentForm.paymentMethod,
      note: this.paymentForm.note,
      billingScheduleId: this.paymentForm.billingScheduleId
    };

    this.paymentService.recordPayment(this.paymentForm.policyId, req).subscribe({
      next: (created: Payment) => {
        this.submittingPayment = false;
        this.showPaymentModal = false;
        this.successMessage = `Payment ${created.transactionReference} of ${created.amount} recorded successfully.`;
        this.loadData();
        this.viewReceipt(created);
        setTimeout(() => { this.successMessage = ''; this.cdr.markForCheck(); }, 5000);
      },
      error: (err) => {
        this.submittingPayment = false;
        this.modalError = err.error?.message || 'Failed to record payment. Please check details.';
        this.cdr.markForCheck();
      }
    });
  }

  // --- Void Modal Actions ---
  openVoidModal(payment: Payment): void {
    this.paymentToVoid = payment;
    this.voidModalError = '';
    this.voidForm = {
      voidReason: '',
      checkerUsername: 'elena.manager'
    };
    this.showVoidModal = true;
    this.cdr.markForCheck();
  }

  closeVoidModal(): void {
    this.showVoidModal = false;
    this.paymentToVoid = null;
    this.voidModalError = '';
    this.cdr.markForCheck();
  }

  submitVoid(): void {
    if (!this.paymentToVoid || !this.voidForm.voidReason.trim()) return;

    this.submittingVoid = true;
    this.voidModalError = '';

    const req: PaymentVoidRequest = {
      voidReason: this.voidForm.voidReason.trim(),
      checkerUsername: this.paymentToVoid.amount > 2500 ? this.voidForm.checkerUsername : undefined
    };

    this.paymentService.voidPayment(this.paymentToVoid.id, req).subscribe({
      next: (voided: Payment) => {
        this.submittingVoid = false;
        this.showVoidModal = false;
        if (voided.voidStatus === 'PENDING_APPROVAL') {
          this.successMessage = `Payment void submitted for dual approval (> $2,500). Pending Senior Checker sign-off.`;
        } else {
          this.successMessage = `Payment ${voided.transactionReference} has been voided and ledger restored.`;
        }
        this.loadData();
        setTimeout(() => { this.successMessage = ''; this.cdr.markForCheck(); }, 5000);
      },
      error: (err) => {
        this.submittingVoid = false;
        this.voidModalError = err.error?.message || 'Failed to void transaction.';
        this.cdr.markForCheck();
      }
    });
  }

  approveVoid(payment: Payment): void {
    if (!confirm(`Confirm Maker-Checker Approval to void transaction ${payment.transactionReference} for ${payment.amount}?`)) return;

    this.paymentService.approveVoid(payment.id, 'elena.manager').subscribe({
      next: () => {
        this.successMessage = `Void approved by Manager for ${payment.transactionReference}. Ledger successfully restored.`;
        this.loadData();
        setTimeout(() => { this.successMessage = ''; this.cdr.markForCheck(); }, 5000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to approve void.';
        setTimeout(() => { this.errorMessage = ''; this.cdr.markForCheck(); }, 5000);
      }
    });
  }

  // --- Disbursement Modal Actions ---
  openDisburseModal(payout: ClaimPayout): void {
    this.claimToDisburse = payout;
    this.disburseModalError = '';
    this.disburseForm = {
      amount: payout.approvedAmount,
      payoutMethod: 'BANK_TRANSFER',
      transactionReference: 'DISB-WIRE-' + Math.floor(100000 + Math.random() * 900000),
      notes: 'Full settlement payout wire'
    };
    this.showDisburseModal = true;
    this.cdr.markForCheck();
  }

  closeDisburseModal(): void {
    this.showDisburseModal = false;
    this.claimToDisburse = null;
    this.disburseModalError = '';
    this.cdr.markForCheck();
  }

  submitDisbursement(): void {
    if (!this.claimToDisburse || !this.disburseForm.amount || !this.disburseForm.transactionReference) {
      this.disburseModalError = 'Please fill out all required disbursement fields.';
      return;
    }

    this.submittingDisbursement = true;
    this.disburseModalError = '';

    const req: ClaimDisbursementRequest = {
      amount: this.disburseForm.amount,
      payoutMethod: this.disburseForm.payoutMethod,
      transactionReference: this.disburseForm.transactionReference,
      idempotencyKey: 'IDEMP-' + this.claimToDisburse.claimId + '-' + Date.now(),
      notes: this.disburseForm.notes
    };

    this.claimService.disburseClaim(this.claimToDisburse.claimId, req, 'marcus.finance').subscribe({
      next: (disbursed: ClaimPayout) => {
        this.submittingDisbursement = false;
        this.showDisburseModal = false;
        this.successMessage = `Claim ${this.claimToDisburse?.claimNumber} disbursed (${disbursed.disbursedAmount}) via ${disbursed.payoutMethod}. Voucher reference: ${disbursed.transactionReference}.`;
        this.loadData();
        setTimeout(() => { this.successMessage = ''; this.cdr.markForCheck(); }, 5000);
      },
      error: (err) => {
        this.submittingDisbursement = false;
        this.disburseModalError = err.error?.message || 'Failed to disburse claim payout.';
        this.cdr.markForCheck();
      }
    });
  }

  viewDisbursementVoucher(dp: ClaimPayout): void {
    alert(`CLAIM DISBURSEMENT VOUCHER\n` +
      `---------------------------------\n` +
      `Claim Number: ${dp.claimNumber}\n` +
      `Claimant: ${dp.claimantName}\n` +
      `Disbursed Amount: $${dp.disbursedAmount}\n` +
      `Method: ${dp.payoutMethod}\n` +
      `Wire Reference: ${dp.transactionReference}\n` +
      `Disbursed By: ${dp.disbursedBy}\n` +
      `Timestamp: ${dp.disbursedAt}\n` +
      `Status: ${dp.status}`
    );
  }

  // --- Official Receipt Actions ---
  viewReceipt(p: Payment): void {
    this.selectedReceipt = p;
    this.cdr.markForCheck();
  }

  closeReceipt(): void {
    this.selectedReceipt = null;
    this.cdr.markForCheck();
  }

  printReceipt(): void {
    window.print();
  }

  // --- Export Report ---
  exportReconciliationSummary(): void {
    const csvContent =
      'Category,Amount\n' +
      `Gross Underwriting Premium,${this.summary?.totalPremium || 0}\n` +
      `Settled Collections,${this.summary?.totalPaid || 0}\n` +
      `Outstanding Receivables,${this.summary?.totalOutstanding || 0}\n` +
      `Claims Settled & Disbursed,${this.totalSettledClaimsAmount || 0}\n` +
      `Overdue Installment Arrears,${this.overdueSchedulesBalance}\n` +
      `Void Adjustments Count,${this.voidedCount}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reconciliation_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
