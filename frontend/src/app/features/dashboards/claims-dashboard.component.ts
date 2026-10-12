import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClaimService } from '../../core/services/claim.service';
import { Claim, ClaimStatus, ClaimStatusUpdateRequest, ClaimInvestigation, ClaimInvestigationRequest } from '../../core/models/claim.model';
import { ApiErrorResponse } from '../../core/models/api-error.model';

@Component({
  selector: 'app-claims-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container">

      <!-- Header & Actor Profile -->
      <div class="page-header no-print">
        <div>
          <div class="role-badge-row">
            <span class="role-tag role-tag-claims">Claims Desk</span>
            <span class="badge-dot badge-under-review">Sarah Chen (Adjuster)</span>
          </div>
          <h1>First Notice of Loss (FNOL) &amp; Claims Adjudication</h1>
          <p>Triage FNOL queues, record surveyor reports, detect fraud patterns, set reserves with exact depreciation &amp; excess formulas, and issue approved loss vouchers.</p>
        </div>
        <div class="header-actions">
          <a routerLink="/claims" class="btn btn-secondary">All Claim Files</a>
        </div>
      </div>

      <!-- Claims KPI Metrics Ribbon -->
      <div class="metrics-grid no-print">
        <div class="metric-card primary">
          <div class="label">Total incident claims</div>
          <div class="value">{{ claims.length }}</div>
          <div class="sub-value">All reported loss filings</div>
        </div>
        <div class="metric-card warning">
          <div class="label">FNOL queue &amp; triage</div>
          <div class="value" [style.color]="pendingReviewCount > 0 ? 'var(--color-warning)' : 'var(--color-text)'">
            {{ pendingReviewCount }}
          </div>
          <div class="sub-value">Submitted / under investigation</div>
        </div>
        <div class="metric-card danger">
          <div class="label">Fraud &amp; policy warnings</div>
          <div class="value">{{ fraudWarningCount }}</div>
          <div class="sub-value">Outside cover period / late notice</div>
        </div>
        <div class="metric-card info">
          <div class="label">Approved vouchers</div>
          <div class="value">{{ approvedCount }}</div>
          <div class="sub-value">Awaiting finance wire transfer</div>
        </div>
        <div class="metric-card success">
          <div class="label">Settled payouts</div>
          <div class="value">{{ totalSettledAmount | number:'1.0-0' }}</div>
          <div class="sub-value">Total disbursed loss funds</div>
        </div>
      </div>

      <!-- Desk Navigation Tabs -->
      <div class="desk-tabs no-print">
        <button
          type="button"
          class="desk-tab"
          [class.active]="activeTab === 'queue'"
          (click)="setActiveTab('queue')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Adjudication Queue ({{ claims.length }})
        </button>
        <button
          type="button"
          class="desk-tab"
          [class.active]="activeTab === 'fraud'"
          (click)="setActiveTab('fraud')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Fraud &amp; Coverage Warnings ({{ fraudWarningCount }})
          <span *ngIf="fraudWarningCount > 0" class="tab-count-badge danger">{{ fraudWarningCount }}</span>
        </button>
        <button
          type="button"
          class="desk-tab"
          [class.active]="activeTab === 'portfolio'"
          (click)="setActiveTab('portfolio')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
          </svg>
          Loss Reserves &amp; Settlement Portfolio
        </button>
      </div>

      <!-- Alerts -->
      <div *ngIf="errorMessage" class="alert alert-danger no-print" role="alert">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="alert alert-success no-print" role="status">{{ successMessage }}</div>

      <!-- TAB 1: ADJUDICATION WORK QUEUE -->
      <div *ngIf="activeTab === 'queue'" class="card no-print" style="padding: 0; margin-top: 1rem;">
        <div class="section-header">
          <div>
            <h3 class="section-title">Claims Adjudication Work Queue</h3>
            <p class="section-desc">Assess liability, inspect surveyor reports, set reserves, and approve loss vouchers</p>
          </div>
          <div class="header-right-tools">
            <div class="search-field-inline">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                type="search"
                placeholder="Search claim, policy, customer…"
                [(ngModel)]="searchQuery"
                (input)="applyFilter()"
              />
            </div>
            <div class="filter-chips">
              <button class="filter-chip" [class.active]="statusFilter === 'all'" (click)="setStatusFilter('all')">All</button>
              <button class="filter-chip" [class.active]="statusFilter === 'SUBMITTED'" (click)="setStatusFilter('SUBMITTED')">FNOL New</button>
              <button class="filter-chip" [class.active]="statusFilter === 'UNDER_REVIEW'" (click)="setStatusFilter('UNDER_REVIEW')">Investigation</button>
              <button class="filter-chip" [class.active]="statusFilter === 'APPROVED'" (click)="setStatusFilter('APPROVED')">Approved</button>
              <button class="filter-chip" [class.active]="statusFilter === 'SETTLED'" (click)="setStatusFilter('SETTLED')">Settled</button>
            </div>
          </div>
        </div>

        <div class="table-responsive" style="border: none;">
          <table class="data-table" aria-label="Claims Adjudication Queue">
            <thead>
              <tr>
                <th>Claim #</th>
                <th>Policy &amp; Vehicle</th>
                <th>Customer</th>
                <th>Incident Date</th>
                <th>Type &amp; Warnings</th>
                <th class="th-num">Claimed</th>
                <th class="th-num">Approved Payout</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of displayedClaims">
                <td>
                  <code class="ref-code font-bold">{{ c.claimNumber }}</code>
                  <div class="cell-secondary">Filed {{ c.createdAt | date:'mediumDate' }}</div>
                </td>
                <td>
                  <a [routerLink]="['/policies', c.policyId]" class="link-cell">{{ c.policyNumber }}</a>
                  <div class="cell-secondary font-mono">{{ c.vehicleRegistrationNumber }}</div>
                </td>
                <td class="cell-secondary">{{ c.customerName }}</td>
                <td style="white-space: nowrap;">
                  <div>{{ c.incidentDate | date:'mediumDate' }}</div>
                  <div class="cell-secondary text-truncate" style="max-width: 140px;">{{ c.description }}</div>
                </td>
                <td>
                  <span class="claim-type-pill">{{ c.investigation?.claimType || 'OWN_DAMAGE' }}</span>
                  <div *ngIf="c.investigation?.fraudFlags" class="fraud-tag">
                    ⚠️ {{ c.investigation?.fraudFlags }}
                  </div>
                  <div *ngIf="c.investigation?.totalLoss" class="total-loss-tag">
                    💥 Total Loss (&ge;75%)
                  </div>
                </td>
                <td class="td-num amount">{{ c.requestedAmount | number:'1.2-2' }}</td>
                <td class="td-num amount">
                  <strong *ngIf="c.approvedAmount" style="color: var(--color-success);">
                    {{ c.approvedAmount | number:'1.2-2' }}
                  </strong>
                  <span *ngIf="!c.approvedAmount" class="cell-secondary">—</span>
                </td>
                <td>
                  <span [ngClass]="'badge-dot badge-' + c.status.toLowerCase()">{{ c.status }}</span>
                </td>
                <td>
                  <div class="row-actions">
                    <button
                      *ngIf="c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW'"
                      class="btn btn-xs btn-secondary"
                      (click)="openInvestigationModal(c)"
                      title="Inspect surveyor notes, damage estimate, and excess formula">
                      🔍 Investigate
                    </button>
                    <button
                      *ngIf="c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW'"
                      class="btn btn-xs btn-primary"
                      (click)="openDecisionModal(c)"
                      title="Adjudicate, approve or reject claim">
                      ⚖️ Decide
                    </button>
                    <button
                      *ngIf="c.status === 'APPROVED' || c.status === 'SETTLED'"
                      class="btn btn-xs btn-secondary"
                      (click)="viewClaimVoucher(c)"
                      title="Print Loss Assessment Voucher">
                      Voucher
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredClaims.length === 0">
                <td colspan="9"><div class="empty-state" style="padding: 1.5rem;"><p>No claims in this queue.</p></div></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div *ngIf="filteredClaims.length > pageSize" class="table-pagination-bar">
          <span class="pagination-info">
            Showing <strong>{{ startIndex }}–{{ endIndex }}</strong> of <strong>{{ filteredClaims.length }}</strong> claims
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

      <!-- TAB 2: FRAUD & COVERAGE WARNINGS RADAR -->
      <div *ngIf="activeTab === 'fraud'" class="card no-print" style="margin-top: 1rem;">
        <div class="section-header" style="border: none; padding: 0 0 1rem 0;">
          <div>
            <h3 class="section-title">Automated Fraud Detection &amp; Coverage Validation Radar</h3>
            <p class="section-desc">Advisory warning signals flagged automatically during FNOL triage</p>
          </div>
        </div>

        <div class="fraud-summary-grid">
          <div class="fraud-card">
            <h4>Outside Coverage Period</h4>
            <div class="fraud-count">{{ outsidePeriodCount }}</div>
            <p>Incident date falls outside active policy dates (retroactive filing risk).</p>
          </div>
          <div class="fraud-card">
            <h4>Late Reporting (&gt; 30 Days)</h4>
            <div class="fraud-count">{{ lateReportingCount }}</div>
            <p>Delayed First Notice of Loss filing beyond regulatory notification window.</p>
          </div>
          <div class="fraud-card">
            <h4>Total Loss Claims (&ge; 75%)</h4>
            <div class="fraud-count">{{ totalLossCount }}</div>
            <p>Repair estimate exceeds 75% of vehicle market value / sum insured.</p>
          </div>
        </div>

        <div class="table-responsive" style="margin-top: 1.5rem;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Claim #</th>
                <th>Policy</th>
                <th>Incident Date</th>
                <th>Advisory Flags</th>
                <th>Claimed ($)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of fraudFlaggedClaims">
                <td><code class="ref-code">{{ c.claimNumber }}</code></td>
                <td><a [routerLink]="['/policies', c.policyId]" class="link-cell">{{ c.policyNumber }}</a></td>
                <td>{{ c.incidentDate | date:'mediumDate' }}</td>
                <td>
                  <span class="fraud-tag-pill">{{ c.investigation?.fraudFlags || 'Suspicious Filing' }}</span>
                </td>
                <td class="amount td-num">{{ c.requestedAmount | number:'1.2-2' }}</td>
                <td><span [ngClass]="'badge-dot badge-' + c.status.toLowerCase()">{{ c.status }}</span></td>
                <td>
                  <button class="btn btn-xs btn-primary" (click)="openInvestigationModal(c)">
                    Review Evidence
                  </button>
                </td>
              </tr>
              <tr *ngIf="fraudFlaggedClaims.length === 0">
                <td colspan="7"><div class="empty-state" style="padding: 1.5rem;"><p>No fraud or policy coverage anomalies detected.</p></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: LOSS RESERVES & PORTFOLIO -->
      <div *ngIf="activeTab === 'portfolio'" class="card no-print" style="margin-top: 1rem;">
        <div class="section-header" style="border: none; padding: 0 0 1rem 0;">
          <div>
            <h3 class="section-title">Loss Reserves &amp; Adjudication Analytics</h3>
            <p class="section-desc">Actuarial loss provisioning, excess deductions, and settlement turnaround</p>
          </div>
        </div>

        <div class="recon-grid">
          <div class="recon-card">
            <h4>Gross Claim Incurred</h4>
            <div class="recon-val">{{ totalRequestedAmount | number:'1.0-0' }}</div>
            <p>Total loss value claimed across all reported files.</p>
          </div>
          <div class="recon-card success">
            <h4>Settled Payouts</h4>
            <div class="recon-val">{{ totalSettledAmount | number:'1.0-0' }}</div>
            <p>Executed disbursements settled via Finance desk.</p>
          </div>
          <div class="recon-card warning">
            <h4>Current Approved Reserves</h4>
            <div class="recon-val">{{ totalApprovedReserve | number:'1.0-0' }}</div>
            <p>Approved loss vouchers awaiting disbursement.</p>
          </div>
          <div class="recon-card info">
            <h4>Adjudication Settlement Rate</h4>
            <div class="recon-val">{{ settlementRate | number:'1.1-1' }}%</div>
            <p>Claims successfully processed to closure.</p>
          </div>
        </div>
      </div>

      <!-- MODAL: INVESTIGATION WORKBENCH -->
      <div *ngIf="showInvestigationModal" class="modal-backdrop no-print" role="dialog" aria-modal="true">
        <div class="modal-dialog" style="max-width: 640px;">
          <div class="modal-header">
            <h3>Claim Investigation &amp; Loss Assessment</h3>
            <button type="button" class="modal-close-btn" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger">{{ modalError }}</div>

            <div class="investigation-hero">
              <div><strong>Claim #:</strong> {{ activeClaim?.claimNumber }}</div>
              <div><strong>Policyholder:</strong> {{ activeClaim?.customerName }}</div>
              <div><strong>Incident Date:</strong> {{ activeClaim?.incidentDate }}</div>
              <div><strong>Claimed:</strong> {{ activeClaim?.requestedAmount | number:'1.2-2' }}</div>
            </div>

            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
              <div class="form-group">
                <label class="form-label">Claim Type *</label>
                <select class="form-control" [(ngModel)]="investigationForm.claimType" (change)="recalculateRecommendedPayout()">
                  <option value="OWN_DAMAGE">Own Damage (Comprehensive)</option>
                  <option value="THIRD_PARTY">Third-Party Property Damage</option>
                  <option value="TOTAL_LOSS">Total Loss (Constructive / Actual)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Independent Surveyor Name</label>
                <input type="text" class="form-control" [(ngModel)]="investigationForm.surveyorName" placeholder="e.g. Apex Marine & Motor Assessors" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Surveyor Assessment &amp; Physical Inspection Notes</label>
              <textarea class="form-control" rows="2" [(ngModel)]="investigationForm.surveyorNotes" placeholder="Front bumper crush, radiator leak, structural chassis aligned..."></textarea>
            </div>

            <!-- Quantitative Assessment Grid -->
            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.75rem;">
              <div class="form-group">
                <label class="form-label">Repair Estimate *</label>
                <input type="number" step="0.01" class="form-control" [(ngModel)]="investigationForm.repairEstimate" (input)="recalculateRecommendedPayout()" />
              </div>
              <div class="form-group">
                <label class="form-label">Depreciation</label>
                <input type="number" step="0.01" class="form-control" [(ngModel)]="investigationForm.depreciationAmount" (input)="recalculateRecommendedPayout()" />
              </div>
              <div class="form-group">
                <label class="form-label">Excess / Deductible</label>
                <input type="number" step="0.01" class="form-control" [(ngModel)]="investigationForm.excessApplied" (input)="recalculateRecommendedPayout()" />
              </div>
              <div class="form-group">
                <label class="form-label">Salvage Value</label>
                <input type="number" step="0.01" class="form-control" [(ngModel)]="investigationForm.salvageValue" (input)="recalculateRecommendedPayout()" />
              </div>
            </div>

            <!-- Formula Breakdown Box -->
            <div class="formula-box">
              <div class="formula-header">
                <strong>Actuarial Net Loss Settlement Formula</strong>
                <span *ngIf="isTotalLossCalculated" class="badge badge-danger">TOTAL LOSS APPLIED (&ge;75%)</span>
              </div>
              <div class="formula-line">
                <span>Gross Assessed Loss:</span>
                <span class="amount">{{ investigationForm.repairEstimate || 0 | number:'1.2-2' }}</span>
              </div>
              <div class="formula-line" *ngIf="investigationForm.claimType !== 'THIRD_PARTY'">
                <span>Less Depreciation Wear &amp; Tear:</span>
                <span class="amount">-{{ investigationForm.depreciationAmount || 0 | number:'1.2-2' }}</span>
              </div>
              <div class="formula-line" *ngIf="investigationForm.claimType !== 'THIRD_PARTY'">
                <span>Less Policy Deductible / Excess:</span>
                <span class="amount">-{{ investigationForm.excessApplied || 0 | number:'1.2-2' }}</span>
              </div>
              <div class="formula-line" *ngIf="investigationForm.salvageValue > 0">
                <span>Less Salvage Realization:</span>
                <span class="amount">-{{ investigationForm.salvageValue || 0 | number:'1.2-2' }}</span>
              </div>
              <div class="formula-total">
                <span>Recommended Net Approved Payout:</span>
                <span class="formula-payout">{{ calculatedRecommendedPayout | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()" [disabled]="submittingInvestigation">Cancel</button>
            <button class="btn btn-primary" (click)="submitInvestigation()" [disabled]="submittingInvestigation">
              <span *ngIf="submittingInvestigation" class="spinner" style="width: 14px; height: 14px;"></span>
              Save Assessment &amp; Recalculate
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: ADJUDICATION / DECISION -->
      <div *ngIf="showDecisionModal" class="modal-backdrop no-print" role="dialog" aria-modal="true">
        <div class="modal-dialog" style="max-width: 520px;">
          <div class="modal-header">
            <h3>Adjudicate Claim: {{ activeClaim?.claimNumber }}</h3>
            <button type="button" class="modal-close-btn" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger">{{ modalError }}</div>

            <div class="form-group">
              <label class="form-label">Decision Status *</label>
              <select class="form-control" [(ngModel)]="decisionForm.status">
                <option value="UNDER_REVIEW">Move to UNDER_REVIEW (Triage)</option>
                <option value="APPROVED">APPROVE Loss Voucher</option>
                <option value="REJECTED">REJECT Claim</option>
              </select>
            </div>

            <div *ngIf="decisionForm.status === 'APPROVED'" class="form-group">
              <label class="form-label">Approved Payout Amount ($) *</label>
              <input type="number" step="0.01" class="form-control" [(ngModel)]="decisionForm.approvedAmount" />
              <div class="text-xs text-muted" style="margin-top: 4px;">
                Requested: {{ activeClaim?.requestedAmount | number:'1.2-2' }}
              </div>
            </div>

            <!-- Maker-Checker Notice if > $10,000 -->
            <div *ngIf="decisionForm.status === 'APPROVED' && (decisionForm.approvedAmount || 0) > 10000" class="maker-checker-box">
              <div class="mc-icon">⚖️</div>
              <div>
                <strong>Maker-Checker Escalation (&gt; $10,000):</strong>
                This high-value payout requires Senior Claims Manager (Elena Rostova) authorization to execute.
              </div>
            </div>

            <div class="form-group" style="margin-top: 1rem;">
              <label class="form-label">Adjudication Notes / Rationale *</label>
              <textarea class="form-control" rows="3" [(ngModel)]="decisionForm.decisionNote" placeholder="Explain the grounds for approval, excess applied, or rejection basis..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()" [disabled]="submittingDecision">Cancel</button>
            <button
              [ngClass]="decisionForm.status === 'REJECTED' ? 'btn btn-danger' : 'btn btn-primary'"
              (click)="submitDecision()"
              [disabled]="submittingDecision || !decisionForm.decisionNote.trim()">
              <span *ngIf="submittingDecision" class="spinner" style="width: 14px; height: 14px;"></span>
              Confirm Decision
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: CLAIM LOSS VOUCHER -->
      <div *ngIf="selectedVoucherClaim" class="modal-backdrop no-print" role="dialog" aria-modal="true">
        <div class="modal-dialog" style="max-width: 600px;">
          <div class="modal-header">
            <h3>Claim Assessment &amp; Loss Voucher</h3>
            <button type="button" class="modal-close-btn" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <div class="voucher-card">
              <div class="voucher-watermark">ASSESSED</div>
              <div class="voucher-header">
                <div>
                  <div class="voucher-title">CLAIM LOSS VOUCHER</div>
                  <div class="voucher-sub">Motor Claims Adjudication Record</div>
                </div>
                <div style="text-align: right;">
                  <div class="voucher-num font-mono">{{ selectedVoucherClaim.claimNumber }}</div>
                  <span [ngClass]="'badge-dot badge-' + selectedVoucherClaim.status.toLowerCase()">
                    {{ selectedVoucherClaim.status }}
                  </span>
                </div>
              </div>
              <div class="voucher-grid">
                <div>
                  <div class="sub-label">Policy Number</div>
                  <div class="voucher-val font-mono">{{ selectedVoucherClaim.policyNumber }}</div>
                </div>
                <div>
                  <div class="sub-label">Claimant</div>
                  <div class="voucher-val">{{ selectedVoucherClaim.customerName }}</div>
                </div>
                <div>
                  <div class="sub-label">Vehicle Plate</div>
                  <div class="voucher-val font-mono">{{ selectedVoucherClaim.vehicleRegistrationNumber }}</div>
                </div>
                <div>
                  <div class="sub-label">Incident Date</div>
                  <div class="voucher-val">{{ selectedVoucherClaim.incidentDate }}</div>
                </div>
              </div>
              <div class="voucher-amount-box">
                <div class="sub-label">Approved Payout Voucher</div>
                <div class="voucher-amount">{{ selectedVoucherClaim.approvedAmount | number:'1.2-2' }}</div>
                <div *ngIf="selectedVoucherClaim.decisionNote" class="voucher-note">{{ selectedVoucherClaim.decisionNote }}</div>
              </div>
              <div class="voucher-footer">
                <span>Adjudicated by: Sarah Chen (Claims Officer)</span>
                <span>Date: {{ selectedVoucherClaim.decisionDate | date:'mediumDate' }}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()">Close</button>
            <button class="btn btn-primary" (click)="printPage()">Print Voucher</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .role-badge-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .role-tag { font-size: 0.725rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
    .role-tag-claims { color: #d97706; background: #fffbeb; }
    .header-actions { display: flex; align-items: center; gap: 0.75rem; }

    .desk-tabs { display: flex; gap: 0.5rem; margin-top: 1.25rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem; }
    .desk-tab { display: inline-flex; align-items: center; gap: 6px; background: transparent; border: none; padding: 0.625rem 1rem; font-size: 0.8375rem; font-weight: 500; color: #64748b; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.15s; }
    .desk-tab:hover { color: #0f172a; }
    .desk-tab.active { color: #d97706; border-bottom-color: #d97706; font-weight: 600; }
    .tab-count-badge { font-size: 0.7rem; padding: 1px 6px; border-radius: 10px; margin-left: 4px; }
    .tab-count-badge.danger { background: #fee2e2; color: #dc2626; }

    .section-header { padding: 0.875rem 1.25rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
    .section-title { font-size: 0.95rem; font-weight: 600; color: #0f172a; margin: 0; }
    .section-desc { font-size: 0.75rem; color: #64748b; margin: 2px 0 0; }
    .header-right-tools { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }

    .search-field-inline { display: flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0 10px; height: 34px; }
    .search-field-inline svg { color: #94a3b8; flex-shrink: 0; }
    .search-field-inline input { border: none; background: transparent; outline: none; font-size: 0.8125rem; color: #0f172a; font-family: inherit; width: 180px; }

    .filter-chips { display: flex; gap: 4px; }
    .filter-chip { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 10px; font-size: 0.75rem; font-weight: 500; color: #475569; cursor: pointer; }
    .filter-chip.active { background: #fffbeb; border-color: #fde68a; color: #d97706; font-weight: 600; }

    .ref-code { font-family: 'Fira Code', ui-monospace, monospace; font-size: 0.75rem; color: #334155; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
    .cell-secondary { font-size: 0.75rem; color: #64748b; }
    .link-cell { font-size: 0.8375rem; font-weight: 500; color: #4f46e5; text-decoration: none; }
    .link-cell:hover { text-decoration: underline; }
    .amount { font-variant-numeric: tabular-nums; }
    .claim-type-pill { font-size: 0.7rem; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; color: #334155; }
    .fraud-tag { font-size: 0.675rem; color: #dc2626; font-weight: 600; margin-top: 2px; }
    .total-loss-tag { font-size: 0.675rem; color: #b91c1c; font-weight: 700; margin-top: 2px; }
    .fraud-tag-pill { background: #fee2e2; color: #dc2626; font-size: 0.725rem; font-weight: 600; padding: 2px 8px; border-radius: 4px; }

    .fraud-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
    .fraud-card { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem; }
    .fraud-card h4 { margin: 0 0 0.5rem 0; font-size: 0.8rem; text-transform: uppercase; color: #991b1b; }
    .fraud-count { font-size: 1.75rem; font-weight: 800; color: #dc2626; margin-bottom: 4px; }
    .fraud-card p { margin: 0; font-size: 0.75rem; color: #7f1d1d; }

    .investigation-hero { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.75rem 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.8rem; color: #334155; }
    .formula-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 1rem; margin-top: 1rem; font-size: 0.825rem; }
    .formula-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.625rem; }
    .formula-line { display: flex; justify-content: space-between; margin-bottom: 4px; color: #475569; }
    .formula-total { display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 6px; font-weight: 700; color: #0f172a; }
    .formula-payout { font-size: 1.15rem; color: #059669; }

    .maker-checker-box { display: flex; align-items: center; gap: 0.75rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 0.75rem; font-size: 0.8rem; color: #92400e; margin-top: 0.75rem; }
    .mc-icon { font-size: 1.25rem; }

    .voucher-card { background: #fff; border: 2px solid #0f172a; border-radius: 8px; padding: 1.5rem; position: relative; }
    .voucher-watermark { position: absolute; right: 10px; top: 10px; font-size: 3.5rem; font-weight: 900; color: rgba(15,23,42,0.04); pointer-events: none; }
    .voucher-header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 0.75rem; margin-bottom: 1rem; }
    .voucher-title { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
    .voucher-sub { font-size: 0.75rem; color: #64748b; }
    .voucher-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; margin-bottom: 1rem; }
    .voucher-val { font-size: 0.875rem; font-weight: 600; color: #0f172a; }
    .voucher-amount-box { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 1rem; text-align: center; margin-bottom: 1rem; }
    .voucher-amount { font-size: 1.75rem; font-weight: 800; color: #059669; }
    .voucher-note { font-size: 0.75rem; color: #64748b; margin-top: 4px; }
    .voucher-footer { display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 0.75rem; }

    .btn-xs { padding: 3px 8px; font-size: 0.725rem; border-radius: 4px; }
    .row-actions { display: flex; gap: 4px; }
    .font-mono { font-family: monospace; }
  `]
})
export class ClaimsDashboardComponent implements OnInit {
  claims: Claim[] = [];
  filteredClaims: Claim[] = [];

  activeTab: 'queue' | 'fraud' | 'portfolio' = 'queue';
  searchQuery = '';
  statusFilter = 'all';

  pageSize = 7;
  currentPage = 1;

  // Feedback messages
  errorMessage = '';
  successMessage = '';

  // Modals state
  showInvestigationModal = false;
  submittingInvestigation = false;
  modalError = '';
  activeClaim: Claim | null = null;
  investigationForm: {
    claimType: 'OWN_DAMAGE' | 'THIRD_PARTY' | 'TOTAL_LOSS';
    surveyorName: string;
    surveyorNotes: string;
    repairEstimate: number;
    depreciationAmount: number;
    excessApplied: number;
    salvageValue: number;
  } = {
    claimType: 'OWN_DAMAGE',
    surveyorName: '',
    surveyorNotes: '',
    repairEstimate: 0,
    depreciationAmount: 0,
    excessApplied: 0,
    salvageValue: 0
  };

  showDecisionModal = false;
  submittingDecision = false;
  decisionForm: {
    status: ClaimStatus;
    approvedAmount: number | null;
    decisionNote: string;
  } = {
    status: 'APPROVED',
    approvedAmount: null,
    decisionNote: ''
  };

  selectedVoucherClaim: Claim | null = null;

  constructor(
    private claimService: ClaimService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadClaims();
  }

  loadClaims(): void {
    this.claimService.getClaims().subscribe({
      next: (list) => {
        this.claims = list;
        this.applyFilter();
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Failed to load claims queue.';
        this.cdr.markForCheck();
      }
    });
  }

  setActiveTab(tab: 'queue' | 'fraud' | 'portfolio'): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  setStatusFilter(filter: string): void {
    this.statusFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    let result = this.claims;
    if (this.statusFilter !== 'all') {
      result = result.filter(c => c.status === this.statusFilter);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(c =>
        c.claimNumber.toLowerCase().includes(q) ||
        c.policyNumber.toLowerCase().includes(q) ||
        (c.customerName && c.customerName.toLowerCase().includes(q))
      );
    }
    this.filteredClaims = result;
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  // --- Metrics ---
  get pendingReviewCount(): number {
    return this.claims.filter(c => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW').length;
  }

  get approvedCount(): number {
    return this.claims.filter(c => c.status === 'APPROVED').length;
  }

  get settledCount(): number {
    return this.claims.filter(c => c.status === 'SETTLED').length;
  }

  get totalSettledAmount(): number {
    return this.claims
      .filter(c => c.status === 'SETTLED' && c.settlementAmount)
      .reduce((sum, c) => sum + (c.settlementAmount || 0), 0);
  }

  get totalRequestedAmount(): number {
    return this.claims.reduce((sum, c) => sum + (c.requestedAmount || 0), 0);
  }

  get totalApprovedReserve(): number {
    return this.claims
      .filter(c => c.status === 'APPROVED' && c.approvedAmount)
      .reduce((sum, c) => sum + (c.approvedAmount || 0), 0);
  }

  get settlementRate(): number {
    if (this.claims.length === 0) return 0;
    return (this.settledCount / this.claims.length) * 100;
  }

  // --- Fraud Radar ---
  get fraudFlaggedClaims(): Claim[] {
    return this.claims.filter(c => c.investigation?.fraudFlags || c.investigation?.totalLoss);
  }

  get fraudWarningCount(): number {
    return this.fraudFlaggedClaims.length;
  }

  get outsidePeriodCount(): number {
    return this.claims.filter(c => c.investigation?.fraudFlags?.includes('OUTSIDE_COVER_PERIOD')).length;
  }

  get lateReportingCount(): number {
    return this.claims.filter(c => c.investigation?.fraudFlags?.includes('LATE_REPORTING')).length;
  }

  get totalLossCount(): number {
    return this.claims.filter(c => c.investigation?.totalLoss).length;
  }

  // --- Pagination ---
  get totalPages(): number {
    return Math.ceil(this.filteredClaims.length / this.pageSize) || 1;
  }

  get startIndex(): number {
    if (this.filteredClaims.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredClaims.length);
  }

  get displayedClaims(): Claim[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredClaims.slice(start, start + this.pageSize);
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

  closeModals(): void {
    this.showInvestigationModal = false;
    this.showDecisionModal = false;
    this.selectedVoucherClaim = null;
    this.activeClaim = null;
    this.modalError = '';
    this.cdr.markForCheck();
  }

  // --- Investigation Workbench ---
  openInvestigationModal(c: Claim): void {
    this.activeClaim = c;
    this.modalError = '';
    const inv = c.investigation;
    this.investigationForm = {
      claimType: inv?.claimType || 'OWN_DAMAGE',
      surveyorName: inv?.surveyorName || 'Independent Assessors Ltd',
      surveyorNotes: inv?.surveyorNotes || 'Inspected damage at approved garage.',
      repairEstimate: inv?.repairEstimate || c.requestedAmount,
      depreciationAmount: inv?.depreciationAmount || 0,
      excessApplied: inv?.excessApplied || 500,
      salvageValue: inv?.salvageValue || 0
    };
    this.showInvestigationModal = true;
    this.cdr.markForCheck();
  }

  recalculateRecommendedPayout(): void {
    // UI reactive trigger
    this.cdr.markForCheck();
  }

  get isTotalLossCalculated(): boolean {
    const repair = this.investigationForm.repairEstimate || 0;
    return this.investigationForm.claimType === 'TOTAL_LOSS' || (this.activeClaim?.requestedAmount ? repair >= 0.75 * this.activeClaim.requestedAmount : false);
  }

  get calculatedRecommendedPayout(): number {
    const est = this.investigationForm.repairEstimate || 0;
    const dep = this.investigationForm.depreciationAmount || 0;
    const exc = this.investigationForm.excessApplied || 0;
    const sal = this.investigationForm.salvageValue || 0;

    let payout = 0;
    if (this.investigationForm.claimType === 'THIRD_PARTY') {
      payout = est;
    } else if (this.isTotalLossCalculated) {
      const base = this.activeClaim ? this.activeClaim.requestedAmount : est;
      payout = base - sal - exc;
    } else {
      payout = est - dep - exc;
    }
    return Math.max(0, payout);
  }

  submitInvestigation(): void {
    if (!this.activeClaim) return;
    this.submittingInvestigation = true;
    this.modalError = '';

    const req: ClaimInvestigationRequest = {
      claimType: this.investigationForm.claimType,
      surveyorName: this.investigationForm.surveyorName,
      surveyorNotes: this.investigationForm.surveyorNotes,
      repairEstimate: this.investigationForm.repairEstimate,
      depreciationAmount: this.investigationForm.depreciationAmount,
      excessApplied: this.investigationForm.excessApplied,
      salvageValue: this.investigationForm.salvageValue,
      investigationStatus: 'COMPLETED'
    };

    this.claimService.investigateClaim(this.activeClaim.id, req, 'sarah.adjuster').subscribe({
      next: (updated) => {
        this.submittingInvestigation = false;
        this.closeModals();
        this.successMessage = `Investigation for claim ${updated.claimNumber} saved. Recommended payout: $${updated.investigation?.recommendedPayout}.`;
        this.loadClaims();
        setTimeout(() => { this.successMessage = ''; this.cdr.markForCheck(); }, 4000);
      },
      error: (err) => {
        this.submittingInvestigation = false;
        this.modalError = err.error?.message || 'Failed to save investigation.';
        this.cdr.markForCheck();
      }
    });
  }

  // --- Adjudication Decision ---
  openDecisionModal(c: Claim): void {
    this.activeClaim = c;
    this.modalError = '';
    const recommended = c.investigation?.recommendedPayout || c.requestedAmount;
    this.decisionForm = {
      status: 'APPROVED',
      approvedAmount: recommended,
      decisionNote: `Approved in accordance with assessment report. Deductible applied: $${c.investigation?.excessApplied || 0}.`
    };
    this.showDecisionModal = true;
    this.cdr.markForCheck();
  }

  submitDecision(): void {
    if (!this.activeClaim) return;
    this.submittingDecision = true;
    this.modalError = '';

    const req: ClaimStatusUpdateRequest = {
      status: this.decisionForm.status,
      approvedAmount: this.decisionForm.status === 'APPROVED' ? this.decisionForm.approvedAmount || undefined : undefined,
      decisionNote: this.decisionForm.decisionNote.trim()
    };

    // If amount > 10,000, Elena Rostova authorization is needed
    const actor = (req.approvedAmount || 0) > 10000 ? 'elena.manager' : 'sarah.adjuster';

    this.claimService.reviewClaim(this.activeClaim.id, req).subscribe({
      next: (reviewed) => {
        this.submittingDecision = false;
        this.closeModals();
        this.successMessage = `Claim ${reviewed.claimNumber} status updated to ${reviewed.status}. Loss voucher created for Finance desk.`;
        this.loadClaims();
        if (reviewed.status === 'APPROVED') {
          this.viewClaimVoucher(reviewed);
        }
        setTimeout(() => { this.successMessage = ''; this.cdr.markForCheck(); }, 5000);
      },
      error: (err) => {
        this.submittingDecision = false;
        this.modalError = err.error?.message || 'Failed to adjudicate claim.';
        this.cdr.markForCheck();
      }
    });
  }

  viewClaimVoucher(c: Claim): void {
    this.selectedVoucherClaim = c;
    this.cdr.markForCheck();
  }

  printPage(): void {
    window.print();
  }
}
