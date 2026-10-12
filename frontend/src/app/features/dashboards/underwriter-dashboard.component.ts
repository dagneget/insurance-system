import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../core/services/dashboard.service';
import { PolicyService } from '../../core/services/policy.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { AuthService } from '../../core/services/auth.service';
import { AdminService } from '../../core/services/admin.service';
import { UnderwriterAuthority } from '../../core/models/user-management.model';
import { DashboardSummary } from '../../core/models/dashboard.model';
import {
  Policy,
  PolicyCreateRequest,
  PolicyStatus,
  QuoteCalculationDto,
  QuoteCalculationRequest,
  PolicyRenewalRequest,
  PolicyCancelRequest,
  Endorsement,
  EndorsementCreateRequest
} from '../../core/models/policy.model';
import { Vehicle } from '../../core/models/vehicle.model';
import { ApiErrorResponse } from '../../core/models/api-error.model';

@Component({
  selector: 'app-underwriter-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="keeper-dash-layout">
      <!-- ── Top Header Bar ──────────────────────────────────────── -->
      <header class="keeper-topbar">
        <div class="topbar-left">
          <nav class="breadcrumb-nav" aria-label="Breadcrumb">
            <span class="bc-crumb">Underwriting</span>
            <span class="bc-separator">/</span>
            <span class="bc-current">Risk Appraisal Desk</span>
          </nav>
        </div>

        <div class="topbar-center">
          <div class="global-search-box">
            <input
              type="search"
              placeholder="Filter by policy #, customer, vehicle, or VIN..."
              class="global-search-input"
              [(ngModel)]="filterQuery"
              (input)="applyFilter()"
              aria-label="Filter underwriting portfolio"
            />
            <svg class="search-magnifier-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
        </div>

        <div class="topbar-right">
          <!-- Actuarial Motor Rating Engine CTA -->
          <button type="button" class="btn-emerald-add" (click)="openQuoteModal()" title="Open Actuarial Motor Rating Engine">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span>Actuarial Rating Engine</span>
          </button>

          <!-- User Avatar -->
          <div class="user-header-avatar" [title]="authService.currentUser?.fullName || 'Alexander Reed (Underwriter)'">
            <span>{{ getInitials(authService.currentUser?.fullName || 'Alexander Reed') }}</span>
          </div>
        </div>
      </header>

      <!-- ── Subheader Banner & Desk Context ────────────────────── -->
      <div class="keeper-subheader">
        <div class="subheader-heading">
          <h2>Underwriting &amp; Risk Portfolio</h2>
          <span class="desk-badge">Underwriter Desk · Active Authority</span>
        </div>

        <!-- Queue Filter Pills -->
        <div class="subheader-actions">
          <button
            type="button"
            class="pill-filter-btn"
            [class.active]="activeQueueTab === 'ALL'"
            (click)="setQueueTab('ALL')"
          >
            All Contracts ({{ policies.length }})
          </button>

          <button
            type="button"
            class="pill-filter-btn"
            [class.active]="activeQueueTab === 'DRAFT'"
            (click)="setQueueTab('DRAFT')"
          >
            Review Queue ({{ draftCount }})
            <span *ngIf="draftCount > 0" class="badge-counter-amber">{{ draftCount }}</span>
          </button>

          <button
            type="button"
            class="pill-filter-btn"
            [class.active]="activeQueueTab === 'REFERRAL'"
            (click)="setQueueTab('REFERRAL')"
          >
            Referral Queue ({{ referralCount }})
            <span *ngIf="referralCount > 0" class="badge-counter-amber">{{ referralCount }}</span>
          </button>

          <button
            type="button"
            class="pill-filter-btn"
            [class.active]="activeQueueTab === 'ISSUED'"
            (click)="setQueueTab('ISSUED')"
          >
            Active ({{ activeCount }})
          </button>

          <button
            type="button"
            class="pill-filter-btn"
            [class.active]="activeQueueTab === 'EXPIRING'"
            (click)="setQueueTab('EXPIRING')"
          >
            Expiries Due ({{ expiringPolicies.length }})
            <span *ngIf="expiringPolicies.length > 0" class="badge-counter-amber">{{ expiringPolicies.length }}</span>
          </button>

          <button
            type="button"
            class="pill-filter-btn"
            [class.active]="activeQueueTab === 'RENEWED'"
            (click)="setQueueTab('RENEWED')"
          >
            Renewals ({{ renewedCount }})
          </button>
        </div>
      </div>

      <!-- ── Main Grid Content Body ─────────────────────────────── -->
      <div class="dash-content-body">

        <!-- Notification Banner: Pending Proposals requiring review -->
        <div *ngIf="draftCount > 0" class="uw-notice-banner notice-amber">
          <div class="notice-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div class="notice-body">
            <strong>{{ draftCount }} proposal(s) awaiting underwriting adjudication.</strong>
            Review risk parameters, verify vehicle valuation, and approve to issue coverage.
          </div>
          <button type="button" class="btn btn-sm btn-secondary" (click)="setQueueTab('DRAFT')">
            View Review Queue &rarr;
          </button>
        </div>

        <!-- Notification Banner: 30-Day Expiries -->
        <div *ngIf="expiringPolicies.length > 0" class="uw-notice-banner notice-amber">
          <div class="notice-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
          </div>
          <div class="notice-body">
            <strong>{{ expiringPolicies.length }} policy term(s) expiring within 30 days.</strong>
            Issue consecutive renewal terms before risk expiration to maintain policyholder continuity.
          </div>
          <button type="button" class="btn btn-sm btn-secondary" (click)="setQueueTab('EXPIRING')">
            Review Expiries &rarr;
          </button>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="alert alert-danger">
          <strong>Error:</strong> {{ error.message }}
          <button class="btn btn-sm btn-secondary" style="margin-left: 1rem;" (click)="loadData()">Retry</button>
        </div>

        <!-- ── Row 1: Top 4 Underwriting Metric KPI Cards ──────────── -->
        <div class="kpi-metrics-row">
          <!-- Card 1: Gross Written Premium -->
          <div class="kpi-card">
            <div class="kpi-label">Gross Written Premium</div>
            <div class="kpi-value-row">
              <span class="kpi-value num">\${{ (summary?.totalPremium || 0) | number:'1.2-2' }}</span>
              <span class="kpi-trend-pill positive">+12.4%</span>
            </div>
            <div class="kpi-sub-text">Total bound book of business</div>
          </div>

          <!-- Card 2: Active Risk Contracts -->
          <div class="kpi-card">
            <div class="kpi-label">Active Risk Contracts</div>
            <div class="kpi-value-row">
              <span class="kpi-value num">{{ summary?.activePolicies || 0 }}</span>
              <span class="kpi-trend-pill positive">Live</span>
            </div>
            <div class="kpi-sub-text">{{ summary?.totalPolicies || 0 }} total portfolio terms</div>
          </div>

          <!-- Card 3: Pending Review Proposals -->
          <div class="kpi-card">
            <div class="kpi-label">Proposals Pending Review</div>
            <div class="kpi-value-row">
              <span class="kpi-value num" [style.color]="draftCount > 0 ? '#ea580c' : '#0f172a'">
                {{ draftCount }}
              </span>
              <span *ngIf="draftCount > 0" class="kpi-trend-pill negative">Action Needed</span>
              <span *ngIf="draftCount === 0" class="kpi-trend-pill positive">Clear</span>
            </div>
            <div class="kpi-sub-text">Submissions awaiting decision</div>
          </div>

          <!-- Card 4: Consecutive Renewals -->
          <div class="kpi-card">
            <div class="kpi-label">Renewed Continuations</div>
            <div class="kpi-value-row">
              <span class="kpi-value num">{{ summary?.renewedPoliciesCount || 0 }}</span>
              <span class="kpi-trend-pill positive">+100%</span>
            </div>
            <div class="kpi-sub-text">Continuations with origin tracking</div>
          </div>
        </div>

        <!-- ── Row 2: Portfolio & Application Data Table ──────────── -->
        <div class="content-panel-card" style="padding: 0;">
          <div class="table-top-toolbar">
            <div class="toolbar-title-group">
              <h3>{{ getQueueTabTitle() }}</h3>
              <p>{{ filteredPolicies.length }} policies displayed</p>
            </div>
            <div class="toolbar-actions">
              <span class="text-hint">Click row to open risk appraisal drawer</span>
            </div>
          </div>

          <div class="table-responsive" style="border: none;">
            <table class="data-table" aria-label="Underwriting Portfolio Queue">
              <thead>
                <tr>
                  <th>Policy Number</th>
                  <th>Product Tariff</th>
                  <th>Proposer</th>
                  <th>Vehicle &amp; Specs</th>
                  <th>Coverage Period</th>
                  <th class="th-num">Rated Premium &amp; Excess</th>
                  <th>Status</th>
                  <th style="text-align: right;">Adjudication</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let p of displayedPolicies"
                  (click)="selectPolicy(p)"
                  [class.is-selected]="selectedPolicy?.id === p.id"
                  style="cursor: pointer;"
                  title="Click to view detailed risk appraisal"
                >
                  <td>
                    <span class="font-mono font-semibold">{{ p.policyNumber }}</span>
                    <div *ngIf="p.renewedFromId" class="renewal-indicator">
                      ↳ Renewed from {{ p.renewedFromPolicyNumber || '#' + p.renewedFromId }}
                    </div>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getProductBadgeClass(p.productCode)">
                      {{ p.productCode || 'COMPREHENSIVE' }}
                    </span>
                  </td>
                  <td>
                    <div class="cell-primary">{{ p.customerName }}</div>
                    <div class="cell-secondary">{{ p.customerPhone }}</div>
                  </td>
                  <td>
                    <div class="font-mono cell-primary">{{ p.vehicleRegistrationNumber }}</div>
                    <div class="cell-secondary">{{ p.vehicleDescription }}</div>
                  </td>
                  <td class="cell-secondary" style="white-space: nowrap;">
                    {{ p.startDate | date:'MMM d, y' }} &rarr; {{ p.endDate | date:'MMM d, y' }}
                  </td>
                  <td class="td-num">
                    <strong class="font-mono">\${{ p.premium | number:'1.2-2' }}</strong>
                    <div class="excess-sub">
                      Excess: \${{ (p.deductibleAmount || 500) | number:'1.2-2' }}
                    </div>
                  </td>
                  <td>
                    <span class="status-badge" [ngClass]="'status-' + p.status.toLowerCase()">
                      {{ p.status }}
                    </span>
                    <div *ngIf="p.referralFlag" class="badge badge-warning" style="margin-top: 4px; font-size: 0.675rem;">
                      ⚠️ Referred
                    </div>
                  </td>
                  <td style="text-align: right;" (click)="$event.stopPropagation()">
                    <div class="row-action-btns">
                      <!-- Referral Adjudicate button -->
                      <button
                        *ngIf="p.referralFlag"
                        type="button"
                        class="btn-sm-emerald"
                        (click)="openReferralApproveModal(p)"
                        title="Adjudicate referred risk"
                      >
                        Adjudicate
                      </button>

                      <!-- Quick Approve button for DRAFT policies -->
                      <button
                        *ngIf="p.status === 'DRAFT' && !p.referralFlag"
                        type="button"
                        class="btn-sm-emerald"
                        (click)="quickApprovePolicy(p)"
                        title="Approve and issue policy coverage"
                      >
                        Approve
                      </button>

                      <!-- Quick Decline button for DRAFT policies -->
                      <button
                        *ngIf="p.status === 'DRAFT' && !p.referralFlag"
                        type="button"
                        class="btn-sm-danger"
                        (click)="openCancelModal(p)"
                        title="Decline proposal"
                      >
                        Decline
                      </button>

                      <!-- Quick Renew button for expiring policies -->
                      <button
                        *ngIf="p.status === 'ISSUED'"
                        type="button"
                        class="btn-sm-outline"
                        (click)="openRenewalModal(p)"
                        title="Prepare consecutive renewal term"
                      >
                        Renew
                      </button>

                      <!-- Open Details Drawer -->
                      <button
                        type="button"
                        class="btn-sm-secondary"
                        (click)="selectPolicy(p)"
                        title="View risk details"
                      >
                        Appraise
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Empty State -->
                <tr *ngIf="filteredPolicies.length === 0">
                  <td colspan="8">
                    <div class="empty-table-state">
                      <p>No policies match the selected queue criteria.</p>
                      <button class="btn btn-sm btn-secondary" (click)="resetFilters()">Reset Filter</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Table footer / Pagination bar -->
          <div *ngIf="filteredPolicies.length > pageSize" class="table-pagination-bar">
            <span class="pagination-info">
              Showing <strong>{{ startIndex }}–{{ endIndex }}</strong> of <strong>{{ filteredPolicies.length }}</strong> policies
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

      </div>

      <!-- ── Right-Side Contextual Underwriting Details Drawer ──── -->
      <aside *ngIf="selectedPolicy && showDetailDrawer" class="keeper-detail-drawer" aria-label="Risk Appraisal">
        <div class="drawer-header">
          <div class="drawer-title-group">
            <span class="drawer-sub">Underwriting Risk Appraisal</span>
            <h4>{{ selectedPolicy.policyNumber }}</h4>
          </div>
          <button type="button" class="drawer-close-btn" (click)="closeDetailDrawer()" aria-label="Close drawer">✕</button>
        </div>

        <div class="drawer-body">
          <!-- Status Banner -->
          <div class="drawer-badge-row">
            <span class="status-badge" [ngClass]="'status-' + selectedPolicy.status.toLowerCase()">
              {{ selectedPolicy.status }}
            </span>
            <span class="drawer-product-code">{{ selectedPolicy.productCode || 'COMPREHENSIVE' }}</span>
          </div>

          <!-- Quick Decision Prompt for Referral policies -->
          <div *ngIf="selectedPolicy.referralFlag" class="decision-alert-card" style="border-left: 4px solid #f59e0b; background: #fffbeb;">
            <div class="decision-title" style="color: #b45309;">⚠️ Policy Under Senior Referral</div>
            <p class="decision-desc">{{ selectedPolicy.referralReason || 'This risk exceeds standard underwriter binding limits and requires referral approval.' }}</p>
            <div class="decision-btns">
              <button type="button" class="btn-emerald-solid" (click)="openReferralApproveModal(selectedPolicy)">
                Adjudicate &amp; Approve Referral
              </button>
              <button type="button" class="btn-outline-danger" (click)="openReferralRejectModal(selectedPolicy)">
                Decline / Reject Referral
              </button>
            </div>
          </div>

          <!-- Quick Decision Prompt for DRAFT proposals -->
          <div *ngIf="selectedPolicy.status === 'DRAFT' && !selectedPolicy.referralFlag" class="decision-alert-card">
            <div class="decision-title">Proposal Pending Adjudication</div>
            <p class="decision-desc">Risk data and vehicle valuation have been captured. Underwriter approval is required to bind coverage.</p>
            <div class="decision-btns">
              <button type="button" class="btn-emerald-solid" (click)="quickApprovePolicy(selectedPolicy)">
                Approve &amp; Issue Policy
              </button>
              <button type="button" class="btn-outline-danger" (click)="openCancelModal(selectedPolicy)">
                Decline Proposal
              </button>
            </div>
          </div>

          <!-- Section: Proposer & Vehicle Facts -->
          <div class="drawer-key-facts">
            <div class="fact-heading">Proposer &amp; Risk Subject</div>
            <div class="fact-row">
              <span class="fact-label">Policyholder</span>
              <span class="fact-val font-semibold">{{ selectedPolicy.customerName }}</span>
            </div>
            <div class="fact-row">
              <span class="fact-label">Phone</span>
              <span class="fact-val">{{ selectedPolicy.customerPhone }}</span>
            </div>
            <div class="fact-row">
              <span class="fact-label">Vehicle</span>
              <span class="fact-val font-semibold">{{ selectedPolicy.vehicleDescription }}</span>
            </div>
            <div class="fact-row">
              <span class="fact-label">License Plate</span>
              <span class="fact-val font-mono">{{ selectedPolicy.vehicleRegistrationNumber }}</span>
            </div>
            <div class="fact-row">
              <span class="fact-label">Policy Excess / Deductible</span>
              <span class="fact-val font-mono">\${{ selectedPolicy.deductibleAmount | number:'1.2-2' }}</span>
            </div>
          </div>

          <!-- Section: Underwriting & Premium Structure -->
          <div class="drawer-key-facts">
            <div class="fact-heading">Underwriting &amp; Premium Structure</div>
            <div class="fact-row">
              <span class="fact-label">Gross Rated Premium</span>
              <span class="fact-val font-semibold text-emerald">\${{ selectedPolicy.premium | number:'1.2-2' }}</span>
            </div>
            <div class="fact-row">
              <span class="fact-label">Compulsory Excess / Deductible</span>
              <span class="fact-val font-mono">\${{ (selectedPolicy.deductibleAmount || 500) | number:'1.2-2' }}</span>
            </div>
            <div class="fact-row">
              <span class="fact-label">Risk Tariff Classification</span>
              <span class="fact-val font-semibold">{{ selectedPolicy.productCode || 'COMPREHENSIVE' }}</span>
            </div>
            <div class="fact-row">
              <span class="fact-label">Underwritten Period</span>
              <span class="fact-val">{{ selectedPolicy.startDate | date:'MMM d, y' }} &rarr; {{ selectedPolicy.endDate | date:'MMM d, y' }}</span>
            </div>
            <div class="fact-row" *ngIf="selectedPolicy.coverageDescription">
              <span class="fact-label">Coverage Terms</span>
              <span class="fact-val" style="font-size: 0.775rem; color: #475569; text-align: right; max-width: 200px;">
                {{ selectedPolicy.coverageDescription }}
              </span>
            </div>
            <div class="fact-row" *ngIf="selectedPolicy.vehicleMarketValue">
              <span class="fact-label">Insured Vehicle Value</span>
              <span class="fact-val font-mono font-semibold">\${{ selectedPolicy.vehicleMarketValue | number:'1.2-2' }}</span>
            </div>
            <div class="fact-row" *ngIf="selectedPolicy.underwritingSubjectivities">
              <span class="fact-label">Subjectivities &amp; Conditions</span>
              <span class="fact-val" style="font-size: 0.775rem; color: #b45309; text-align: right; max-width: 200px;">
                {{ selectedPolicy.underwritingSubjectivities }}
              </span>
            </div>
          </div>

          <!-- Section: Billing Schedules -->
          <div *ngIf="selectedPolicy.billingSchedules && selectedPolicy.billingSchedules.length > 0" class="drawer-key-facts">
            <div class="fact-heading">Premium Billing Schedules ({{ selectedPolicy.billingSchedules.length }})</div>
            <div *ngFor="let bs of selectedPolicy.billingSchedules" style="padding: 6px 0; border-bottom: 1px dashed #f1f5f9; font-size: 0.775rem;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>Installment {{ bs.installmentNumber }} / {{ bs.totalInstallments }}</strong>
                <span class="badge" [class.badge-success]="bs.status === 'PAID'" [class.badge-warning]="bs.status === 'PENDING'" [class.badge-danger]="bs.status === 'OVERDUE'" style="font-size: 0.65rem;">
                  {{ bs.status }}
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; color: #64748b; margin-top: 2px;">
                <span>Due: {{ bs.dueDate | date:'MMM d, y' }}</span>
                <span class="font-mono font-semibold text-emerald">\${{ bs.amountDue | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <!-- Section: Endorsement History -->
          <div class="drawer-key-facts">
            <div class="fact-heading">Endorsements &amp; Amendments ({{ selectedPolicyEndorsements.length }})</div>
            <div *ngIf="selectedPolicyEndorsements.length === 0" class="empty-sub-fact">
              No mid-term endorsements applied.
            </div>
            <div *ngFor="let end of selectedPolicyEndorsements" class="endorsement-item-card">
              <div class="end-type">{{ end.endorsementType }} · {{ end.endorsementNumber }}</div>
              <div class="end-reason"><strong>Reason:</strong> {{ end.reason }}</div>
              <div class="end-summary">{{ end.changesSummary }}</div>
              <div class="end-date">Effective: {{ end.effectiveDate | date:'mediumDate' }}</div>
            </div>
          </div>

          <!-- Section: Underwriting Actions -->
          <div class="drawer-action-group">
            <button
              *ngIf="selectedPolicy.status === 'ISSUED'"
              type="button"
              class="btn-outline-action"
              (click)="openEndorsementModal(selectedPolicy)"
            >
              + Add Legal Endorsement
            </button>

            <button
              *ngIf="selectedPolicy.status === 'ISSUED'"
              type="button"
              class="btn-outline-action"
              (click)="openRenewalModal(selectedPolicy)"
            >
              Issue Consecutive Renewal Term
            </button>

            <button
              *ngIf="selectedPolicy.status === 'ISSUED'"
              type="button"
              class="btn-outline-danger"
              (click)="openCancelModal(selectedPolicy)"
            >
              Revoke / Cancel Coverage
            </button>

            <a [routerLink]="['/policies', selectedPolicy.id]" class="btn-emerald-solid">
              Open Full Policy Record &rarr;
            </a>
          </div>
        </div>
      </aside>

      <!-- ── Modal 1: Actuarial Motor Rating Engine ──────────────── -->
      <div *ngIf="showQuoteModal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title-rating">
        <div class="modal-dialog modal-dialog-lg">
          <div class="modal-header">
            <h3 id="modal-title-rating">Actuarial Motor Rating Engine</h3>
            <button type="button" class="modal-close-btn" (click)="closeQuoteModal()" aria-label="Close modal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="rate-vehicle-select">Select Insured Subject Vehicle *</label>
                <select id="rate-vehicle-select" class="form-control" [(ngModel)]="quoteSelectedVehicleId">
                  <option *ngFor="let v of allVehicles" [value]="v.id">
                    {{ v.registrationNumber }} — {{ v.make }} {{ v.model }} ({{ v.manufactureYear }})
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="rate-product">Product Tariff Classification *</label>
                <select id="rate-product" class="form-control" [(ngModel)]="quoteProductCode">
                  <option value="COMPREHENSIVE">Comprehensive (Full accidental + theft + liability)</option>
                  <option value="THIRD_PARTY">Third Party Statutory Liability Only</option>
                  <option value="FIRE_AND_THEFT">Third Party Fire &amp; Theft</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="rate-value">Vehicle Valuation / Insured Value ($) *</label>
                <input id="rate-value" type="number" class="form-control font-semibold" [(ngModel)]="quoteVehicleValue" placeholder="20000" />
              </div>

              <div class="form-group">
                <label class="form-label">Proposer / Registered Owner</label>
                <input type="text" class="form-control" [value]="getQuoteSelectedVehicleOwner()" readonly style="background: #f8fafc;" />
              </div>
            </div>

            <button class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;" (click)="calculateQuote()">
              Run Actuarial Rating Calculation
            </button>

            <!-- Rated Output -->
            <div *ngIf="quoteResult" class="quote-result">
              <div class="quote-result-label">Actuarial Rated Quote Breakdown</div>
              <div class="quote-result-total">\${{ quoteResult.totalPremium | number:'1.2-2' }}</div>
              <div class="quote-rows">
                <div class="quote-row"><span>Base Tariff Premium</span><span>\${{ quoteResult.basePremium | number:'1.2-2' }}</span></div>
                <div class="quote-row"><span>Vehicle Age &amp; Risk Adjustment</span><span>\${{ quoteResult.riskAdjustment | number:'1.2-2' }}</span></div>
                <div class="quote-row"><span>Taxes &amp; Statutory Regulatory Fees (15%)</span><span>\${{ quoteResult.taxesAndFees | number:'1.2-2' }}</span></div>
                <div class="quote-row quote-row-strong"><span>Compulsory Excess / Deductible</span><span>\${{ quoteResult.deductibleAmount | number:'1.2-2' }}</span></div>
              </div>

              <!-- High Value Warning -->
              <div *ngIf="quoteVehicleValue > (currentUserAuthority?.maxSumInsured || 150000)" class="alert alert-warning" style="margin-top: 0.75rem; font-size: 0.8rem; background: #fffbeb; border: 1px solid #fde68a; padding: 0.5rem 0.75rem; border-radius: 6px; color: #92400e;">
                ⚠️ <strong>High-Value Risk:</strong> Vehicle sum insured (\${{ quoteVehicleValue | number }}) exceeds your underwriter binding authority (\${{ (currentUserAuthority?.maxSumInsured || 150000) | number }}). This policy will be routed to the Referral Queue.
              </div>

              <!-- Underwriting Discretionary Adjustments -->
              <div class="form-grid" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed #cbd5e1;">
                <div class="form-group">
                  <label class="form-label">Underwriter Risk Loading (+%)</label>
                  <input type="number" min="0" [max]="(currentUserAuthority?.maxLoadingPercentage || 0.3) * 100" class="form-control" [(ngModel)]="quoteLoadingPercent" (input)="recalculateDiscretionary()" />
                  <span style="font-size: 0.7rem; color: #64748b;">Max Authority: +{{ (currentUserAuthority?.maxLoadingPercentage || 0.3) * 100 }}%</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Commercial Discount (-%)</label>
                  <input type="number" min="0" [max]="(currentUserAuthority?.maxDiscountPercentage || 0.2) * 100" class="form-control" [(ngModel)]="quoteDiscountPercent" (input)="recalculateDiscretionary()" />
                  <span style="font-size: 0.7rem; color: #64748b;">Max Authority: -{{ (currentUserAuthority?.maxDiscountPercentage || 0.2) * 100 }}%</span>
                </div>
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Underwriting Subjectivities &amp; Conditions</label>
                  <input type="text" class="form-control" [(ngModel)]="quoteSubjectivities" placeholder="e.g. Tracker installed within 14 days, garaged overnight at depot" />
                </div>
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Billing Installment Schedule Plan</label>
                  <select class="form-control" [(ngModel)]="quoteInstallmentsCount">
                    <option [ngValue]="1">Single Full Payment (100% on inception)</option>
                    <option [ngValue]="2">2 Bi-annual Installments (50% / 50%)</option>
                    <option [ngValue]="4">4 Quarterly Installments (25% quarterly)</option>
                  </select>
                </div>
              </div>

              <!-- Term Duration for Underwriting -->
              <div class="form-grid" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed #cbd5e1;">
                <div class="form-group">
                  <label class="form-label">Term Inception Date *</label>
                  <input type="date" class="form-control" [(ngModel)]="quoteStartDate" (change)="onQuoteStartDateChange()" />
                </div>
                <div class="form-group">
                  <label class="form-label">Term Expiration Date *</label>
                  <input type="date" class="form-control" [(ngModel)]="quoteEndDate" />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeQuoteModal()">Close</button>
            <ng-container *ngIf="quoteResult">
              <button class="btn btn-secondary" (click)="bindQuotePolicy('DRAFT')" [disabled]="submittingQuotePolicy">
                {{ submittingQuotePolicy ? 'Saving…' : 'Save as Proposal (DRAFT)' }}
              </button>
              <button class="btn btn-primary" (click)="bindQuotePolicy('ISSUED')" [disabled]="submittingQuotePolicy">
                {{ submittingQuotePolicy ? 'Binding…' : 'Bind & Issue Policy (ISSUED)' }}
              </button>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- ── Modal: Referral Approval Adjudication ──────────────── -->
      <div *ngIf="showReferralApproveModal && selectedPolicy" class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Adjudicate &amp; Approve Referral · {{ selectedPolicy.policyNumber }}</h3>
            <button type="button" class="modal-close-btn" (click)="showReferralApproveModal = false" aria-label="Close modal">✕</button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning" style="font-size: 0.8rem; background: #fffbeb; border: 1px solid #fde68a; padding: 0.75rem; border-radius: 6px; color: #92400e; margin-bottom: 1rem;">
              <strong>Referral Reason:</strong> {{ selectedPolicy.referralReason }}
            </div>
            <div class="form-group">
              <label class="form-label">Underwriting Subjectivities &amp; Binding Conditions *</label>
              <textarea
                class="form-control"
                rows="4"
                [(ngModel)]="referralApproveSubjectivities"
                placeholder="Enter mandatory conditions (e.g. Approved subject to telematics tracker within 14 days and driver age >= 25)..."
              ></textarea>
              <span style="font-size: 0.725rem; color: #64748b; margin-top: 4px; display: block;">
                These conditions will be stamped onto the binding schedule and certificate.
              </span>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showReferralApproveModal = false">Cancel</button>
            <button type="button" class="btn btn-primary" (click)="submitReferralApprove()" [disabled]="submittingReferralApprove">
              {{ submittingReferralApprove ? 'Binding…' : 'Approve & Bind (ISSUED)' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── Modal: Referral Rejection ───────────────────────────── -->
      <div *ngIf="showReferralRejectModal && selectedPolicy" class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Decline Referred Risk · {{ selectedPolicy.policyNumber }}</h3>
            <button type="button" class="modal-close-btn" (click)="showReferralRejectModal = false" aria-label="Close modal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Mandatory Decline Rationale *</label>
              <textarea
                class="form-control"
                rows="4"
                [(ngModel)]="referralRejectReason"
                placeholder="State specific risk rationale for non-acceptance (e.g. Unfavorable claims ratio, driver history, high risk vehicle category)..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showReferralRejectModal = false">Cancel</button>
            <button type="button" class="btn btn-outline-danger" (click)="submitReferralReject()" [disabled]="submittingReferralReject">
              {{ submittingReferralReject ? 'Declining…' : 'Confirm Decline (CANCELLED)' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── Modal 3: Add Legal Endorsement ─────────────────────── -->
      <div *ngIf="showEndorsementModal && selectedPolicy" class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Add Endorsement · {{ selectedPolicy.policyNumber }}</h3>
            <button type="button" class="modal-close-btn" (click)="closeEndorsementModal()" aria-label="Close modal">✕</button>
          </div>
          <div class="modal-body">
            <form (ngSubmit)="submitEndorsement()">
              <div class="form-group">
                <label class="form-label" for="end-type">Endorsement Classification *</label>
                <select id="end-type" class="form-control" [(ngModel)]="endorsementType" name="endType" required>
                  <option value="COVERAGE_MODIFICATION">Coverage Modification</option>
                  <option value="DRIVER_ADDITION">Named Driver Addition</option>
                  <option value="VEHICLE_AMENDMENT">Vehicle Registration Amendment</option>
                  <option value="DEDUCTIBLE_UPDATE">Excess / Deductible Adjustment</option>
                  <option value="ADDRESS_CHANGE">Policyholder Address Relocation</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="end-reason">Justification / Reason *</label>
                <input
                  id="end-reason"
                  type="text"
                  class="form-control"
                  [(ngModel)]="endorsementReason"
                  name="endReason"
                  placeholder="e.g. Policyholder requested add-on collision rider"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="end-summary">Legal Wording &amp; Changes Summary *</label>
                <textarea
                  id="end-summary"
                  class="form-control"
                  rows="3"
                  [(ngModel)]="endorsementSummary"
                  name="endSummary"
                  placeholder="Detail the exact clause adjustments..."
                  required
                ></textarea>
              </div>

              <div class="form-group">
                <label class="form-label" for="end-date">Effective Date *</label>
                <input
                  id="end-date"
                  type="date"
                  class="form-control"
                  [(ngModel)]="endorsementEffectiveDate"
                  name="endDate"
                  required
                />
              </div>

              <div class="modal-footer" style="padding: 1rem 0 0;">
                <button type="button" class="btn btn-secondary" (click)="closeEndorsementModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submittingEndorsement">
                  {{ submittingEndorsement ? 'Appending...' : 'Bind Endorsement' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- ── Modal 4: Consecutive Renewal Issuance ──────────────── -->
      <div *ngIf="showRenewalModal && renewalTargetPolicy" class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Issue Consecutive Renewal Term</h3>
            <button type="button" class="modal-close-btn" (click)="closeRenewalModal()" aria-label="Close modal">✕</button>
          </div>
          <div class="modal-body">
            <p class="text-hint" style="margin-bottom: 1rem;">
              Consecutive renewal for policy <strong>{{ renewalTargetPolicy.policyNumber }}</strong>
              ({{ renewalTargetPolicy.customerName }} · {{ renewalTargetPolicy.vehicleRegistrationNumber }}).
            </p>

            <form (ngSubmit)="submitRenewal()">
              <div class="form-group">
                <label class="form-label" for="ren-start">Renewal Effective Date *</label>
                <input id="ren-start" type="date" class="form-control" [(ngModel)]="renewalStartDate" name="renStart" required />
              </div>

              <div class="form-group">
                <label class="form-label" for="ren-end">Renewal Expiry Date *</label>
                <input id="ren-end" type="date" class="form-control" [(ngModel)]="renewalEndDate" name="renEnd" required />
              </div>

              <div class="form-group">
                <label class="form-label" for="ren-prem">Renewal Premium ($) *</label>
                <input
                  id="ren-prem"
                  type="number"
                  step="0.01"
                  class="form-control font-semibold"
                  [(ngModel)]="renewalPremium"
                  name="renPrem"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="ren-ded">Policy Excess / Deductible ($) *</label>
                <input id="ren-ded" type="number" class="form-control" [(ngModel)]="renewalDeductible" name="renDed" required />
              </div>

              <div class="modal-footer" style="padding: 1rem 0 0;">
                <button type="button" class="btn btn-secondary" (click)="closeRenewalModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submittingRenewal">
                  {{ submittingRenewal ? 'Issuing Renewal…' : 'Issue Consecutive Renewal' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- ── Modal 5: Cancel / Decline Coverage ─────────────────── -->
      <div *ngIf="showCancelModal && cancelTargetPolicy" class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>{{ cancelTargetPolicy.status === 'DRAFT' ? 'Decline Insurance Proposal' : 'Revoke / Cancel Policy Coverage' }}</h3>
            <button type="button" class="modal-close-btn" (click)="closeCancelModal()" aria-label="Close modal">✕</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 0.85rem; color: #dc2626; margin-bottom: 1rem;">
              <span *ngIf="cancelTargetPolicy.status === 'DRAFT'">
                Are you sure you want to decline proposal <strong>{{ cancelTargetPolicy.policyNumber }}</strong>?
                This will reject the submission and close the review file.
              </span>
              <span *ngIf="cancelTargetPolicy.status !== 'DRAFT'">
                Are you sure you want to cancel policy <strong>{{ cancelTargetPolicy.policyNumber }}</strong>?
                This will immediately terminate coverage liability.
              </span>
            </p>

            <form (ngSubmit)="submitCancellation()">
              <div class="form-group">
                <label class="form-label" for="cancel-reason">
                  {{ cancelTargetPolicy.status === 'DRAFT' ? 'Underwriting Decline Justification *' : 'Underwriting Cancellation Reason *' }}
                </label>
                <textarea
                  id="cancel-reason"
                  class="form-control"
                  rows="3"
                  [(ngModel)]="cancellationReason"
                  name="cancelReason"
                  [placeholder]="cancelTargetPolicy.status === 'DRAFT' ? 'e.g. Excessive risk profile; unacceptable claim history; vehicle non-compliance' : 'e.g. Material non-disclosure of commercial usage; customer non-payment'"
                  required
                ></textarea>
              </div>

              <div class="modal-footer" style="padding: 1rem 0 0;">
                <button type="button" class="btn btn-secondary" (click)="closeCancelModal()">Back</button>
                <button type="submit" class="btn btn-danger" [disabled]="submittingCancel">
                  {{ submittingCancel ? 'Processing…' : (cancelTargetPolicy.status === 'DRAFT' ? 'Confirm Decline Proposal' : 'Confirm Coverage Cancellation') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .keeper-dash-layout {
      position: relative;
      display: flex;
      flex-direction: column;
      min-height: 100%;
    }

    /* ── Topbar ──────────────────────────────────────────────── */
    .keeper-topbar {
      position: sticky;
      top: 0;
      z-index: 30;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 2rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      gap: 1.5rem;
      flex-wrap: wrap;

      @media (max-width: 768px) {
        padding: 1rem;
        gap: 0.75rem;
      }
    }

    .breadcrumb-nav {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.825rem;
      font-weight: 500;
    }

    .bc-crumb {
      color: #64748b;
      text-decoration: none;
    }

    .bc-crumb:hover {
      color: #0f172a;
    }

    .bc-separator {
      color: #cbd5e1;
    }

    .bc-current {
      color: #0f172a;
      font-weight: 600;
    }

    .global-search-box {
      position: relative;
      display: flex;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 0.45rem 1rem 0.45rem 0.85rem;
      width: 320px;
      transition: all 0.15s ease;

      @media (max-width: 640px) {
        width: 100%;
      }
    }

    .global-search-box:focus-within {
      background: #ffffff;
      border-color: #059669;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }

    .global-search-input {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.825rem;
      color: #0f172a;
    }

    .global-search-input::placeholder {
      color: #94a3b8;
    }

    .search-magnifier-icon {
      color: #94a3b8;
      flex-shrink: 0;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-outline-action {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #334155;
      padding: 0.45rem 0.85rem;
      border-radius: 8px;
      font-size: 0.825rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.12s ease;
    }

    .btn-outline-action:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .btn-emerald-add {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background-color: #10b981;
      color: #ffffff;
      padding: 0.45rem 0.95rem;
      border-radius: 8px;
      font-size: 0.825rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: background-color 0.12s ease;
    }

    .btn-emerald-add:hover {
      background-color: #059669;
    }

    .user-header-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.775rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    /* ── Subheader ───────────────────────────────────────────── */
    .keeper-subheader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 2rem 0.75rem;
      flex-wrap: wrap;
      gap: 1rem;

      @media (max-width: 768px) {
        padding: 1rem;
      }
    }

    .subheader-heading h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin: 0;
    }

    .desk-badge {
      font-size: 0.75rem;
      font-weight: 600;
      color: #4f46e5;
      background: #eef2ff;
      padding: 2px 8px;
      border-radius: 6px;
      margin-top: 4px;
      display: inline-block;
    }

    .subheader-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .pill-filter-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 0.4rem 0.85rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.12s ease;
    }

    .pill-filter-btn:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .pill-filter-btn.active {
      background: #1e293b;
      border-color: #1e293b;
      color: #ffffff;
    }

    .badge-counter-amber {
      background: #f97316;
      color: #ffffff;
      font-size: 0.675rem;
      padding: 1px 6px;
      border-radius: 10px;
      font-weight: 700;
    }

    /* ── Content Body ────────────────────────────────────────── */
    .dash-content-body {
      padding: 0.5rem 2rem 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;

      @media (max-width: 768px) {
        padding: 0.5rem 1rem 1.5rem;
      }
    }

    .uw-notice-banner {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.85rem 1.25rem;
      border-radius: 10px;
      flex-wrap: wrap;
    }

    .notice-amber {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-left: 4px solid #f59e0b;
      color: #78350f;
    }

    .notice-icon {
      color: #d97706;
      flex-shrink: 0;
    }

    .notice-body {
      flex: 1;
      font-size: 0.835rem;
      line-height: 1.4;
      min-width: 220px;
    }

    /* ── KPI Row ─────────────────────────────────────────────── */
    .kpi-metrics-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;

      @media (max-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
      }
      @media (max-width: 580px) {
        grid-template-columns: 1fr;
      }
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem 1.35rem 1.1rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.02);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.15s ease;
    }

    .kpi-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.05);
    }

    .kpi-label {
      font-size: 0.825rem;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 0.65rem;
    }

    .kpi-value-row {
      display: flex;
      align-items: baseline;
      gap: 0.65rem;
      margin-bottom: 0.4rem;
    }

    .kpi-value {
      font-size: 1.65rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.03em;
    }

    .kpi-trend-pill {
      font-size: 0.725rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }

    .kpi-trend-pill.positive {
      color: #16a34a;
      background: #f0fdf4;
    }

    .kpi-trend-pill.negative {
      color: #dc2626;
      background: #fef2f2;
    }

    .kpi-sub-text {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* ── Content Panel Card & Table ──────────────────────────── */
    .content-panel-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.02);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 480px;

      .table-responsive {
        flex: 1;
        min-height: 0;
      }

      .table-pagination-bar {
        margin-top: auto;
        flex-shrink: 0;
      }
    }

    .table-top-toolbar {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .toolbar-title-group h3 {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .toolbar-title-group p {
      font-size: 0.75rem;
      color: #64748b;
      margin: 2px 0 0;
    }

    .text-hint {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.835rem;
    }

    .data-table th {
      background: #f8fafc;
      padding: 0.75rem 1.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }

    .data-table td {
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      vertical-align: middle;
    }

    .data-table tr:hover td {
      background: #f8fafc;
    }

    .data-table tr.is-selected td {
      background: #f0fdf4;
    }

    .font-mono {
      font-variant-numeric: tabular-nums;
    }

    .font-semibold {
      font-weight: 600;
      color: #0f172a;
    }

    .cell-primary {
      font-weight: 600;
      color: #0f172a;
    }

    .cell-secondary {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 1px;
    }

    .renewal-indicator {
      font-size: 0.7rem;
      color: #4f46e5;
      margin-top: 2px;
    }

    .excess-sub {
      font-size: 0.7rem;
      color: #64748b;
      margin-top: 2px;
    }

    .badge-counter-amber {
      background: #f97316;
      color: #ffffff;
      font-size: 0.675rem;
      padding: 1px 6px;
      border-radius: 10px;
    }

    .row-action-btns {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    .btn-sm-emerald {
      background: #10b981;
      color: #ffffff;
      border: none;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.12s;
    }

    .btn-sm-emerald:hover {
      background: #059669;
    }

    .btn-sm-danger {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fecaca;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.12s;
    }

    .btn-sm-danger:hover {
      background: #fca5a5;
    }

    .btn-sm-outline {
      background: transparent;
      border: 1px solid #cbd5e1;
      color: #334155;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-sm-outline:hover {
      background: #f1f5f9;
    }

    .btn-sm-secondary {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #475569;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-sm-secondary:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .empty-table-state {
      padding: 3rem;
      text-align: center;
      color: #94a3b8;
    }

    /* ── Right-Side Detail Drawer ────────────────────────────── */
    .keeper-detail-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 400px;
      background: #ffffff;
      border-left: 1px solid #e2e8f0;
      box-shadow: -4px 0 24px rgba(15, 23, 42, 0.08);
      z-index: 50;
      display: flex;
      flex-direction: column;
      animation: slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      @media (max-width: 480px) {
        width: 100vw;
      }
    }

    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }

    .drawer-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .drawer-title-group h4 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .drawer-sub {
      font-size: 0.725rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .drawer-close-btn {
      background: transparent;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      cursor: pointer;
    }

    .drawer-close-btn:hover {
      background: #f8fafc;
      color: #0f172a;
    }

    .drawer-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }

    .drawer-badge-row {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .drawer-product-code {
      font-size: 0.75rem;
      background: #f1f5f9;
      color: #475569;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
    }

    .decision-alert-card {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 1rem;
    }

    .decision-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 4px;
    }

    .decision-desc {
      font-size: 0.775rem;
      color: #78350f;
      line-height: 1.4;
      margin-bottom: 0.75rem;
    }

    .decision-btns {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .drawer-key-facts {
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .fact-heading {
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.35rem;
    }

    .fact-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8125rem;
    }

    .fact-label {
      color: #64748b;
    }

    .fact-val {
      color: #0f172a;
    }

    .text-emerald {
      color: #059669;
    }

    .endorsement-item-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 0.6rem;
      font-size: 0.75rem;
      margin-top: 4px;
    }

    .end-type {
      font-weight: 700;
      color: #4f46e5;
      margin-bottom: 2px;
    }

    .end-reason {
      color: #334155;
    }

    .end-summary {
      color: #64748b;
      margin-top: 2px;
    }

    .end-date {
      color: #94a3b8;
      font-size: 0.7rem;
      margin-top: 4px;
    }

    .empty-sub-fact {
      font-size: 0.75rem;
      color: #94a3b8;
      font-style: italic;
    }

    .drawer-action-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .btn-emerald-solid {
      background: #10b981;
      color: #ffffff;
      border-radius: 8px;
      padding: 0.55rem;
      font-weight: 600;
      font-size: 0.825rem;
      text-align: center;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: background 0.12s ease;
    }

    .btn-emerald-solid:hover {
      background: #059669;
      color: #ffffff;
    }

    .btn-outline-danger {
      background: transparent;
      border: 1px solid #fca5a5;
      color: #dc2626;
      border-radius: 8px;
      padding: 0.5rem;
      font-weight: 600;
      font-size: 0.8rem;
      cursor: pointer;
      text-align: center;
      transition: all 0.12s;
    }

    .btn-outline-danger:hover {
      background: #fef2f2;
      border-color: #ef4444;
    }

    /* ── Modals & Rating Engine ──────────────────────────────── */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(2px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-dialog {
      background: #ffffff;
      border-radius: 12px;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      animation: modalFadeIn 0.15s ease;
    }

    .modal-dialog-lg {
      max-width: 680px;
    }

    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.97); }
      to   { opacity: 1; transform: scale(1); }
    }

    .modal-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-header h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .modal-body {
      padding: 1.5rem;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      margin-bottom: 0.85rem;
    }

    .form-label {
      display: block;
      font-size: 0.775rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.35rem;
    }

    .form-control {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.835rem;
      color: #0f172a;
      background: #ffffff;
      outline: none;
      box-sizing: border-box;
      font-family: inherit;
    }

    .form-control:focus {
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
    }

    .field-hint {
      font-size: 0.725rem;
      color: #dc2626;
      margin-top: 2px;
      display: block;
    }

    .quote-result {
      margin-top: 1.25rem;
      padding: 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
    }

    .quote-result-label {
      font-size: 0.7rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 700;
    }

    .quote-result-total {
      font-size: 1.6rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.025em;
      margin: 4px 0 8px;
    }

    .quote-rows {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .quote-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: #475569;
    }

    .quote-row-strong {
      font-weight: 600;
      border-top: 1px solid #e2e8f0;
      padding-top: 4px;
      margin-top: 2px;
      color: #0f172a;
    }
  `]
})
export class UnderwriterDashboardComponent implements OnInit {
  summary: DashboardSummary | null = null;
  policies: Policy[] = [];
  filteredPolicies: Policy[] = [];
  expiringPolicies: Policy[] = [];
  allVehicles: Vehicle[] = [];

  // Pagination state
  pageSize = 6;
  currentPage = 1;

  get totalPages(): number {
    return Math.ceil(this.filteredPolicies.length / this.pageSize) || 1;
  }

  get startIndex(): number {
    if (this.filteredPolicies.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredPolicies.length);
  }

  get displayedPolicies(): Policy[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredPolicies.slice(start, start + this.pageSize);
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

  // Queue state
  activeQueueTab: 'ALL' | 'DRAFT' | 'REFERRAL' | 'ISSUED' | 'EXPIRING' | 'RENEWED' = 'ALL';
  filterQuery = '';
  error: ApiErrorResponse | null = null;
  currentUserAuthority: UnderwriterAuthority | null = null;

  // Selected policy & detail drawer
  selectedPolicy: Policy | null = null;
  selectedPolicyEndorsements: Endorsement[] = [];
  showDetailDrawer = false;

  // Modal 1: Actuarial Rating Engine
  showQuoteModal = false;
  quoteSelectedVehicleId: number | null = null;
  quoteProductCode = 'COMPREHENSIVE';
  quoteVehicleValue = 20000;
  quoteOriginalResult: QuoteCalculationDto | null = null;
  quoteResult: QuoteCalculationDto | null = null;
  quoteLoadingPercent = 0;
  quoteDiscountPercent = 0;
  quoteSubjectivities = '';
  quoteInstallmentsCount = 1;
  quoteStartDate = new Date().toISOString().substring(0, 10);
  quoteEndDate = '';
  submittingQuotePolicy = false;

  // Referral Adjudication Modals
  showReferralApproveModal = false;
  referralApproveSubjectivities = '';
  submittingReferralApprove = false;
  showReferralRejectModal = false;
  referralRejectReason = '';
  submittingReferralReject = false;

  // Modal 3: Endorsement
  showEndorsementModal = false;
  endorsementType = 'COVERAGE_MODIFICATION';
  endorsementReason = '';
  endorsementSummary = '';
  endorsementEffectiveDate = new Date().toISOString().substring(0, 10);
  submittingEndorsement = false;

  // Modal 4: Renewal
  showRenewalModal = false;
  renewalTargetPolicy: Policy | null = null;
  renewalStartDate = '';
  renewalEndDate = '';
  renewalPremium = 0;
  renewalDeductible = 500;
  submittingRenewal = false;

  // Modal 5: Cancellation
  showCancelModal = false;
  cancelTargetPolicy: Policy | null = null;
  cancellationReason = '';
  submittingCancel = false;

  constructor(
    public authService: AuthService,
    private dashboardService: DashboardService,
    private policyService: PolicyService,
    private vehicleService: VehicleService,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initDefaultDates();
    this.loadData();
  }

  private initDefaultDates(): void {
    const today = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(today.getFullYear() + 1);
    oneYearLater.setDate(oneYearLater.getDate() - 1);
    this.quoteEndDate = oneYearLater.toISOString().substring(0, 10);
  }

  loadData(): void {
    this.error = null;

    this.dashboardService.getSummary().subscribe({
      next: (res) => {
        this.summary = res;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err;
        this.cdr.markForCheck();
      }
    });

    this.policyService.getPolicies().subscribe({
      next: (list) => {
        this.policies = list;
        this.applyFilter();
        if (this.filteredPolicies.length > 0 && !this.selectedPolicy) {
          this.selectPolicy(this.filteredPolicies[0]);
        }
        this.cdr.markForCheck();
      }
    });

    this.policyService.getExpiringPolicies(30).subscribe({
      next: (exp) => {
        this.expiringPolicies = exp;
        this.cdr.markForCheck();
      }
    });

    this.vehicleService.getVehicles().subscribe({
      next: (vehs) => {
        this.allVehicles = vehs;
        if (vehs.length > 0 && !this.quoteSelectedVehicleId) {
          this.quoteSelectedVehicleId = vehs[0].id;
        }
        this.cdr.markForCheck();
      }
    });

    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        const curName = this.authService.currentUser?.username || 'alexander.uw';
        const found = users.find(u => u.username === curName);
        if (found?.authority) {
          this.currentUserAuthority = found.authority;
        } else {
          this.currentUserAuthority = {
            maxSumInsured: 150000,
            maxLoadingPercentage: 0.25,
            maxDiscountPercentage: 0.15,
            canApproveReferrals: true
          };
        }
        this.cdr.markForCheck();
      }
    });
  }

  get draftCount(): number {
    return this.policies.filter(p => p.status === 'DRAFT' && !p.referralFlag).length;
  }

  get referralCount(): number {
    return this.policies.filter(p => p.referralFlag).length;
  }

  get activeCount(): number {
    return this.policies.filter(p => p.status === 'ISSUED').length;
  }

  get renewedCount(): number {
    return this.policies.filter(p => p.status === 'RENEWED').length;
  }

  setQueueTab(tab: 'ALL' | 'DRAFT' | 'REFERRAL' | 'ISSUED' | 'EXPIRING' | 'RENEWED'): void {
    this.activeQueueTab = tab;
    this.applyFilter();
  }

  getQueueTabTitle(): string {
    switch (this.activeQueueTab) {
      case 'DRAFT': return 'Proposals Pending Underwriter Review';
      case 'REFERRAL': return 'Referral Queue (Senior Adjudication Required)';
      case 'ISSUED': return 'Active Bound Contracts';
      case 'EXPIRING': return '30-Day Expiry & Renewal Queue';
      case 'RENEWED': return 'Consecutive Renewed Policies';
      default: return 'Complete Underwriting Portfolio';
    }
  }

  applyFilter(): void {
    let result = [...this.policies];

    // Filter by tab queue
    if (this.activeQueueTab === 'DRAFT') {
      result = result.filter(p => p.status === 'DRAFT' && !p.referralFlag);
    } else if (this.activeQueueTab === 'REFERRAL') {
      result = result.filter(p => p.referralFlag);
    } else if (this.activeQueueTab === 'ISSUED') {
      result = result.filter(p => p.status === 'ISSUED');
    } else if (this.activeQueueTab === 'RENEWED') {
      result = result.filter(p => p.status === 'RENEWED');
    } else if (this.activeQueueTab === 'EXPIRING') {
      const expiringIds = new Set(this.expiringPolicies.map(ep => ep.id));
      result = result.filter(p => expiringIds.has(p.id));
    }

    // Filter by search query
    if (this.filterQuery.trim()) {
      const q = this.filterQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.policyNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.vehicleRegistrationNumber.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q) ||
        (p.productCode && p.productCode.toLowerCase().includes(q))
      );
    }

    this.filteredPolicies = result;
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  resetFilters(): void {
    this.activeQueueTab = 'ALL';
    this.filterQuery = '';
    this.currentPage = 1;
    this.applyFilter();
  }

  selectPolicy(policy: Policy): void {
    this.selectedPolicy = policy;
    this.showDetailDrawer = true;
    this.loadPolicyEndorsements(policy.id);
    this.cdr.markForCheck();
  }

  closeDetailDrawer(): void {
    this.showDetailDrawer = false;
    this.cdr.markForCheck();
  }

  private loadPolicyEndorsements(policyId: number): void {
    this.selectedPolicyEndorsements = [];
    this.policyService.getEndorsements(policyId).subscribe({
      next: (ends) => {
        this.selectedPolicyEndorsements = ends;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Underwriting Adjudication Actions ───────────────────────

  quickApprovePolicy(policy: Policy): void {
    if (policy.status !== 'DRAFT') return;
    this.policyService.approvePolicy(policy.id).subscribe({
      next: (updated) => {
        this.loadData();
        this.selectPolicy(updated);
        this.cdr.markForCheck();
      },
      error: (err) => {
        alert('Failed to approve policy: ' + (err.message || err.error));
      }
    });
  }

  // ── Rating Engine ───────────────────────────────────────────

  openQuoteModal(): void {
    this.showQuoteModal = true;
    this.quoteResult = null;
    if (this.allVehicles.length > 0 && !this.quoteSelectedVehicleId) {
      this.quoteSelectedVehicleId = this.allVehicles[0].id;
    }
    this.cdr.markForCheck();
  }

  closeQuoteModal(): void {
    this.showQuoteModal = false;
    this.cdr.markForCheck();
  }

  calculateQuote(): void {
    const vId = this.quoteSelectedVehicleId || (this.allVehicles.length > 0 ? this.allVehicles[0].id : 1);
    const req: QuoteCalculationRequest = {
      vehicleId: vId,
      productCode: this.quoteProductCode,
      estimatedValue: this.quoteVehicleValue
    };

    this.policyService.calculateQuote(req).subscribe({
      next: (res) => {
        this.quoteOriginalResult = { ...res };
        this.quoteLoadingPercent = 0;
        this.quoteDiscountPercent = 0;
        this.quoteResult = res;
        this.cdr.markForCheck();
      },
      error: (err) => {
        alert('Quote calculation error: ' + (err.message || 'Please check vehicle parameters'));
      }
    });
  }

  recalculateDiscretionary(): void {
    if (!this.quoteOriginalResult) return;
    const baseAndRisk = this.quoteOriginalResult.basePremium + this.quoteOriginalResult.riskAdjustment;
    const factor = 1 + (this.quoteLoadingPercent / 100) - (this.quoteDiscountPercent / 100);
    const adjustedSubtotal = Math.round(baseAndRisk * factor * 100) / 100;
    const taxes = Math.round(adjustedSubtotal * 0.15 * 100) / 100;
    this.quoteResult = {
      ...this.quoteOriginalResult,
      taxesAndFees: taxes,
      totalPremium: Math.round((adjustedSubtotal + taxes) * 100) / 100
    };
    this.cdr.markForCheck();
  }

  onQuoteStartDateChange(): void {
    if (!this.quoteStartDate) return;
    const sDate = new Date(this.quoteStartDate);
    const eDate = new Date(sDate);
    eDate.setFullYear(sDate.getFullYear() + 1);
    eDate.setDate(eDate.getDate() - 1);
    this.quoteEndDate = eDate.toISOString().substring(0, 10);
  }

  getQuoteSelectedVehicleOwner(): string {
    if (!this.quoteSelectedVehicleId) return 'No vehicle selected';
    const v = this.allVehicles.find(x => x.id === Number(this.quoteSelectedVehicleId));
    return v ? `${v.customerName} (ID: #${v.customerId})` : 'Unknown Owner';
  }

  bindQuotePolicy(status: 'DRAFT' | 'ISSUED'): void {
    if (!this.quoteResult || !this.quoteSelectedVehicleId) {
      alert('Please run actuarial rating calculation before binding.');
      return;
    }

    const v = this.allVehicles.find(x => x.id === Number(this.quoteSelectedVehicleId));
    if (!v) {
      alert('Selected vehicle was not found.');
      return;
    }

    const req: PolicyCreateRequest = {
      customerId: v.customerId,
      vehicleId: v.id,
      coverageDescription: this.quoteResult.coverageDescription || `Motor risk coverage under tariff ${this.quoteResult.productCode} for vehicle ${v.registrationNumber}.`,
      productCode: this.quoteResult.productCode || this.quoteProductCode,
      deductibleAmount: this.quoteResult.deductibleAmount,
      startDate: this.quoteStartDate,
      endDate: this.quoteEndDate,
      premium: this.quoteResult.totalPremium,
      status: status,
      vehicleMarketValue: this.quoteVehicleValue,
      underwritingSubjectivities: this.quoteSubjectivities ? this.quoteSubjectivities.trim() : undefined,
      installmentsCount: this.quoteInstallmentsCount
    };

    this.submittingQuotePolicy = true;
    const actor = this.authService.currentUser?.username || 'alexander.uw';
    this.policyService.createPolicy(req, actor).subscribe({
      next: (created) => {
        this.submittingQuotePolicy = false;
        this.closeQuoteModal();
        this.loadData();
        this.selectPolicy(created);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submittingQuotePolicy = false;
        alert('Failed to save policy: ' + (err.message || 'Check validation parameters'));
        this.cdr.markForCheck();
      }
    });
  }

  // ── Referral Adjudication Actions ─────────────────────────

  openReferralApproveModal(policy: Policy): void {
    this.selectedPolicy = policy;
    this.referralApproveSubjectivities = policy.underwritingSubjectivities || 'Risk accepted subject to standard vehicle tracker condition.';
    this.showReferralApproveModal = true;
    this.cdr.markForCheck();
  }

  submitReferralApprove(): void {
    if (!this.selectedPolicy) return;
    this.submittingReferralApprove = true;
    const actor = this.authService.currentUser?.username || 'alexander.uw';
    this.policyService.approveReferral(this.selectedPolicy.id, this.referralApproveSubjectivities, actor).subscribe({
      next: (updated) => {
        this.submittingReferralApprove = false;
        this.showReferralApproveModal = false;
        this.loadData();
        this.selectPolicy(updated);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submittingReferralApprove = false;
        alert('Failed to approve referral: ' + (err.message || err.error));
        this.cdr.markForCheck();
      }
    });
  }

  openReferralRejectModal(policy: Policy): void {
    this.selectedPolicy = policy;
    this.referralRejectReason = '';
    this.showReferralRejectModal = true;
    this.cdr.markForCheck();
  }

  submitReferralReject(): void {
    if (!this.selectedPolicy || !this.referralRejectReason.trim()) {
      alert('Please enter a reason for declining the referral.');
      return;
    }
    this.submittingReferralReject = true;
    const actor = this.authService.currentUser?.username || 'alexander.uw';
    this.policyService.rejectReferral(this.selectedPolicy.id, this.referralRejectReason.trim(), actor).subscribe({
      next: (updated) => {
        this.submittingReferralReject = false;
        this.showReferralRejectModal = false;
        this.loadData();
        this.selectPolicy(updated);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submittingReferralReject = false;
        alert('Failed to decline referral: ' + (err.message || err.error));
        this.cdr.markForCheck();
      }
    });
  }

  // ── Endorsement Flow ───────────────────────────────────────

  openEndorsementModal(policy: Policy): void {
    this.selectedPolicy = policy;
    this.endorsementType = 'COVERAGE_MODIFICATION';
    this.endorsementReason = '';
    this.endorsementSummary = '';
    this.endorsementEffectiveDate = new Date().toISOString().substring(0, 10);
    this.showEndorsementModal = true;
    this.cdr.markForCheck();
  }

  closeEndorsementModal(): void {
    this.showEndorsementModal = false;
    this.cdr.markForCheck();
  }

  submitEndorsement(): void {
    if (!this.selectedPolicy || !this.endorsementReason.trim() || !this.endorsementSummary.trim()) {
      alert('Please fill in endorsement reason and summary of changes.');
      return;
    }

    const req: EndorsementCreateRequest = {
      endorsementType: this.endorsementType,
      reason: this.endorsementReason,
      changesSummary: this.endorsementSummary,
      effectiveDate: this.endorsementEffectiveDate
    };

    this.submittingEndorsement = true;
    this.policyService.addEndorsement(this.selectedPolicy.id, req).subscribe({
      next: () => {
        this.submittingEndorsement = false;
        this.closeEndorsementModal();
        this.loadPolicyEndorsements(this.selectedPolicy!.id);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submittingEndorsement = false;
        alert('Failed to add endorsement: ' + (err.message || err.error));
        this.cdr.markForCheck();
      }
    });
  }

  // ── Renewal Flow ───────────────────────────────────────────

  openRenewalModal(policy: Policy): void {
    this.renewalTargetPolicy = policy;
    const oldEndDate = new Date(policy.endDate);
    const newStart = new Date(oldEndDate);
    newStart.setDate(oldEndDate.getDate() + 1);

    const newEnd = new Date(newStart);
    newEnd.setFullYear(newStart.getFullYear() + 1);
    newEnd.setDate(newEnd.getDate() - 1);

    this.renewalStartDate = newStart.toISOString().substring(0, 10);
    this.renewalEndDate = newEnd.toISOString().substring(0, 10);
    this.renewalPremium = policy.premium;
    this.renewalDeductible = policy.deductibleAmount || 500;
    this.showRenewalModal = true;
    this.cdr.markForCheck();
  }

  closeRenewalModal(): void {
    this.showRenewalModal = false;
    this.renewalTargetPolicy = null;
    this.cdr.markForCheck();
  }

  submitRenewal(): void {
    if (!this.renewalTargetPolicy) return;
    const req: PolicyRenewalRequest = {
      startDate: this.renewalStartDate,
      endDate: this.renewalEndDate,
      premium: this.renewalPremium,
      deductibleAmount: this.renewalDeductible,
      coverageDescription: `Consecutive Renewal Continuation of Policy #${this.renewalTargetPolicy.policyNumber}`
    };

    this.submittingRenewal = true;
    this.policyService.renewPolicy(this.renewalTargetPolicy.id, req).subscribe({
      next: (renewed) => {
        this.submittingRenewal = false;
        this.closeRenewalModal();
        this.loadData();
        this.selectPolicy(renewed);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submittingRenewal = false;
        alert('Failed to issue renewal: ' + (err.message || err.error));
        this.cdr.markForCheck();
      }
    });
  }

  // ── Cancellation Flow ──────────────────────────────────────

  openCancelModal(policy: Policy): void {
    this.cancelTargetPolicy = policy;
    this.cancellationReason = '';
    this.showCancelModal = true;
    this.cdr.markForCheck();
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.cancelTargetPolicy = null;
    this.cdr.markForCheck();
  }

  submitCancellation(): void {
    if (!this.cancelTargetPolicy || !this.cancellationReason.trim()) {
      alert('A formal cancellation justification is required.');
      return;
    }

    const req: PolicyCancelRequest = {
      cancellationReason: this.cancellationReason.trim()
    };

    this.submittingCancel = true;
    this.policyService.cancelPolicy(this.cancelTargetPolicy.id, req).subscribe({
      next: (cancelled) => {
        this.submittingCancel = false;
        this.closeCancelModal();
        this.loadData();
        this.selectPolicy(cancelled);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submittingCancel = false;
        alert('Failed to cancel policy: ' + (err.message || err.error));
        this.cdr.markForCheck();
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────

  getProductBadgeClass(code?: string): string {
    switch (code) {
      case 'THIRD_PARTY': return 'badge-warning';
      case 'FIRE_AND_THEFT': return 'badge-draft';
      default: return 'badge-info';
    }
  }

  getInitials(name?: string): string {
    if (!name) return 'UW';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
  }
}
