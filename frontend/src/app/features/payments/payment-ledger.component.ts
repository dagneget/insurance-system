import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { Payment, PaymentStatus, PaymentVoidRequest } from '../../core/models/payment.model';
import { ApiErrorResponse } from '../../core/models/api-error.model';

@Component({
  selector: 'app-payment-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">

      <!-- Page header -->
      <div class="page-header no-print">
        <div>
          <h1>Payment ledger &amp; receipts</h1>
          <p>Financial transaction ledger, receipt vouchers, and controlled voids.</p>
        </div>
        <button class="btn btn-secondary" (click)="exportToCsv()" [disabled]="payments.length === 0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
          </svg>
          Export CSV
        </button>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar no-print">
        <div class="search-input-group">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="search"
            placeholder="Search by ref, customer, plate, or policy #…"
            [(ngModel)]="searchQuery"
            (keyup.enter)="loadPayments()"
            aria-label="Search payments"
          />
        </div>
        <select class="form-control" style="width: 180px;" [(ngModel)]="statusFilter" (change)="loadPayments()" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="SUCCESS">Successful</option>
          <option value="VOIDED">Voided</option>
        </select>
        <button class="btn btn-secondary" (click)="loadPayments()">Filter</button>
        <button *ngIf="searchQuery || statusFilter" class="btn btn-ghost" (click)="resetFilters()">Clear</button>
      </div>

      <!-- Alerts -->
      <div *ngIf="errorMessage" class="alert alert-danger no-print" role="alert">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="alert alert-success no-print" role="status">{{ successMessage }}</div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-container no-print">
        <div class="spinner"></div>
        <p>Loading payment ledger…</p>
      </div>

      <!-- Table -->
      <div *ngIf="!loading" class="card table-card no-print" style="padding: 0;">

        <!-- Empty state -->
        <div *ngIf="payments.length === 0" class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
          </svg>
          <h3>No payment records found</h3>
          <p>No transaction matches the current search or filter query.</p>
        </div>

        <div *ngIf="payments.length > 0" class="table-responsive" style="border:none; border-radius:0;">
          <table class="data-table" aria-label="Payment ledger">
            <thead>
              <tr>
                <th>Transaction ref</th>
                <th>Policy</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th class="th-num">Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of displayedPayments">
                <td>
                  <code class="ref-code">{{ p.transactionReference }}</code>
                </td>
                <td>
                  <a [routerLink]="['/policies', p.policyId]" class="link-cell">{{ p.policyNumber }}</a>
                </td>
                <td class="cell-secondary">{{ p.customerName || '—' }}</td>
                <td class="cell-mono">{{ p.vehicleRegistrationNumber || '—' }}</td>
                <td class="td-num">
                  <strong
                    [style.color]="p.status === 'VOIDED' ? '#94a3b8' : 'var(--color-success)'"
                    [style.text-decoration]="p.status === 'VOIDED' ? 'line-through' : 'none'"
                    class="amount"
                  >{{ p.amount | number:'1.2-2' }}</strong>
                </td>
                <td>
                  <span class="badge badge-simulated">{{ p.paymentMethod }}</span>
                </td>
                <td class="cell-secondary" style="white-space: nowrap;">{{ p.paymentDate | date:'mediumDate' }}</td>
                <td>
                  <span [ngClass]="p.status === 'SUCCESS' ? 'badge badge-success' : 'badge badge-cancelled'">
                    {{ p.status }}
                  </span>
                  <div *ngIf="p.voidReason" style="font-size: 0.7rem; color: var(--color-danger); margin-top: 3px; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" [title]="p.voidReason">
                    {{ p.voidReason }}
                  </div>
                </td>
                <td>
                  <div style="display: flex; gap: 0.3rem;">
                    <button class="btn btn-sm btn-secondary" (click)="openReceipt(p)" aria-label="View receipt">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                        <rect width="6" height="4" x="9" y="3" rx="1"/>
                      </svg>
                      Receipt
                    </button>
                    <button
                      *ngIf="p.status === 'SUCCESS'"
                      class="btn btn-sm void-btn"
                      (click)="openVoidModal(p)"
                      aria-label="Void transaction"
                    >
                      Void
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination bar -->
        <div *ngIf="payments.length > pageSize" class="table-pagination-bar">
          <span class="pagination-info">
            Showing <strong>{{ startIndex }}–{{ endIndex }}</strong> of <strong>{{ payments.length }}</strong> transactions
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

      <!-- Receipt modal -->
      <div *ngIf="selectedReceipt" class="modal-backdrop no-print" role="dialog" aria-modal="true" aria-labelledby="modal-title-receipt">
        <div class="modal-dialog" style="max-width: 580px;">
          <div class="modal-header">
            <h3 id="modal-title-receipt">Payment receipt voucher</h3>
            <button type="button" class="modal-close-btn" (click)="closeReceipt()" aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="receipt-card">
              <div class="receipt-watermark" aria-hidden="true">RECEIPT</div>

              <!-- Receipt header -->
              <div class="receipt-header">
                <div>
                  <div class="receipt-title">OFFICIAL RECEIPT</div>
                  <div class="receipt-subtitle">Motor Premium Collection Voucher</div>
                </div>
                <div style="text-align: right;">
                  <div class="receipt-ref">{{ selectedReceipt.transactionReference }}</div>
                  <span [ngClass]="selectedReceipt.status === 'SUCCESS' ? 'badge badge-success' : 'badge badge-cancelled'">
                    {{ selectedReceipt.status }}
                  </span>
                </div>
              </div>

              <!-- Receipt fields -->
              <div class="receipt-grid">
                <div>
                  <div class="receipt-field-label">Policyholder</div>
                  <div class="receipt-field-value">{{ selectedReceipt.customerName }}</div>
                </div>
                <div>
                  <div class="receipt-field-label">Policy number</div>
                  <div class="receipt-field-value font-mono">{{ selectedReceipt.policyNumber }}</div>
                </div>
                <div>
                  <div class="receipt-field-label">Insured vehicle</div>
                  <div class="receipt-field-value font-mono">{{ selectedReceipt.vehicleRegistrationNumber }}</div>
                </div>
                <div>
                  <div class="receipt-field-label">Payment method</div>
                  <div class="receipt-field-value">{{ selectedReceipt.paymentMethod }}</div>
                </div>
              </div>

              <!-- Amount hero -->
              <div class="receipt-amount-box">
                <div class="receipt-amount-label">Amount received</div>
                <div class="receipt-amount-value">{{ selectedReceipt.amount | number:'1.2-2' }}</div>
                <div *ngIf="selectedReceipt.note" class="receipt-amount-note">{{ selectedReceipt.note }}</div>
              </div>

              <!-- Void notice -->
              <div *ngIf="selectedReceipt.status === 'VOIDED'" class="receipt-void-notice">
                <strong>TRANSACTION VOIDED:</strong> {{ selectedReceipt.voidReason }}
                <div style="font-size: 0.75rem; margin-top: 2px;">({{ selectedReceipt.voidedAt | date:'medium' }})</div>
              </div>

              <!-- Receipt footer -->
              <div class="receipt-footer">
                <span>Date: {{ selectedReceipt.paymentDate | date:'medium' }}</span>
                <span>Authorized Officer: Demonstration Agent</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeReceipt()">Close</button>
            <button class="btn btn-primary" (click)="printReceipt()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect width="12" height="8" x="6" y="14"/>
              </svg>
              Print receipt
            </button>
          </div>
        </div>
      </div>

      <!-- Printable receipt sheet -->
      <div *ngIf="selectedReceipt" class="print-only certificate-sheet">
        <div class="certificate-watermark">RECEIPT</div>
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 0.75rem; margin-bottom: 1rem;">
          <div>
            <h2 style="margin: 0; font-size: 1.5rem;">OFFICIAL RECEIPT</h2>
            <div style="font-size: 0.8rem; color: #64748b;">Motor Premium Collection Voucher</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; font-size: 1.1rem;">REF: {{ selectedReceipt.transactionReference }}</div>
            <div style="font-size: 0.85rem;">Status: {{ selectedReceipt.status }}</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1.5rem;">
          <div>
            <div style="color: #64748b; font-size: 0.8rem;">POLICYHOLDER</div>
            <div style="font-weight: 700; font-size: 1.1rem;">{{ selectedReceipt.customerName }}</div>
          </div>
          <div>
            <div style="color: #64748b; font-size: 0.8rem;">POLICY NUMBER</div>
            <div style="font-weight: 700; font-size: 1.1rem;">{{ selectedReceipt.policyNumber }}</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1.5rem;">
          <div>
            <div style="color: #64748b; font-size: 0.8rem;">INSURED VEHICLE</div>
            <div style="font-size: 1rem;">{{ selectedReceipt.vehicleRegistrationNumber }}</div>
          </div>
          <div>
            <div style="color: #64748b; font-size: 0.8rem;">PAYMENT METHOD</div>
            <div style="font-size: 1rem;">{{ selectedReceipt.paymentMethod }}</div>
          </div>
        </div>
        <div style="border: 2px solid #0f172a; border-radius: 8px; padding: 1.5rem; text-align: center; margin-bottom: 2rem;">
          <div style="font-size: 0.85rem; color: #64748b;">AMOUNT SETTLED</div>
          <div style="font-size: 2.25rem; font-weight: 900; color: #0f172a;">{{ selectedReceipt.amount | number:'1.2-2' }}</div>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 1rem; font-size: 0.8rem; color: #64748b;">
          <div>Date: {{ selectedReceipt.paymentDate | date:'medium' }}</div>
          <div>Signature: Demonstration Agent</div>
        </div>
      </div>

      <!-- Void modal -->
      <div *ngIf="showVoidModal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title-void">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 id="modal-title-void">Void payment transaction</h3>
            <button type="button" class="modal-close-btn" (click)="closeVoidModal()" aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div *ngIf="voidModalError" class="alert alert-danger" role="alert">{{ voidModalError }}</div>

            <div class="alert alert-danger">
              <strong>Caution:</strong> Voiding <code>{{ paymentToVoid?.transactionReference }}</code>
              ({{ paymentToVoid?.amount }}) will restore the uncollected balance on Policy <strong>{{ paymentToVoid?.policyNumber }}</strong>.
            </div>

            <form (ngSubmit)="submitVoid()" novalidate>
              <div class="form-group">
                <label class="form-label" for="void-reason">Reason for void / correction *</label>
                <textarea
                  id="void-reason"
                  class="form-control"
                  rows="3"
                  placeholder="e.g. Duplicated teller record, wrong allocation to policy…"
                  required
                  [(ngModel)]="voidReason"
                  name="voidReason"
                ></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeVoidModal()" [disabled]="submittingVoid">Cancel</button>
            <button
              class="btn btn-danger"
              (click)="submitVoid()"
              [disabled]="submittingVoid || !voidReason.trim()"
            >
              <span *ngIf="submittingVoid" class="spinner" style="width: 14px; height: 14px;" aria-hidden="true"></span>
              Confirm void
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .ref-code {
      font-family: 'Fira Code', 'Cascadia Code', ui-monospace, monospace;
      font-size: 0.775rem;
      color: #334155;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
    }

    .cell-secondary { font-size: 0.775rem; color: #64748b; }
    .cell-mono { font-variant-numeric: tabular-nums; font-size: 0.8375rem; color: #334155; }
    .amount { font-variant-numeric: tabular-nums; }
    .font-mono { font-variant-numeric: tabular-nums; letter-spacing: 0.01em; }

    .link-cell { font-size: 0.8375rem; font-weight: 500; color: #4f46e5; text-decoration: none; }
    .link-cell:hover { text-decoration: underline; }

    .void-btn {
      background: #fff;
      border: 1px solid #fecaca;
      color: #dc2626;
      font-size: 0.725rem;
    }
    .void-btn:hover {
      background: #fef2f2;
    }

    /* Receipt card */
    .receipt-card {
      border: 2px solid #0f172a;
      border-radius: 10px;
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
    }

    .receipt-watermark {
      position: absolute;
      top: 30%;
      left: 10%;
      font-size: 4.5rem;
      font-weight: 900;
      color: rgba(15, 23, 42, 0.04);
      transform: rotate(-28deg);
      pointer-events: none;
      user-select: none;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .receipt-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 0.75rem;
      margin-bottom: 1rem;
    }

    .receipt-title {
      font-size: 1.125rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.01em;
    }

    .receipt-subtitle {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 2px;
    }

    .receipt-ref {
      font-size: 0.8375rem;
      font-weight: 700;
      color: #0f172a;
      font-variant-numeric: tabular-nums;
      margin-bottom: 4px;
    }

    .receipt-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.875rem;
      margin-bottom: 1rem;
    }

    .receipt-field-label {
      font-size: 0.7rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 2px;
    }

    .receipt-field-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #0f172a;
    }

    .receipt-amount-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
      margin-bottom: 0.875rem;
    }

    .receipt-amount-label {
      font-size: 0.725rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .receipt-amount-value {
      font-size: 1.875rem;
      font-weight: 800;
      color: #15803d;
      letter-spacing: -0.025em;
      font-variant-numeric: tabular-nums;
    }

    .receipt-amount-note {
      font-size: 0.775rem;
      color: #64748b;
      margin-top: 4px;
    }

    .receipt-void-notice {
      background: #fee2e2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 0.625rem 0.875rem;
      border-radius: 7px;
      font-size: 0.8rem;
      margin-bottom: 0.875rem;
    }

    .receipt-footer {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 0.625rem;
    }
  `]
})
export class PaymentLedgerComponent implements OnInit {
  payments: Payment[] = [];
  pageSize = 6;
  currentPage = 1;
  searchQuery = '';
  statusFilter = '';
  loading = true;
  errorMessage = '';
  successMessage = '';

  selectedReceipt: Payment | null = null;

  showVoidModal = false;
  submittingVoid = false;
  paymentToVoid: Payment | null = null;
  voidReason = '';
  voidModalError = '';

  get totalPages(): number {
    return Math.ceil(this.payments.length / this.pageSize) || 1;
  }

  get startIndex(): number {
    if (this.payments.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.payments.length);
  }

  get displayedPayments(): Payment[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.payments.slice(start, start + this.pageSize);
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
    private paymentService: PaymentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = 1;
    this.cdr.markForCheck();

    const statusParam = this.statusFilter ? (this.statusFilter as PaymentStatus) : undefined;
    this.paymentService.getAllPayments(this.searchQuery, statusParam).subscribe({
      next: (list) => {
        this.payments = list;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: ApiErrorResponse) => {
        this.errorMessage = err.message || 'Failed to load payments';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.statusFilter = '';
    this.currentPage = 1;
    this.loadPayments();
  }

  openReceipt(payment: Payment): void {
    this.selectedReceipt = payment;
    this.cdr.markForCheck();
  }

  closeReceipt(): void {
    this.selectedReceipt = null;
    this.cdr.markForCheck();
  }

  printReceipt(): void {
    window.print();
  }

  openVoidModal(payment: Payment): void {
    this.paymentToVoid = payment;
    this.voidReason = '';
    this.voidModalError = '';
    this.showVoidModal = true;
    this.cdr.markForCheck();
  }

  closeVoidModal(): void {
    this.showVoidModal = false;
    this.paymentToVoid = null;
    this.cdr.markForCheck();
  }

  submitVoid(): void {
    if (!this.paymentToVoid || !this.voidReason.trim()) {
      this.voidModalError = 'Void reason is required.';
      this.cdr.markForCheck();
      return;
    }

    this.submittingVoid = true;
    this.voidModalError = '';
    this.cdr.markForCheck();

    const req: PaymentVoidRequest = { voidReason: this.voidReason.trim() };
    this.paymentService.voidPayment(this.paymentToVoid.id, req).subscribe({
      next: (updated) => {
        this.submittingVoid = false;
        this.showVoidModal = false;
        this.successMessage = `Payment ${updated.transactionReference} has been voided. Policy balance updated.`;
        this.loadPayments();
        this.cdr.markForCheck();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.markForCheck();
        }, 4000);
      },
      error: (err: ApiErrorResponse) => {
        this.submittingVoid = false;
        this.voidModalError = err.details?.length ? err.details.join(', ') : err.message;
        this.cdr.markForCheck();
      }
    });
  }

  exportToCsv(): void {
    if (this.payments.length === 0) return;

    const headers = ['Transaction Ref', 'Policy #', 'Customer', 'Vehicle', 'Amount', 'Method', 'Status', 'Date', 'Void Reason'];
    const rows = this.payments.map(p => [
      p.transactionReference,
      p.policyNumber,
      `"${p.customerName || ''}"`,
      p.vehicleRegistrationNumber || '',
      p.amount,
      p.paymentMethod,
      p.status,
      p.paymentDate,
      `"${p.voidReason || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payments_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
