import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { PolicyService } from '../../core/services/policy.service';
import { AuthService } from '../../core/services/auth.service';
import { Customer, ClientOnboardingRequest } from '../../core/models/customer.model';
import { Vehicle, VehicleCreateRequest } from '../../core/models/vehicle.model';
import { Policy, QuoteCalculationDto, QuoteCalculationRequest, PolicyCreateRequest } from '../../core/models/policy.model';
import { CommissionStatement, CommissionLineItem } from '../../core/models/commission.model';
import { ApiErrorResponse } from '../../core/models/api-error.model';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="agent-dash-layout">
      <!-- ── Top Header Bar ──────────────────────────────────────── -->
      <header class="agent-topbar">
        <div class="topbar-left">
          <nav class="breadcrumb-nav" aria-label="Breadcrumb">
            <span class="bc-crumb">Agency Desk</span>
            <span class="bc-separator">/</span>
            <span class="bc-current">Broker Portal &amp; Client Production</span>
          </nav>
        </div>

        <div class="topbar-center">
          <div class="global-search-box">
            <input
              type="search"
              placeholder="Search clients, vehicles, plate numbers, or policies..."
              class="global-search-input"
              [(ngModel)]="searchQuery"
              (input)="applyFilters()"
              aria-label="Search agency portfolio"
            />
            <svg class="search-magnifier-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
        </div>

        <div class="topbar-right">
          <button type="button" class="btn-primary-action" (click)="openOnboardingModal()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            <span>+ Onboard Client &amp; Fleet</span>
          </button>

          <button type="button" class="btn-secondary-action" (click)="openQuoteModal()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span>Prepare Motor Quote</span>
          </button>

          <div class="user-header-avatar" [title]="authService.currentUser?.fullName || 'David Kim (Broker)'">
            <span>{{ getInitials(authService.currentUser?.fullName || 'David Kim') }}</span>
          </div>
        </div>
      </header>

      <!-- ── Subheader Banner & Desk Context ────────────────────── -->
      <div class="agent-subheader">
        <div class="subheader-heading">
          <h2>Agency Portfolio &amp; Commissions</h2>
          <span class="desk-badge">Agent Desk · David Kim (Licensed Intermediary)</span>
        </div>

        <!-- Navigation Tabs -->
        <div class="tab-pill-group">
          <button
            type="button"
            class="tab-pill-btn"
            [class.active]="activeTab === 'CLIENTS'"
            (click)="setActiveTab('CLIENTS')"
          >
            My Clients ({{ customers.length }})
          </button>

          <button
            type="button"
            class="tab-pill-btn"
            [class.active]="activeTab === 'PIPELINE'"
            (click)="setActiveTab('PIPELINE')"
          >
            Policy Pipeline ({{ policies.length }})
            <span *ngIf="proposalCount > 0" class="badge-pill-counter">{{ proposalCount }}</span>
          </button>

          <button
            type="button"
            class="tab-pill-btn"
            [class.active]="activeTab === 'COMMISSIONS'"
            (click)="setActiveTab('COMMISSIONS')"
          >
            Commission Statements
          </button>
        </div>
      </div>

      <!-- ── Feedback Alerts ────────────────────────────────────── -->
      <div *ngIf="actionSuccessMessage" class="alert-toast success-toast">
        <span>✓ {{ actionSuccessMessage }}</span>
        <button type="button" (click)="actionSuccessMessage = null" class="close-toast-btn">✕</button>
      </div>

      <div *ngIf="actionErrorMessage" class="alert-toast error-toast">
        <span>⚠ {{ actionErrorMessage }}</span>
        <button type="button" (click)="actionErrorMessage = null" class="close-toast-btn">✕</button>
      </div>

      <!-- ── Main Grid Content Body ─────────────────────────────── -->
      <div class="agent-content-body">

        <!-- Top KPI Metrics Strip -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Onboarded Clients</div>
            <div class="kpi-value">{{ customers.length }}</div>
            <div class="kpi-sub">{{ verifiedKycCount }} KYC Verified · {{ pendingKycCount }} Pending</div>
          </div>

          <div class="kpi-card info-card">
            <div class="kpi-label">Fleet Assets Managed</div>
            <div class="kpi-value">{{ vehicles.length }}</div>
            <div class="kpi-sub">Registered client motor vehicles</div>
          </div>

          <div class="kpi-card success-card">
            <div class="kpi-label">Total Written Production</div>
            <div class="kpi-value">\${{ totalProduction | number:'1.2-2' }}</div>
            <div class="kpi-sub">{{ activePoliciesCount }} Active Bound Policies</div>
          </div>

          <div class="kpi-card highlight-card">
            <div class="kpi-label">Broker Commissions Earned</div>
            <div class="kpi-value text-emerald">\${{ totalCommissionEarned | number:'1.2-2' }}</div>
            <div class="kpi-sub">Across active placed contracts</div>
          </div>
        </div>

        <!-- ════════════ TAB 1: CLIENTS WORKSPACE ═════════════════ -->
        <section *ngIf="activeTab === 'CLIENTS'" class="dash-card">
          <div class="card-header-bar">
            <div>
              <h3 class="card-title">Assigned Client Accounts &amp; Fleet Ownership</h3>
              <p class="card-sub">Client contact records, verified KYC compliance, and cataloged motor fleets</p>
            </div>
            <button type="button" class="btn-sm-primary" (click)="openOnboardingModal()">
              + New Client Onboarding
            </button>
          </div>

          <div class="table-container">
            <table class="data-table" aria-label="Clients Table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Contact Details</th>
                  <th>Fleet Size</th>
                  <th>KYC Status</th>
                  <th>Registered On</th>
                  <th style="text-align: right;">Servicing Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of displayedCustomers">
                  <td>
                    <div class="client-info-cell">
                      <div class="client-avatar">{{ getInitials(c.fullName) }}</div>
                      <div>
                        <div class="font-semibold text-slate-900">{{ c.fullName }}</div>
                        <div class="text-xs text-slate-500">Client ID: #{{ c.id }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="text-sm font-mono text-slate-700">{{ c.phone }}</div>
                    <div class="text-xs text-slate-500">{{ c.email || 'No email provided' }}</div>
                  </td>
                  <td>
                    <span class="badge badge-info">{{ c.vehicleCount }} vehicle{{ c.vehicleCount === 1 ? '' : 's' }}</span>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="c.kycStatus === 'VERIFIED' ? 'badge-success' : 'badge-warning'">
                      {{ c.kycStatus || 'PENDING' }}
                    </span>
                  </td>
                  <td class="text-xs text-slate-500">
                    {{ c.createdAt | date:'mediumDate' }}
                  </td>
                  <td style="text-align: right;">
                    <div class="row-action-group">
                      <button type="button" class="btn-row-action" (click)="openAddVehicleModal(c)" title="Add vehicle to fleet">
                        + Vehicle
                      </button>
                      <button type="button" class="btn-row-action" (click)="openQuoteModalForClient(c)" title="Prepare quote for client">
                        Quote
                      </button>
                      <a [routerLink]="['/customers', c.id]" class="btn-row-action" title="View details">
                        Profile
                      </a>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="filteredCustomers.length === 0">
                  <td colspan="6" class="empty-row-cell">
                    No client accounts found matching the current search criteria.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <div *ngIf="filteredCustomers.length > 0" class="pagination-footer">
            <span class="pagination-info">
              Showing <strong>{{ customerStartIndex }}–{{ customerEndIndex }}</strong> of <strong>{{ filteredCustomers.length }}</strong> clients
            </span>
            <div class="pagination-controls">
              <span class="page-indicator">Page {{ customerPage }} of {{ totalCustomerPages }}</span>
              <button type="button" class="btn-page" [disabled]="customerPage === 1" (click)="prevCustomerPage()">
                Prev
              </button>
              <button type="button" class="btn-page" [disabled]="customerPage >= totalCustomerPages" (click)="nextCustomerPage()">
                Next
              </button>
            </div>
          </div>
        </section>

        <!-- ════════════ TAB 2: POLICY PIPELINE ═══════════════════ -->
        <section *ngIf="activeTab === 'PIPELINE'" class="dash-card">
          <div class="card-header-bar">
            <div>
              <h3 class="card-title">Agency Policy Pipeline &amp; Renewal Servicing</h3>
              <p class="card-sub">Track quotes, proposals under review, active placements, and upcoming expiries</p>
            </div>

            <!-- Pipeline Filter Pills -->
            <div class="sub-filter-pills">
              <button
                type="button"
                class="sub-pill-btn"
                [class.active]="pipelineFilter === 'ALL'"
                (click)="setPipelineFilter('ALL')"
              >
                All ({{ policies.length }})
              </button>
              <button
                type="button"
                class="sub-pill-btn"
                [class.active]="pipelineFilter === 'DRAFT'"
                (click)="setPipelineFilter('DRAFT')"
              >
                Proposals ({{ proposalCount }})
              </button>
              <button
                type="button"
                class="sub-pill-btn"
                [class.active]="pipelineFilter === 'ISSUED'"
                (click)="setPipelineFilter('ISSUED')"
              >
                Active Bound ({{ activePoliciesCount }})
              </button>
              <button
                type="button"
                class="sub-pill-btn"
                [class.active]="pipelineFilter === 'EXPIRING'"
                (click)="setPipelineFilter('EXPIRING')"
              >
                Expiring ({{ expiringCount }})
              </button>
            </div>
          </div>

          <div class="table-container">
            <table class="data-table" aria-label="Policy Pipeline Table">
              <thead>
                <tr>
                  <th>Policy Number</th>
                  <th>Client &amp; Subject Vehicle</th>
                  <th>Tariff Cover</th>
                  <th>Gross Premium</th>
                  <th>Status</th>
                  <th>Coverage Term</th>
                  <th style="text-align: right;">Client Servicing Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of displayedPolicies">
                  <td>
                    <div class="font-mono font-semibold text-slate-900">{{ p.policyNumber }}</div>
                    <div *ngIf="p.referralFlag" class="text-xs text-amber-600 font-semibold">
                      ⚠️ Under Referral Review
                    </div>
                  </td>
                  <td>
                    <div class="font-semibold text-slate-900">{{ p.customerName }}</div>
                    <div class="text-xs text-slate-500 font-mono">{{ p.vehicleRegistrationNumber }} · {{ p.vehicleDescription }}</div>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="p.productCode === 'THIRD_PARTY' ? 'badge-warning' : 'badge-info'">
                      {{ p.productCode || 'COMPREHENSIVE' }}
                    </span>
                  </td>
                  <td>
                    <div class="font-mono font-semibold text-emerald">\${{ p.premium | number:'1.2-2' }}</div>
                    <div class="text-xs text-slate-400">Excess: \${{ (p.deductibleAmount || 500) | number:'1.2-2' }}</div>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="'status-' + p.status.toLowerCase()">
                      {{ p.status }}
                    </span>
                  </td>
                  <td class="text-xs text-slate-600">
                    <div>{{ p.startDate | date:'MMM d, y' }} &rarr;</div>
                    <div><strong>{{ p.endDate | date:'MMM d, y' }}</strong></div>
                  </td>
                  <td style="text-align: right;">
                    <div class="row-action-group">
                      <button
                        type="button"
                        class="btn-sm-reminder"
                        (click)="sendRenewalReminder(p)"
                        title="Dispatch renewal notice to client"
                        [disabled]="sendingReminderId === p.id"
                      >
                        🔔 Renewal Alert
                      </button>

                      <button
                        type="button"
                        class="btn-sm-reminder"
                        (click)="sendPaymentReminder(p)"
                        title="Dispatch premium installment reminder"
                        [disabled]="sendingReminderId === p.id"
                      >
                        💳 Pay Reminder
                      </button>

                      <a [routerLink]="['/policies', p.id]" class="btn-row-action" title="View Policy Schedule">
                        View
                      </a>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="filteredPolicies.length === 0">
                  <td colspan="7" class="empty-row-cell">
                    No policies found matching the selected filter criteria.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <div *ngIf="filteredPolicies.length > 0" class="pagination-footer">
            <span class="pagination-info">
              Showing <strong>{{ policyStartIndex }}–{{ policyEndIndex }}</strong> of <strong>{{ filteredPolicies.length }}</strong> policies
            </span>
            <div class="pagination-controls">
              <span class="page-indicator">Page {{ policyPage }} of {{ totalPolicyPages }}</span>
              <button type="button" class="btn-page" [disabled]="policyPage === 1" (click)="prevPolicyPage()">
                Prev
              </button>
              <button type="button" class="btn-page" [disabled]="policyPage >= totalPolicyPages" (click)="nextPolicyPage()">
                Next
              </button>
            </div>
          </div>
        </section>

        <!-- ════════════ TAB 3: COMMISSION STATEMENTS ═════════════ -->
        <section *ngIf="activeTab === 'COMMISSIONS'" class="dash-card">
          <div class="card-header-bar">
            <div>
              <h3 class="card-title">Intermediary Commission Statements &amp; Ledger</h3>
              <p class="card-sub">Calculated broker commission entitlements based on active tariff rules (Comprehensive 10%, Third-Party 7.5%)</p>
            </div>
            <button type="button" class="btn-secondary-action" (click)="printCommissionStatement()">
              🖨 Print Commission Statement
            </button>
          </div>

          <!-- Commission Highlight Summary Cards -->
          <div class="commission-summary-grid">
            <div class="comm-metric-box">
              <span class="comm-metric-label">Total Bound Production</span>
              <span class="comm-metric-val font-mono">\${{ (commissionStatement?.totalGrossPremium || 0) | number:'1.2-2' }}</span>
            </div>
            <div class="comm-metric-box">
              <span class="comm-metric-label">Total Commission Earned</span>
              <span class="comm-metric-val font-mono text-emerald">\${{ (commissionStatement?.totalCommissionEarned || 0) | number:'1.2-2' }}</span>
            </div>
            <div class="comm-metric-box">
              <span class="comm-metric-label">Total Placed Contracts</span>
              <span class="comm-metric-val font-mono">{{ commissionStatement?.totalPoliciesCount || 0 }}</span>
            </div>
            <div class="comm-metric-box">
              <span class="comm-metric-label">Payout Status</span>
              <span class="comm-metric-val text-slate-800" style="font-size: 1.1rem;">Verified &amp; Payable</span>
            </div>
          </div>

          <div class="table-container">
            <table class="data-table" aria-label="Commission Ledger Table">
              <thead>
                <tr>
                  <th>Policy Number</th>
                  <th>Client</th>
                  <th>Vehicle Registration</th>
                  <th>Tariff Classification</th>
                  <th>Gross Premium</th>
                  <th>Commission Rate</th>
                  <th>Commission Earned</th>
                  <th>Payout Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of commissionStatement?.lineItems">
                  <td class="font-mono font-semibold">{{ item.policyNumber }}</td>
                  <td>{{ item.customerName }}</td>
                  <td class="font-mono text-xs">{{ item.vehicleRegistration }}</td>
                  <td><span class="badge badge-info">{{ item.productCode }}</span></td>
                  <td class="font-mono font-semibold">\${{ item.premium | number:'1.2-2' }}</td>
                  <td class="font-mono text-slate-700">{{ item.commissionRatePercentage }}%</td>
                  <td class="font-mono font-semibold text-emerald">\${{ item.commissionAmount | number:'1.2-2' }}</td>
                  <td>
                    <span class="badge" [ngClass]="item.payoutStatus === 'EARNED' ? 'badge-success' : 'badge-draft'">
                      {{ item.payoutStatus }}
                    </span>
                  </td>
                </tr>

                <tr *ngIf="!commissionStatement || commissionStatement.lineItems.length === 0">
                  <td colspan="8" class="empty-row-cell">
                    No commission ledger records found for this broker account.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>

      <!-- ── MODAL 1: CLIENT & FLEET ONBOARDING WIZARD ──────────── -->
      <div *ngIf="showOnboardingModal" class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-dialog modal-dialog-lg">
          <div class="modal-header">
            <h3>Client &amp; Fleet Onboarding Wizard</h3>
            <button type="button" class="modal-close-btn" (click)="closeOnboardingModal()">✕</button>
          </div>
          <div class="modal-body">
            <form (ngSubmit)="submitOnboarding()">
              <h4 class="form-section-header">1. Policyholder Personal / Enterprise Details</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label" for="onboard-name">Full Legal Name / Business Name *</label>
                  <input
                    id="onboard-name"
                    type="text"
                    class="form-control"
                    [(ngModel)]="onboardingForm.fullName"
                    name="fullName"
                    placeholder="e.g. Abebe Bikila Logistics"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="onboard-phone">Primary Phone Number *</label>
                  <input
                    id="onboard-phone"
                    type="tel"
                    class="form-control"
                    [(ngModel)]="onboardingForm.phone"
                    name="phone"
                    placeholder="e.g. +251 91 123 4567"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="onboard-email">Email Address</label>
                  <input
                    id="onboard-email"
                    type="email"
                    class="form-control"
                    [(ngModel)]="onboardingForm.email"
                    name="email"
                    placeholder="e.g. info@logistics.et"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="onboard-kyc">KYC Verification Status</label>
                  <select id="onboard-kyc" class="form-control" [(ngModel)]="onboardingForm.kycStatus" name="kycStatus">
                    <option value="VERIFIED">VERIFIED (Agent physically checked National ID / Trade License)</option>
                    <option value="PENDING">PENDING (Documents awaiting compliance upload)</option>
                  </select>
                </div>
              </div>

              <h4 class="form-section-header" style="margin-top: 1.25rem;">2. Initial Vehicle / Fleet Asset (Optional)</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label" for="v-plate">License Plate / Registration No.</label>
                  <input
                    id="v-plate"
                    type="text"
                    class="form-control"
                    [(ngModel)]="onboardingForm.registrationNumber"
                    name="registrationNumber"
                    placeholder="e.g. AA-3-45678"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="v-make">Vehicle Make</label>
                  <input
                    id="v-make"
                    type="text"
                    class="form-control"
                    [(ngModel)]="onboardingForm.make"
                    name="make"
                    placeholder="e.g. Toyota"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="v-model">Vehicle Model</label>
                  <input
                    id="v-model"
                    type="text"
                    class="form-control"
                    [(ngModel)]="onboardingForm.model"
                    name="model"
                    placeholder="e.g. Hilux Pickup"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="v-year">Manufacture Year</label>
                  <input
                    id="v-year"
                    type="number"
                    class="form-control"
                    [(ngModel)]="onboardingForm.manufactureYear"
                    name="manufactureYear"
                    placeholder="2022"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="v-usage">Usage Classification</label>
                  <select id="v-usage" class="form-control" [(ngModel)]="onboardingForm.usageType" name="usageType">
                    <option value="COMMERCIAL">Commercial Fleet / Transport</option>
                    <option value="PRIVATE">Private Personal Vehicle</option>
                    <option value="HAULAGE">Heavy Haulage / Freight</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" for="v-val">Estimated Market Valuation ($)</label>
                  <input
                    id="v-val"
                    type="number"
                    class="form-control"
                    [(ngModel)]="onboardingForm.estimatedValue"
                    name="estimatedValue"
                    placeholder="25000"
                  />
                </div>
              </div>

              <div class="modal-footer" style="padding: 1.25rem 0 0; margin-top: 1rem; border-top: 1px solid #e2e8f0;">
                <button type="button" class="btn-modal-cancel" (click)="closeOnboardingModal()">Cancel</button>
                <button type="submit" class="btn-primary-action" [disabled]="submittingOnboarding">
                  {{ submittingOnboarding ? 'Onboarding…' : 'Complete Client & Fleet Onboarding' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- ── MODAL 2: MOTOR QUOTE & APPLICATION GENERATOR ──────── -->
      <div *ngIf="showQuoteModal" class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-dialog modal-dialog-lg">
          <div class="modal-header">
            <h3>Prepare Rating Quote &amp; Policy Application</h3>
            <button type="button" class="modal-close-btn" (click)="closeQuoteModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Select Client *</label>
                <select class="form-control" [(ngModel)]="quoteClientId" (change)="onQuoteClientSelected()">
                  <option *ngFor="let c of customers" [value]="c.id">
                    {{ c.fullName }} (Phone: {{ c.phone }})
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Select Client Vehicle *</label>
                <select class="form-control" [(ngModel)]="quoteVehicleId">
                  <option *ngFor="let v of clientAvailableVehicles" [value]="v.id">
                    {{ v.registrationNumber }} — {{ v.make }} {{ v.model }} ({{ v.manufactureYear }})
                  </option>
                </select>
                <span *ngIf="clientAvailableVehicles.length === 0" class="field-hint">
                  No vehicles cataloged for this client. Please add a vehicle first.
                </span>
              </div>

              <div class="form-group">
                <label class="form-label">Tariff Product Classification *</label>
                <select class="form-control" [(ngModel)]="quoteProductCode">
                  <option value="COMPREHENSIVE">Comprehensive (Full accidental + theft + liability)</option>
                  <option value="THIRD_PARTY">Third Party Statutory Liability Only</option>
                  <option value="FIRE_AND_THEFT">Third Party Fire &amp; Theft</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Insured Valuation ($) *</label>
                <input type="number" class="form-control font-semibold" [(ngModel)]="quoteEstimatedValue" placeholder="20000" />
              </div>
            </div>

            <button class="btn-primary-action" style="width: 100%; margin-top: 0.5rem;" (click)="calculateQuote()">
              Calculate Dynamic Tariff Quote
            </button>

            <!-- Rated Output -->
            <div *ngIf="quoteResult" class="quote-result-box">
              <div class="quote-result-title">Actuarial Rating Engine Breakdown</div>
              <div class="quote-total-amount">\${{ quoteResult.totalPremium | number:'1.2-2' }}</div>
              <div class="quote-breakdown-rows">
                <div class="quote-row"><span>Base Tariff Premium</span><span>\${{ quoteResult.basePremium | number:'1.2-2' }}</span></div>
                <div class="quote-row"><span>Vehicle Age &amp; Risk Adjustment</span><span>\${{ quoteResult.riskAdjustment | number:'1.2-2' }}</span></div>
                <div class="quote-row"><span>Taxes &amp; Statutory Regulatory Fees (15%)</span><span>\${{ quoteResult.taxesAndFees | number:'1.2-2' }}</span></div>
                <div class="quote-row quote-row-strong"><span>Compulsory Excess / Deductible</span><span>\${{ quoteResult.deductibleAmount | number:'1.2-2' }}</span></div>
              </div>

              <div class="form-grid" style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px dashed #cbd5e1;">
                <div class="form-group">
                  <label class="form-label">Billing Installment Schedule</label>
                  <select class="form-control" [(ngModel)]="quoteInstallmentsCount">
                    <option [ngValue]="1">Single Full Payment (100% on inception)</option>
                    <option [ngValue]="2">2 Bi-annual Installments (50% / 50%)</option>
                    <option [ngValue]="4">4 Quarterly Installments (25% quarterly)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Coverage Inception Date</label>
                  <input type="date" class="form-control" [(ngModel)]="quoteStartDate" />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-modal-cancel" (click)="closeQuoteModal()">Close</button>
            <button
              *ngIf="quoteResult"
              type="button"
              class="btn-primary-action"
              (click)="submitProposalToUnderwriting()"
              [disabled]="submittingProposal"
            >
              {{ submittingProposal ? 'Submitting…' : 'Submit Application to Underwriting (Proposal)' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── MODAL 3: ADD VEHICLE TO CLIENT ────────────────────── -->
      <div *ngIf="showAddVehicleModal && addVehicleTargetCustomer" class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Add Vehicle to {{ addVehicleTargetCustomer.fullName }}'s Fleet</h3>
            <button type="button" class="modal-close-btn" (click)="closeAddVehicleModal()">✕</button>
          </div>
          <div class="modal-body">
            <form (ngSubmit)="submitAddVehicle()">
              <div class="form-group">
                <label class="form-label" for="add-v-plate">License Plate Number *</label>
                <input id="add-v-plate" type="text" class="form-control" [(ngModel)]="addVehiclePlate" name="plate" required placeholder="e.g. AA-3-98765" />
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label" for="add-v-make">Make *</label>
                  <input id="add-v-make" type="text" class="form-control" [(ngModel)]="addVehicleMake" name="make" required placeholder="e.g. Isuzu" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="add-v-model">Model *</label>
                  <input id="add-v-model" type="text" class="form-control" [(ngModel)]="addVehicleModel" name="model" required placeholder="e.g. NPR Truck" />
                </div>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label" for="add-v-year">Manufacture Year *</label>
                  <input id="add-v-year" type="number" class="form-control" [(ngModel)]="addVehicleYear" name="year" required placeholder="2021" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="add-v-usage">Usage Type</label>
                  <select id="add-v-usage" class="form-control" [(ngModel)]="addVehicleUsage" name="usage">
                    <option value="COMMERCIAL">Commercial Transport</option>
                    <option value="PRIVATE">Private Personal</option>
                    <option value="HAULAGE">Heavy Haulage</option>
                  </select>
                </div>
              </div>
              <div class="modal-footer" style="padding: 1rem 0 0; margin-top: 1rem; border-top: 1px solid #e2e8f0;">
                <button type="button" class="btn-modal-cancel" (click)="closeAddVehicleModal()">Cancel</button>
                <button type="submit" class="btn-primary-action" [disabled]="submittingAddVehicle">
                  {{ submittingAddVehicle ? 'Saving…' : 'Add Vehicle to Fleet' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .agent-dash-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #f8fafc;
      color: #0f172a;
      font-family: inherit;
    }

    .agent-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      padding: 0.75rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      gap: 1rem;
    }

    .breadcrumb-nav {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
    }

    .bc-crumb { color: #64748b; font-weight: 500; }
    .bc-separator { color: #cbd5e1; }
    .bc-current { color: #0f172a; font-weight: 700; }

    .global-search-box {
      position: relative;
      width: 380px;
    }

    .global-search-input {
      width: 100%;
      padding: 0.45rem 0.75rem 0.45rem 2rem;
      font-size: 0.825rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #f8fafc;
      outline: none;
      box-sizing: border-box;
    }

    .global-search-input:focus {
      border-color: #0284c7;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
    }

    .search-magnifier-icon {
      position: absolute;
      left: 0.6rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-primary-action {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 0.45rem 0.85rem;
      border-radius: 7px;
      font-size: 0.8rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-primary-action:hover { background: #0369a1; }

    .btn-secondary-action {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 0.45rem 0.85rem;
      border-radius: 7px;
      font-size: 0.8rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      cursor: pointer;
    }

    .btn-secondary-action:hover { background: #e2e8f0; }

    .user-header-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #ea580c;
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .agent-subheader {
      padding: 1.25rem 1.5rem 0;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .subheader-heading h2 {
      font-size: 1.35rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0 0 4px;
      color: #0f172a;
    }

    .desk-badge {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
    }

    .tab-pill-group {
      display: flex;
      gap: 0.5rem;
    }

    .tab-pill-btn {
      padding: 0.6rem 1rem;
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.15s;
    }

    .tab-pill-btn:hover { color: #0f172a; }
    .tab-pill-btn.active {
      color: #0284c7;
      border-bottom-color: #0284c7;
    }

    .badge-pill-counter {
      background: #f97316;
      color: #ffffff;
      font-size: 0.65rem;
      padding: 1px 6px;
      border-radius: 10px;
    }

    .alert-toast {
      margin: 1rem 1.5rem 0;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.825rem;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .success-toast { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .error-toast { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .close-toast-btn { background: transparent; border: none; font-size: 1rem; cursor: pointer; color: inherit; }

    .agent-content-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;

      @media (max-width: 900px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .kpi-label { font-size: 0.725rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
    .kpi-value { font-size: 1.6rem; font-weight: 800; color: #0f172a; margin: 4px 0 2px; }
    .kpi-sub { font-size: 0.75rem; color: #64748b; }
    .text-emerald { color: #059669; }

    .dash-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .card-header-bar {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .card-title { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0; }
    .card-sub { font-size: 0.75rem; color: #64748b; margin: 2px 0 0; }

    .sub-filter-pills { display: flex; gap: 0.4rem; }
    .sub-pill-btn {
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
    }
    .sub-pill-btn.active {
      background: #0284c7;
      color: #ffffff;
      border-color: #0284c7;
    }

    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.825rem; text-align: left; }
    .data-table th { background: #f8fafc; color: #475569; font-weight: 600; padding: 0.65rem 1rem; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; }
    .data-table tbody tr:hover { background: #f8fafc; }

    .client-info-cell { display: flex; align-items: center; gap: 0.65rem; }
    .client-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #6366f1;
      color: #ffffff;
      font-size: 0.675rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .row-action-group { display: inline-flex; align-items: center; gap: 0.35rem; }
    .btn-row-action {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #334155;
      padding: 0.25rem 0.55rem;
      border-radius: 5px;
      font-size: 0.725rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }
    .btn-row-action:hover { background: #e2e8f0; }
    .btn-row-primary { background: #0284c7; color: #ffffff; border-color: #0284c7; }
    .btn-row-primary:hover { background: #0369a1; }

    .btn-sm-reminder {
      background: #fff7ed;
      border: 1px solid #ffedd5;
      color: #c2410c;
      padding: 0.25rem 0.55rem;
      border-radius: 5px;
      font-size: 0.725rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-sm-reminder:hover { background: #fed7aa; }

    .btn-sm-primary {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.775rem;
      font-weight: 600;
      cursor: pointer;
    }

    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-warning { background: #fef3c7; color: #b45309; }
    .badge-info { background: #e0f2fe; color: #0369a1; }
    .badge-draft { background: #f1f5f9; color: #475569; }

    .status-issued { background: #dcfce7; color: #15803d; }
    .status-draft { background: #fef3c7; color: #b45309; }
    .status-cancelled { background: #fee2e2; color: #b91c1c; }
    .status-renewed { background: #e0e7ff; color: #4338ca; }

    .pagination-footer {
      padding: 0.75rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #f1f5f9;
      font-size: 0.775rem;
      color: #64748b;
    }

    .pagination-controls { display: flex; align-items: center; gap: 0.5rem; }
    .btn-page {
      padding: 0.25rem 0.55rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-page:disabled { opacity: 0.4; cursor: not-allowed; }

    .commission-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      padding: 1.25rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .comm-metric-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem 1rem;
    }
    .comm-metric-label { font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .comm-metric-val { font-size: 1.35rem; font-weight: 800; color: #0f172a; margin-top: 3px; display: block; }

    .empty-row-cell {
      text-align: center;
      padding: 2.5rem 1rem;
      color: #94a3b8;
      font-size: 0.85rem;
    }

    /* Modal styling */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(2px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-dialog {
      background: #ffffff;
      border-radius: 12px;
      width: 100%;
      max-width: 540px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-dialog-lg { max-width: 680px; }

    .modal-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 { font-size: 1rem; font-weight: 700; margin: 0; color: #0f172a; }
    .modal-close-btn { background: transparent; border: none; font-size: 1.1rem; color: #64748b; cursor: pointer; }

    .modal-body { padding: 1.25rem; max-height: 80vh; overflow-y: auto; }
    .modal-footer {
      padding: 0.85rem 1.25rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .btn-modal-cancel {
      background: transparent;
      border: 1px solid #cbd5e1;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }

    .form-section-header {
      font-size: 0.775rem;
      font-weight: 700;
      color: #0284c7;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0 0 0.75rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .form-group { margin-bottom: 0.65rem; }
    .form-label { display: block; font-size: 0.75rem; font-weight: 600; color: #334155; margin-bottom: 3px; }
    .form-control {
      width: 100%;
      padding: 0.45rem 0.65rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.825rem;
      color: #0f172a;
      box-sizing: border-box;
      outline: none;
    }
    .form-control:focus { border-color: #0284c7; }
    .field-hint { font-size: 0.7rem; color: #dc2626; margin-top: 2px; display: block; }

    .quote-result-box {
      margin-top: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .quote-result-title { font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .quote-total-amount { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 3px 0 6px; }
    .quote-breakdown-rows { display: flex; flex-direction: column; gap: 3px; }
    .quote-row { display: flex; justify-content: space-between; font-size: 0.775rem; color: #475569; }
    .quote-row-strong { font-weight: 700; border-top: 1px solid #e2e8f0; padding-top: 3px; color: #0f172a; }
  `]
})
export class AgentDashboardComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  vehicles: Vehicle[] = [];
  policies: Policy[] = [];
  filteredPolicies: Policy[] = [];
  commissionStatement: CommissionStatement | null = null;

  activeTab: 'CLIENTS' | 'PIPELINE' | 'COMMISSIONS' = 'CLIENTS';
  pipelineFilter: 'ALL' | 'DRAFT' | 'ISSUED' | 'EXPIRING' = 'ALL';
  searchQuery = '';

  // Pagination - Customers
  customerPage = 1;
  customerPageSize = 6;

  // Pagination - Policies
  policyPage = 1;
  policyPageSize = 6;

  // KPIs
  totalProduction = 0;
  totalCommissionEarned = 0;

  // Feedback
  actionSuccessMessage: string | null = null;
  actionErrorMessage: string | null = null;
  sendingReminderId: number | null = null;

  // Modal 1: Client Onboarding Wizard
  showOnboardingModal = false;
  submittingOnboarding = false;
  onboardingForm: ClientOnboardingRequest = {
    fullName: '',
    phone: '',
    email: '',
    kycStatus: 'VERIFIED',
    registrationNumber: '',
    make: '',
    model: '',
    manufactureYear: new Date().getFullYear(),
    usageType: 'COMMERCIAL',
    estimatedValue: 25000
  };

  // Modal 2: Quoting & Application
  showQuoteModal = false;
  quoteClientId: number | null = null;
  quoteVehicleId: number | null = null;
  quoteProductCode = 'COMPREHENSIVE';
  quoteEstimatedValue = 25000;
  quoteInstallmentsCount = 1;
  quoteStartDate = new Date().toISOString().substring(0, 10);
  quoteResult: QuoteCalculationDto | null = null;
  submittingProposal = false;

  // Modal 3: Add Vehicle to Client
  showAddVehicleModal = false;
  addVehicleTargetCustomer: Customer | null = null;
  addVehiclePlate = '';
  addVehicleMake = '';
  addVehicleModel = '';
  addVehicleYear = new Date().getFullYear();
  addVehicleUsage = 'COMMERCIAL';
  submittingAddVehicle = false;

  get agentId(): number {
    return this.authService.currentUser?.id || 5;
  }

  get verifiedKycCount(): number {
    return this.customers.filter(c => c.kycStatus === 'VERIFIED').length;
  }

  get pendingKycCount(): number {
    return this.customers.filter(c => c.kycStatus !== 'VERIFIED').length;
  }

  get proposalCount(): number {
    return this.policies.filter(p => p.status === 'DRAFT').length;
  }

  get activePoliciesCount(): number {
    return this.policies.filter(p => p.status === 'ISSUED').length;
  }

  get expiringCount(): number {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    return this.policies.filter(p => {
      if (p.status !== 'ISSUED') return false;
      const end = new Date(p.endDate);
      return end >= today && end <= thirtyDaysLater;
    }).length;
  }

  // Customer Pagination
  get totalCustomerPages(): number {
    return Math.ceil(this.filteredCustomers.length / this.customerPageSize) || 1;
  }
  get customerStartIndex(): number {
    if (this.filteredCustomers.length === 0) return 0;
    return (this.customerPage - 1) * this.customerPageSize + 1;
  }
  get customerEndIndex(): number {
    return Math.min(this.customerPage * this.customerPageSize, this.filteredCustomers.length);
  }
  get displayedCustomers(): Customer[] {
    const start = (this.customerPage - 1) * this.customerPageSize;
    return this.filteredCustomers.slice(start, start + this.customerPageSize);
  }
  prevCustomerPage(): void {
    if (this.customerPage > 1) { this.customerPage--; this.cdr.markForCheck(); }
  }
  nextCustomerPage(): void {
    if (this.customerPage < this.totalCustomerPages) { this.customerPage++; this.cdr.markForCheck(); }
  }

  // Policy Pagination
  get totalPolicyPages(): number {
    return Math.ceil(this.filteredPolicies.length / this.policyPageSize) || 1;
  }
  get policyStartIndex(): number {
    if (this.filteredPolicies.length === 0) return 0;
    return (this.policyPage - 1) * this.policyPageSize + 1;
  }
  get policyEndIndex(): number {
    return Math.min(this.policyPage * this.policyPageSize, this.filteredPolicies.length);
  }
  get displayedPolicies(): Policy[] {
    const start = (this.policyPage - 1) * this.policyPageSize;
    return this.filteredPolicies.slice(start, start + this.policyPageSize);
  }
  prevPolicyPage(): void {
    if (this.policyPage > 1) { this.policyPage--; this.cdr.markForCheck(); }
  }
  nextPolicyPage(): void {
    if (this.policyPage < this.totalPolicyPages) { this.policyPage++; this.cdr.markForCheck(); }
  }

  get clientAvailableVehicles(): Vehicle[] {
    if (!this.quoteClientId) return [];
    return this.vehicles.filter(v => v.customerId === Number(this.quoteClientId));
  }

  constructor(
    public authService: AuthService,
    private customerService: CustomerService,
    private vehicleService: VehicleService,
    private policyService: PolicyService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // 1. Fetch Customers
    this.customerService.getCustomers().subscribe({
      next: (list) => {
        this.customers = list;
        this.applyFilters();
        this.cdr.markForCheck();
      }
    });

    // 2. Fetch Vehicles
    this.vehicleService.getVehicles().subscribe({
      next: (list) => {
        this.vehicles = list;
        this.cdr.markForCheck();
      }
    });

    // 3. Fetch Policies
    this.policyService.getPolicies().subscribe({
      next: (list) => {
        this.policies = list;
        this.totalProduction = list
          .filter(p => p.status === 'ISSUED' || p.status === 'RENEWED')
          .reduce((sum, p) => sum + (p.premium || 0), 0);
        this.applyFilters();
        this.cdr.markForCheck();
      }
    });

    // 4. Fetch Commission Statement for current agent
    this.policyService.getCommissionStatement(this.agentId).subscribe({
      next: (stmt) => {
        this.commissionStatement = stmt;
        this.totalCommissionEarned = stmt.totalCommissionEarned;
        this.cdr.markForCheck();
      },
      error: () => {
        // Fallback calculation if agent ID not seeded directly
        this.totalCommissionEarned = this.totalProduction * 0.10;
        this.cdr.markForCheck();
      }
    });
  }

  setActiveTab(tab: 'CLIENTS' | 'PIPELINE' | 'COMMISSIONS'): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  setPipelineFilter(filter: 'ALL' | 'DRAFT' | 'ISSUED' | 'EXPIRING'): void {
    this.pipelineFilter = filter;
    this.applyFilters();
  }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();

    // Filter Customers
    this.filteredCustomers = this.customers.filter(c => {
      if (!q) return true;
      return (
        c.fullName.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
      );
    });
    this.customerPage = 1;

    // Filter Policies
    let pList = [...this.policies];
    if (this.pipelineFilter === 'DRAFT') {
      pList = pList.filter(p => p.status === 'DRAFT');
    } else if (this.pipelineFilter === 'ISSUED') {
      pList = pList.filter(p => p.status === 'ISSUED');
    } else if (this.pipelineFilter === 'EXPIRING') {
      const today = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(today.getDate() + 30);
      pList = pList.filter(p => {
        if (p.status !== 'ISSUED') return false;
        const end = new Date(p.endDate);
        return end >= today && end <= thirtyDaysLater;
      });
    }

    if (q) {
      pList = pList.filter(p =>
        p.policyNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.vehicleRegistrationNumber.toLowerCase().includes(q)
      );
    }

    this.filteredPolicies = pList;
    this.policyPage = 1;
    this.cdr.markForCheck();
  }

  // ── Client Servicing Reminders ──────────────────────────────

  sendRenewalReminder(policy: Policy): void {
    this.sendingReminderId = policy.id;
    this.policyService.sendRenewalReminder(policy.id).subscribe({
      next: (res) => {
        this.sendingReminderId = null;
        this.actionSuccessMessage = res.message || `Renewal notice successfully sent to ${policy.customerName}.`;
        this.cdr.markForCheck();
        setTimeout(() => { this.actionSuccessMessage = null; this.cdr.markForCheck(); }, 5000);
      },
      error: (err) => {
        this.sendingReminderId = null;
        this.actionErrorMessage = err.message || 'Failed to dispatch renewal reminder.';
        this.cdr.markForCheck();
      }
    });
  }

  sendPaymentReminder(policy: Policy): void {
    this.sendingReminderId = policy.id;
    this.policyService.sendPaymentReminder(policy.id).subscribe({
      next: (res) => {
        this.sendingReminderId = null;
        this.actionSuccessMessage = res.message || `Payment installment notice sent to ${policy.customerName}.`;
        this.cdr.markForCheck();
        setTimeout(() => { this.actionSuccessMessage = null; this.cdr.markForCheck(); }, 5000);
      },
      error: (err) => {
        this.sendingReminderId = null;
        this.actionErrorMessage = err.message || 'Failed to dispatch payment reminder.';
        this.cdr.markForCheck();
      }
    });
  }

  printCommissionStatement(): void {
    window.print();
  }

  // ── Modal 1: Onboarding ─────────────────────────────────────

  openOnboardingModal(): void {
    this.onboardingForm = {
      fullName: '',
      phone: '',
      email: '',
      kycStatus: 'VERIFIED',
      registrationNumber: '',
      make: '',
      model: '',
      manufactureYear: new Date().getFullYear(),
      usageType: 'COMMERCIAL',
      estimatedValue: 25000
    };
    this.showOnboardingModal = true;
    this.cdr.markForCheck();
  }

  closeOnboardingModal(): void {
    this.showOnboardingModal = false;
    this.cdr.markForCheck();
  }

  submitOnboarding(): void {
    if (!this.onboardingForm.fullName.trim() || !this.onboardingForm.phone.trim()) {
      alert('Client legal name and primary phone number are mandatory.');
      return;
    }

    this.submittingOnboarding = true;
    this.customerService.onboardClient(this.onboardingForm).subscribe({
      next: (res) => {
        this.submittingOnboarding = false;
        this.closeOnboardingModal();
        let creds = '';
        if (res.loginUsername && res.temporaryPassword) {
          creds = ` — Client Portal Account Created: Username: "${res.loginUsername}" | Password: "${res.temporaryPassword}"`;
        }
        this.actionSuccessMessage = (res.message || 'Client successfully onboarded to agency portfolio.') + creds;
        this.loadData();
        this.cdr.markForCheck();
        setTimeout(() => { this.actionSuccessMessage = null; this.cdr.markForCheck(); }, 15000);
      },
      error: (err) => {
        this.submittingOnboarding = false;
        alert('Onboarding failed: ' + (err.message || 'Please check input validation'));
        this.cdr.markForCheck();
      }
    });
  }

  // ── Modal 2: Quoting & Application ──────────────────────────

  openQuoteModal(): void {
    this.quoteResult = null;
    if (this.customers.length > 0) {
      this.quoteClientId = this.customers[0].id;
      this.onQuoteClientSelected();
    }
    this.showQuoteModal = true;
    this.cdr.markForCheck();
  }

  openQuoteModalForClient(customer: Customer): void {
    this.quoteResult = null;
    this.quoteClientId = customer.id;
    this.onQuoteClientSelected();
    this.showQuoteModal = true;
    this.cdr.markForCheck();
  }

  onQuoteClientSelected(): void {
    const vehs = this.clientAvailableVehicles;
    this.quoteVehicleId = vehs.length > 0 ? vehs[0].id : null;
    this.cdr.markForCheck();
  }

  closeQuoteModal(): void {
    this.showQuoteModal = false;
    this.cdr.markForCheck();
  }

  calculateQuote(): void {
    if (!this.quoteVehicleId) {
      alert('Please select a client vehicle to rate.');
      return;
    }

    const req: QuoteCalculationRequest = {
      vehicleId: this.quoteVehicleId,
      productCode: this.quoteProductCode,
      estimatedValue: this.quoteEstimatedValue
    };

    this.policyService.calculateQuote(req).subscribe({
      next: (res) => {
        this.quoteResult = res;
        this.cdr.markForCheck();
      },
      error: (err) => {
        alert('Quote rating error: ' + (err.message || 'Check risk parameters'));
      }
    });
  }

  submitProposalToUnderwriting(): void {
    if (!this.quoteResult || !this.quoteClientId || !this.quoteVehicleId) {
      alert('Please run quote calculation first.');
      return;
    }

    const today = new Date(this.quoteStartDate);
    const end = new Date(today);
    end.setFullYear(today.getFullYear() + 1);
    end.setDate(end.getDate() - 1);

    const req: PolicyCreateRequest = {
      customerId: this.quoteClientId,
      vehicleId: this.quoteVehicleId,
      coverageDescription: `Broker Application submitted by ${this.authService.currentUser?.fullName || 'David Kim'} under tariff ${this.quoteResult.productCode}.`,
      productCode: this.quoteResult.productCode,
      deductibleAmount: this.quoteResult.deductibleAmount,
      startDate: this.quoteStartDate,
      endDate: end.toISOString().substring(0, 10),
      premium: this.quoteResult.totalPremium,
      status: 'DRAFT',
      vehicleMarketValue: this.quoteEstimatedValue,
      installmentsCount: this.quoteInstallmentsCount
    };

    this.submittingProposal = true;
    this.policyService.createPolicy(req, 'david.agent').subscribe({
      next: (created) => {
        this.submittingProposal = false;
        this.closeQuoteModal();
        this.actionSuccessMessage = `Proposal application #${created.policyNumber} submitted to senior underwriter desk.`;
        this.loadData();
        this.cdr.markForCheck();
        setTimeout(() => { this.actionSuccessMessage = null; this.cdr.markForCheck(); }, 5000);
      },
      error: (err) => {
        this.submittingProposal = false;
        alert('Failed to submit proposal: ' + (err.message || 'Check validation'));
        this.cdr.markForCheck();
      }
    });
  }

  // ── Modal 3: Add Vehicle to Fleet ───────────────────────────

  openAddVehicleModal(customer: Customer): void {
    this.addVehicleTargetCustomer = customer;
    this.addVehiclePlate = '';
    this.addVehicleMake = '';
    this.addVehicleModel = '';
    this.addVehicleYear = new Date().getFullYear();
    this.addVehicleUsage = 'COMMERCIAL';
    this.showAddVehicleModal = true;
    this.cdr.markForCheck();
  }

  closeAddVehicleModal(): void {
    this.showAddVehicleModal = false;
    this.addVehicleTargetCustomer = null;
    this.cdr.markForCheck();
  }

  submitAddVehicle(): void {
    if (!this.addVehicleTargetCustomer || !this.addVehiclePlate.trim() || !this.addVehicleMake.trim() || !this.addVehicleModel.trim()) {
      alert('Please fill in all vehicle parameters.');
      return;
    }

    const req: VehicleCreateRequest = {
      customerId: this.addVehicleTargetCustomer.id,
      registrationNumber: this.addVehiclePlate.trim().toUpperCase(),
      make: this.addVehicleMake.trim(),
      model: this.addVehicleModel.trim(),
      manufactureYear: this.addVehicleYear
    };

    this.submittingAddVehicle = true;
    this.vehicleService.createVehicle(req).subscribe({
      next: (created) => {
        this.submittingAddVehicle = false;
        this.closeAddVehicleModal();
        this.actionSuccessMessage = `Vehicle ${created.registrationNumber} added to ${this.addVehicleTargetCustomer?.fullName}'s fleet.`;
        this.loadData();
        this.cdr.markForCheck();
        setTimeout(() => { this.actionSuccessMessage = null; this.cdr.markForCheck(); }, 5000);
      },
      error: (err) => {
        this.submittingAddVehicle = false;
        alert('Failed to add vehicle: ' + (err.message || 'Check plate uniqueness'));
        this.cdr.markForCheck();
      }
    });
  }

  getInitials(name?: string): string {
    if (!name) return 'DK';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
  }
}
