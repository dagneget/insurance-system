import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { PolicyService } from '../../core/services/policy.service';
import { PaymentService } from '../../core/services/payment.service';
import { BillingService } from '../../core/services/billing.service';
import { ClaimService } from '../../core/services/claim.service';
import { NotificationService } from '../../core/services/notification.service';
import { CustomerDashboard } from '../../core/models/customer.model';
import { Policy, PolicyCreateRequest, PolicyRenewalRequest, QuoteCalculationDto, QuoteCalculationRequest } from '../../core/models/policy.model';
import { Vehicle, VehicleCreateRequest } from '../../core/models/vehicle.model';
import { Payment, PaymentCreateRequest } from '../../core/models/payment.model';
import { BillingSchedule } from '../../core/models/billing.model';
import { Claim, ClaimCreateRequest } from '../../core/models/claim.model';
import { AppNotification } from '../../core/models/notification.model';
import { ApiErrorResponse } from '../../core/models/api-error.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <!-- Breadcrumb & User Switcher Bar -->
      <div class="top-nav-bar no-print">
        <a routerLink="/users" class="btn btn-sm btn-secondary font-medium">
          ← Back to User Directory
        </a>
        <div class="nav-right-tools">
          <!-- Notification Bell -->
          <div class="notif-wrapper">
            <button
              type="button"
              class="btn-notif-bell"
              (click)="toggleNotifications()"
              [title]="'Notifications (' + unreadNotifsCount + ' unread)'">
              🔔
              <span *ngIf="unreadNotifsCount > 0" class="notif-bubble">{{ unreadNotifsCount }}</span>
            </button>

            <!-- Notifications Drawer -->
            <div *ngIf="showNotificationsPanel" class="notif-dropdown">
              <div class="notif-header">
                <strong>Notifications &amp; Alerts</strong>
                <span class="text-xs text-muted">{{ notifications.length }} total</span>
              </div>
              <div class="notif-list">
                <div *ngFor="let n of notifications" class="notif-item" [class.unread]="!n.read">
                  <div class="notif-title-row">
                    <span class="notif-title">{{ n.title }}</span>
                    <span class="notif-time">{{ n.createdAt | date:'shortTime' }}</span>
                  </div>
                  <p class="notif-msg">{{ n.message }}</p>
                  <button *ngIf="!n.read" class="btn-mark-read" (click)="markNotificationRead(n)">
                    Mark read
                  </button>
                </div>
                <div *ngIf="notifications.length === 0" class="notif-empty">
                  No notifications currently.
                </div>
              </div>
            </div>
          </div>

          <a routerLink="/users" class="btn btn-sm btn-secondary" title="Switch User">
            ⇄ Switch User Profile
          </a>
        </div>
      </div>

      <!-- Loading / Error States -->
      <div *ngIf="loading" class="loading-container no-print">
        <div class="spinner"></div>
        <p>Loading personal insurance dashboard...</p>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger no-print">
        <strong>Error:</strong> {{ errorMessage }}
        <button class="btn btn-sm btn-secondary" style="margin-left: 1rem;" (click)="loadDashboard()">Retry</button>
      </div>

      <div *ngIf="!loading && data">
        <!-- User Profile Hero Banner -->
        <div class="card user-hero-card no-print">
          <div class="user-hero-main">
            <div class="user-hero-avatar">
              {{ getInitials(data.customer.fullName) }}
            </div>
            <div class="user-hero-details">
              <div class="hero-name-row">
                <h1>{{ data.customer.fullName }}</h1>
                <span class="badge-role-pill">Private Fleet Owner</span>
                <span
                  class="badge-kyc-pill"
                  [ngClass]="data.customer.kycStatus === 'VERIFIED' ? 'kyc-verified' : 'kyc-pending'">
                  KYC: {{ data.customer.kycStatus || 'VERIFIED' }}
                </span>
              </div>
              <div class="user-meta-row">
                <span><strong>Client ID:</strong> #CUST-00{{ data.customer.id }}</span>
                <span>·</span>
                <span><strong>Phone:</strong> {{ data.customer.phone }}</span>
                <span *ngIf="data.customer.email">·</span>
                <span *ngIf="data.customer.email"><strong>Email:</strong> {{ data.customer.email }}</span>
                <span>·</span>
                <span><strong>Member Since:</strong> {{ data.customer.createdAt | date:'mediumDate' }}</span>
              </div>
            </div>
          </div>

          <div class="user-hero-actions">
            <button class="btn btn-sm btn-secondary" (click)="openProfileModal()" title="Edit Contact Details">
              ✏️ Edit Profile
            </button>
            <button class="btn btn-sm btn-secondary" (click)="openKycModal()" title="Upload KYC Documents">
              📄 KYC Documents
            </button>
            <button class="btn btn-primary" (click)="openQuoteModal()" title="Request Motor Quote & Purchase">
              📋 Buy Policy
            </button>
            <button class="btn btn-secondary" (click)="openClaimModal()" title="Report Incident / FNOL">
              ⚠️ Report Claim
            </button>
            <button class="btn btn-secondary" (click)="openVehicleModal()" title="Add Vehicle to Garage">
              + Add Vehicle
            </button>
          </div>
        </div>

        <!-- Feedback Alert Messages -->
        <div *ngIf="actionSuccessMessage" class="alert alert-success no-print">
          {{ actionSuccessMessage }}
        </div>
        <div *ngIf="actionErrorMessage" class="alert alert-danger no-print">
          {{ actionErrorMessage }}
        </div>

        <!-- Personal Metrics Grid -->
        <div class="metrics-grid no-print" style="margin-bottom: 1.5rem;">
          <div class="metric-card primary">
            <div class="label">Active Policies</div>
            <div class="value">{{ data.metrics.activePolicies }}</div>
            <div class="metric-sub">Total written: {{ data.metrics.totalPolicies }}</div>
          </div>
          <div class="metric-card info">
            <div class="label">Fleet Garage</div>
            <div class="value">{{ data.metrics.totalVehicles }}</div>
            <div class="metric-sub">Registered vehicle assets</div>
          </div>
          <div class="metric-card success">
            <div class="label">Gross Premium</div>
            <div class="value">{{ data.metrics.totalPremium | number:'1.0-0' }}</div>
            <div class="metric-sub">Total portfolio coverage</div>
          </div>
          <div class="metric-card success">
            <div class="label">Settled Receipts</div>
            <div class="value">{{ data.metrics.totalPaid | number:'1.0-0' }}</div>
            <div class="metric-sub">Verified payments settled</div>
          </div>
          <div class="metric-card warning">
            <div class="label">Outstanding Balance</div>
            <div class="value" [style.color]="data.metrics.outstandingBalance > 0 ? 'var(--color-danger)' : 'var(--color-success)'">
              {{ data.metrics.outstandingBalance | number:'1.0-0' }}
            </div>
            <div class="metric-sub">
              {{ data.metrics.outstandingBalance > 0 ? 'Due on active installments' : 'All accounts settled' }}
            </div>
          </div>
          <div class="metric-card danger">
            <div class="label">Active Claims</div>
            <div class="value" [style.color]="data.metrics.openClaimsCount > 0 ? 'var(--color-danger)' : 'var(--color-text)'">
              {{ data.metrics.openClaimsCount }}
            </div>
            <div class="metric-sub">
              {{ data.metrics.openClaimsCount > 0 ? 'In review / adjustment' : 'No claims pending' }}
            </div>
          </div>
        </div>

        <!-- Navigation Tabs Bar -->
        <div class="dashboard-tabs-bar no-print">
          <button
            type="button"
            class="dash-tab-btn"
            [class.active]="activeTab === 'policies'"
            (click)="setTab('policies')">
            🛡️ Policies &amp; Coverages ({{ data.policies.length }})
          </button>
          <button
            type="button"
            class="dash-tab-btn"
            [class.active]="activeTab === 'vehicles'"
            (click)="setTab('vehicles')">
            🚗 Registered Garage ({{ data.vehicles.length }})
          </button>
          <button
            type="button"
            class="dash-tab-btn"
            [class.active]="activeTab === 'payments'"
            (click)="setTab('payments')">
            💳 Premium Billing &amp; Receipts ({{ data.payments.length }})
          </button>
          <button
            type="button"
            class="dash-tab-btn"
            [class.active]="activeTab === 'claims'"
            (click)="setTab('claims')">
            ⚠️ Claims Tracking &amp; FNOL ({{ data.claims.length }})
          </button>
        </div>

        <!-- TAB 1: POLICIES & COVERAGES -->
        <div *ngIf="activeTab === 'policies'" class="no-print">
          <div *ngIf="data.policies.length === 0" class="card empty-state">
            <h3>No policies registered yet</h3>
            <p>Request a quote and bind coverage for your vehicles.</p>
            <button class="btn btn-primary" style="margin-top: 0.75rem;" (click)="openQuoteModal()">
              + Request Motor Quote
            </button>
          </div>

          <div *ngIf="data.policies.length > 0" class="policies-grid">
            <div *ngFor="let p of data.policies" class="user-policy-card">
              <div class="p-card-top">
                <div class="p-card-badge">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div class="p-card-header-info">
                  <div class="p-card-number font-mono">{{ p.policyNumber }}</div>
                  <div class="p-card-prod">{{ p.productCode || 'COMPREHENSIVE' }}</div>
                </div>
                <span [ngClass]="'badge-dot badge-' + p.status.toLowerCase()">
                  {{ p.status }}
                </span>
              </div>

              <div class="p-card-vehicle-box">
                <div class="sub-label">Insured Vehicle</div>
                <div class="vehicle-plate font-mono">{{ p.vehicleRegistrationNumber }}</div>
                <div class="vehicle-desc">{{ p.vehicleDescription }}</div>
              </div>

              <div class="p-card-financials">
                <div class="p-fin-col">
                  <div class="p-fin-lbl">Premium</div>
                  <div class="p-fin-val">{{ p.premium | number:'1.2-2' }}</div>
                </div>
                <div class="p-fin-col">
                  <div class="p-fin-lbl">Paid</div>
                  <div class="p-fin-val text-success">{{ p.totalPaid | number:'1.2-2' }}</div>
                </div>
                <div class="p-fin-col">
                  <div class="p-fin-lbl">Balance</div>
                  <div class="p-fin-val" [style.color]="p.outstandingBalance > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)'">
                    {{ p.outstandingBalance | number:'1.2-2' }}
                  </div>
                </div>
              </div>

              <div class="p-card-term">
                <span class="sub-label">Period:</span>
                <span class="term-dates">{{ p.startDate }} to {{ p.endDate }}</span>
              </div>

              <div class="p-card-actions">
                <button class="btn btn-sm btn-secondary" (click)="openCertificateModal(p)" style="flex: 1;">
                  📜 View Certificate
                </button>
                <button
                  *ngIf="p.outstandingBalance > 0 && p.status === 'ISSUED'"
                  class="btn btn-sm btn-primary"
                  (click)="openPaymentModal(p)">
                  Pay Balance
                </button>
                <button
                  *ngIf="p.status === 'ISSUED'"
                  class="btn btn-sm btn-secondary"
                  (click)="openClaimModal(p)">
                  File Claim
                </button>
                <button
                  *ngIf="p.status === 'ISSUED' || p.status === 'EXPIRED'"
                  class="btn btn-sm btn-secondary"
                  (click)="renewPolicy(p)">
                  Renew
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: REGISTERED GARAGE -->
        <div *ngIf="activeTab === 'vehicles'" class="no-print">
          <div class="tab-header-row">
            <div>
              <h3 style="margin: 0; font-size: 1.1rem;">Customer Fleet &amp; Garage Assets</h3>
              <p class="text-xs text-muted">Manage company and private fleet vehicles</p>
            </div>
            <button class="btn btn-sm btn-primary" (click)="openVehicleModal()">+ Add Vehicle</button>
          </div>

          <div *ngIf="data.vehicles.length === 0" class="card empty-state">
            <h4>No vehicles registered</h4>
            <p>Add a vehicle to register policies and track motor assets.</p>
            <button class="btn btn-primary" style="margin-top: 0.75rem;" (click)="openVehicleModal()">+ Add Vehicle</button>
          </div>

          <div *ngIf="data.vehicles.length > 0" class="garage-grid">
            <div *ngFor="let v of data.vehicles" class="vehicle-card">
              <div class="vehicle-card-top">
                <div class="vehicle-icon">🚗</div>
                <div>
                  <div class="vehicle-plate font-mono">{{ v.registrationNumber }}</div>
                  <div class="vehicle-model">{{ v.make }} {{ v.model }}</div>
                </div>
              </div>
              <div class="vehicle-meta">
                <span>Model Year: <strong>{{ v.manufactureYear }}</strong></span>
                <span>·</span>
                <span>Registered: {{ v.createdAt | date:'mediumDate' }}</span>
              </div>
              <div style="margin-top: 0.75rem;">
                <button class="btn btn-sm btn-secondary" style="width: 100%;" (click)="quoteForVehicle(v)">
                  + Request Policy Quote
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: BILLING & RECEIPTS -->
        <div *ngIf="activeTab === 'payments'" class="no-print">
          <div class="tab-header-row">
            <div>
              <h3 style="margin: 0; font-size: 1.1rem;">Premium Billing Schedules &amp; Receipts</h3>
              <p class="text-xs text-muted">View scheduled installment debits and verified payment receipts</p>
            </div>
            <button class="btn btn-sm btn-primary" (click)="openPaymentModal()">+ Pay Premium</button>
          </div>

          <!-- Installment Billing Schedule (if any policy has schedules) -->
          <div *ngIf="customerSchedules.length > 0" class="card" style="padding: 0; margin-bottom: 1.5rem;">
            <div class="section-header">
              <div>
                <h4 class="section-title">Upcoming Installment Billing Schedule</h4>
                <p class="section-desc">Scheduled debit due dates and grace periods</p>
              </div>
            </div>
            <div class="table-responsive" style="border: none;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Schedule #</th>
                    <th>Policy #</th>
                    <th>Installment</th>
                    <th>Due Date</th>
                    <th class="th-num">Amount Due</th>
                    <th class="th-num">Paid</th>
                    <th class="th-num">Balance</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let s of customerSchedules">
                    <td><code class="ref-code">SCH-{{ s.id }}</code></td>
                    <td><a [routerLink]="['/policies', s.policyId]" class="link-cell">{{ s.policyNumber }}</a></td>
                    <td><span class="inst-pill">#{{ s.installmentNumber }} of {{ s.totalInstallments }}</span></td>
                    <td>{{ s.dueDate | date:'mediumDate' }}</td>
                    <td class="td-num amount">{{ s.amountDue | number:'1.2-2' }}</td>
                    <td class="td-num amount text-success">{{ s.amountPaid | number:'1.2-2' }}</td>
                    <td class="td-num amount">
                      <strong [style.color]="s.balance > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)'">
                        {{ s.balance | number:'1.2-2' }}
                      </strong>
                    </td>
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
                        (click)="payInstallment(s)">
                        Pay Now
                      </button>
                      <span *ngIf="s.balance <= 0" class="text-xs text-muted">Settled</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Receipts Ledger -->
          <div *ngIf="data.payments.length === 0" class="card empty-state">
            <h4>No payment transactions yet</h4>
            <p>No receipts recorded under this customer's account.</p>
          </div>

          <div *ngIf="data.payments.length > 0" class="card" style="padding: 0;">
            <div class="table-responsive" style="border: none;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ref #</th>
                    <th>Policy #</th>
                    <th>Vehicle</th>
                    <th class="th-num">Amount</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let pay of data.payments">
                    <td><code class="ref-code">{{ pay.transactionReference }}</code></td>
                    <td><a [routerLink]="['/policies', pay.policyId]" class="link-cell">{{ pay.policyNumber }}</a></td>
                    <td>{{ pay.vehicleRegistrationNumber }}</td>
                    <td class="td-num amount">
                      <strong>{{ pay.amount | number:'1.2-2' }}</strong>
                    </td>
                    <td><span class="badge badge-simulated">{{ pay.paymentMethod }}</span></td>
                    <td>{{ pay.paymentDate | date:'medium' }}</td>
                    <td>
                      <span [ngClass]="'badge-dot badge-' + pay.status.toLowerCase()">{{ pay.status }}</span>
                    </td>
                    <td>
                      <button class="btn btn-xs btn-secondary" (click)="viewReceipt(pay)">
                        Receipt
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 4: CLAIMS TRACKING & FNOL -->
        <div *ngIf="activeTab === 'claims'" class="no-print">
          <div class="tab-header-row">
            <div>
              <h3 style="margin: 0; font-size: 1.1rem;">Customer Claims &amp; Incident Tracking</h3>
              <p class="text-xs text-muted">File First Notice of Loss (FNOL) and monitor claims adjustment milestones</p>
            </div>
            <button class="btn btn-sm btn-primary" (click)="openClaimModal()">+ File New Claim</button>
          </div>

          <div *ngIf="data.claims.length === 0" class="card empty-state">
            <h4>No claims submitted</h4>
            <p>You have a clean claims record! Submit an FNOL if an incident occurs.</p>
            <button class="btn btn-primary" style="margin-top: 0.75rem;" (click)="openClaimModal()">+ File New Claim</button>
          </div>

          <div *ngIf="data.claims.length > 0" class="card" style="padding: 0;">
            <div class="table-responsive" style="border: none;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Claim #</th>
                    <th>Incident Date</th>
                    <th>Vehicle</th>
                    <th class="th-num">Requested</th>
                    <th class="th-num">Approved</th>
                    <th>Status</th>
                    <th>Adjuster Decision / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let c of data.claims">
                    <td>
                      <code class="ref-code">{{ c.claimNumber }}</code>
                      <div class="text-xs text-muted">{{ c.description }}</div>
                    </td>
                    <td>{{ c.incidentDate | date:'mediumDate' }}</td>
                    <td>{{ c.vehicleRegistrationNumber || 'Fleet Vehicle' }}</td>
                    <td class="td-num amount">{{ c.requestedAmount | number:'1.2-2' }}</td>
                    <td class="td-num amount">
                      <strong *ngIf="c.approvedAmount" style="color: var(--color-success);">
                        {{ c.approvedAmount | number:'1.2-2' }}
                      </strong>
                      <span *ngIf="!c.approvedAmount" class="text-xs text-muted">—</span>
                    </td>
                    <td>
                      <span [ngClass]="'badge-dot badge-' + c.status.toLowerCase()">{{ c.status }}</span>
                    </td>
                    <td>
                      <div *ngIf="c.decisionNote" class="text-xs">{{ c.decisionNote }}</div>
                      <div *ngIf="!c.decisionNote" class="text-xs text-muted">Awaiting Adjuster review</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      <!-- MODAL: EDIT PROFILE -->
      <div *ngIf="showProfileModal" class="modal-backdrop no-print" role="dialog" aria-modal="true">
        <div class="modal-dialog" style="max-width: 480px;">
          <div class="modal-header">
            <h3>Manage Profile Details</h3>
            <button type="button" class="modal-close-btn" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger">{{ modalError }}</div>
            <div class="form-group">
              <label class="form-label">Full Name / Fleet Owner *</label>
              <input type="text" class="form-control" [(ngModel)]="profileForm.fullName" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number *</label>
              <input type="text" class="form-control" [(ngModel)]="profileForm.phone" />
            </div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-control" [(ngModel)]="profileForm.email" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()" [disabled]="submittingProfile">Cancel</button>
            <button class="btn btn-primary" (click)="submitProfile()" [disabled]="submittingProfile || !profileForm.fullName || !profileForm.phone">
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: KYC DOCUMENTS -->
      <div *ngIf="showKycModal" class="modal-backdrop no-print" role="dialog" aria-modal="true">
        <div class="modal-dialog" style="max-width: 520px;">
          <div class="modal-header">
            <h3>KYC Identification Documents</h3>
            <button type="button" class="modal-close-btn" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger">{{ modalError }}</div>

            <div class="alert alert-info">
              Current Status: <strong>{{ data?.customer?.kycStatus || 'PENDING' }}</strong>.
              Upload official government identification, trade license, or commercial registry to verify fleet account.
            </div>

            <div class="form-group">
              <label class="form-label">Document Type *</label>
              <select class="form-control" [(ngModel)]="kycForm.documentType">
                <option value="NATIONAL_ID">National ID / Kebele Card</option>
                <option value="TRADE_LICENSE">Commercial Fleet Trade License</option>
                <option value="DRIVING_LICENSE">Commercial Driving License</option>
                <option value="TAX_TIN">Tax Identification (TIN Certificate)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Select Document File (Simulated) *</label>
              <input
                type="text"
                class="form-control font-mono"
                [(ngModel)]="kycForm.fileName"
                placeholder="e.g. trade_license_scan.pdf"
              />
              <div class="text-xs text-muted" style="margin-top: 4px;">Supported MIME: PDF, JPEG, PNG (Max 10MB)</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()" [disabled]="submittingKyc">Cancel</button>
            <button class="btn btn-primary" (click)="submitKyc()" [disabled]="submittingKyc || !kycForm.fileName.trim()">
              Upload &amp; Verify KYC
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: MOTOR QUOTING & BUY POLICY -->
      <div *ngIf="showQuoteModal" class="modal-backdrop no-print" role="dialog" aria-modal="true">
        <div class="modal-dialog" style="max-width: 600px;">
          <div class="modal-header">
            <h3>Request Motor Quote &amp; Buy Policy</h3>
            <button type="button" class="modal-close-btn" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger">{{ modalError }}</div>

            <div class="form-group">
              <label class="form-label">Select Fleet Vehicle *</label>
              <select class="form-control" [(ngModel)]="quoteForm.vehicleId" (change)="onQuoteVehicleChange()">
                <option [ngValue]="null">-- Select Vehicle --</option>
                <option *ngFor="let v of data?.vehicles" [ngValue]="v.id">
                  {{ v.registrationNumber }} — {{ v.make }} {{ v.model }} ({{ v.manufactureYear }})
                </option>
              </select>
            </div>

            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Coverage Tier *</label>
                <select class="form-control" [(ngModel)]="quoteForm.productCode" (change)="calculateMotorQuote()">
                  <option value="COMPREHENSIVE">Comprehensive (Full Risk)</option>
                  <option value="THIRD_PARTY">Third-Party Only (Statutory)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Vehicle Market Value ($)</label>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="quoteForm.estimatedValue"
                  (input)="calculateMotorQuote()"
                  placeholder="25000"
                />
              </div>
            </div>

            <!-- Quote Breakdown -->
            <div *ngIf="quoteResult" class="quote-result-box">
              <div class="quote-header">
                <strong>Actuarial Rating Breakdown</strong>
                <span class="badge badge-simulated">{{ quoteResult.productCode }}</span>
              </div>
              <div class="quote-line">
                <span>Base Tariff Premium:</span>
                <span class="amount">{{ quoteResult.basePremium | number:'1.2-2' }}</span>
              </div>
              <div class="quote-line">
                <span>Risk &amp; Usage Loading:</span>
                <span class="amount">{{ quoteResult.riskAdjustment | number:'1.2-2' }}</span>
              </div>
              <div class="quote-line">
                <span>Statutory Taxes &amp; Fees (15%):</span>
                <span class="amount">{{ quoteResult.taxesAndFees | number:'1.2-2' }}</span>
              </div>
              <div class="quote-total">
                <span>Total Annual Premium:</span>
                <span class="total-val">{{ quoteResult.totalPremium | number:'1.2-2' }}</span>
              </div>
            </div>

            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
              <div class="form-group">
                <label class="form-label">Coverage Start Date *</label>
                <input type="date" class="form-control" [(ngModel)]="quoteForm.startDate" />
              </div>
              <div class="form-group">
                <label class="form-label">Installments Plan</label>
                <select class="form-control" [(ngModel)]="quoteForm.installmentsCount">
                  <option [ngValue]="1">Full Payment (1 Installment)</option>
                  <option [ngValue]="2">Semi-Annual (2 Installments)</option>
                  <option [ngValue]="4">Quarterly (4 Installments)</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()" [disabled]="submittingQuote">Cancel</button>
            <button
              class="btn btn-primary"
              (click)="buyPolicy()"
              [disabled]="submittingQuote || !quoteForm.vehicleId || !quoteResult">
              <span *ngIf="submittingQuote" class="spinner" style="width: 14px; height: 14px;"></span>
              Bind Coverage &amp; Issue
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: ADD VEHICLE -->
      <div *ngIf="showVehicleModal" class="modal-backdrop no-print" role="dialog" aria-modal="true">
        <div class="modal-dialog" style="max-width: 480px;">
          <div class="modal-header">
            <h3>Add Vehicle to Garage</h3>
            <button type="button" class="modal-close-btn" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger">{{ modalError }}</div>
            <div class="form-group">
              <label class="form-label">Plate / Registration Number *</label>
              <input type="text" class="form-control font-mono" placeholder="ET-3-A12345" [(ngModel)]="newVehiclePlate" />
            </div>
            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Make *</label>
                <input type="text" class="form-control" placeholder="Toyota" [(ngModel)]="newVehicleMake" />
              </div>
              <div class="form-group">
                <label class="form-label">Model *</label>
                <input type="text" class="form-control" placeholder="Hilux" [(ngModel)]="newVehicleModel" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Manufacture Year *</label>
              <input type="number" class="form-control" [(ngModel)]="newVehicleYear" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()">Cancel</button>
            <button class="btn btn-primary" (click)="submitVehicle()">Register Vehicle</button>
          </div>
        </div>
      </div>

      <!-- MODAL: PAY PREMIUM / INSTALLMENT -->
      <div *ngIf="showPaymentModal" class="modal-backdrop no-print" role="dialog" aria-modal="true">
        <div class="modal-dialog" style="max-width: 500px;">
          <div class="modal-header">
            <h3>Pay Policy Premium</h3>
            <button type="button" class="modal-close-btn" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger">{{ modalError }}</div>
            <div class="form-group">
              <label class="form-label">Policy *</label>
              <select class="form-control" [(ngModel)]="paymentPolicyId" (change)="onPaymentPolicyChange()">
                <option *ngFor="let p of issuedPolicies" [ngValue]="p.id">
                  {{ p.policyNumber }} ({{ p.vehicleRegistrationNumber }}) — Bal: {{ p.outstandingBalance | number:'1.2-2' }}
                </option>
              </select>
            </div>
            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Amount ($) *</label>
                <input type="number" class="form-control" [(ngModel)]="paymentAmount" step="0.01" />
              </div>
              <div class="form-group">
                <label class="form-label">Payment Channel</label>
                <select class="form-control" [(ngModel)]="paymentMethod">
                  <option value="MOBILE_MONEY">Mobile Money (Telebirr)</option>
                  <option value="BANK_TRANSFER">Bank Electronic Wire</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="CASH">Direct Cash</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Transaction Reference</label>
              <input type="text" class="form-control font-mono" [(ngModel)]="paymentRef" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()" [disabled]="submittingPayment">Cancel</button>
            <button class="btn btn-primary" (click)="submitPayment()" [disabled]="submittingPayment || !paymentAmount">
              Pay Now &amp; Generate Receipt
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL: REPORT FNOL CLAIM -->
      <div *ngIf="showClaimModal" class="modal-backdrop no-print" role="dialog" aria-modal="true">
        <div class="modal-dialog" style="max-width: 520px;">
          <div class="modal-header">
            <h3>First Notice of Loss (FNOL)</h3>
            <button type="button" class="modal-close-btn" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger">{{ modalError }}</div>
            <div class="form-group">
              <label class="form-label">Select Active Policy *</label>
              <select class="form-control" [(ngModel)]="claimPolicyId">
                <option [ngValue]="null">-- Select Policy --</option>
                <option *ngFor="let p of issuedPolicies" [ngValue]="p.id">
                  {{ p.policyNumber }} ({{ p.vehicleRegistrationNumber }})
                </option>
              </select>
            </div>
            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Incident Date *</label>
                <input type="date" class="form-control" [(ngModel)]="claimIncidentDate" />
              </div>
              <div class="form-group">
                <label class="form-label">Estimated Loss ($) *</label>
                <input type="number" class="form-control" placeholder="1500.00" [(ngModel)]="claimAmount" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Incident Description &amp; Circumstances *</label>
              <textarea class="form-control" rows="3" placeholder="Describe the accident, location, police case number..." [(ngModel)]="claimDesc"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()">Cancel</button>
            <button class="btn btn-primary" (click)="submitClaim()">Submit FNOL Claim</button>
          </div>
        </div>
      </div>

      <!-- MODAL: CERTIFICATE OF INSURANCE -->
      <div *ngIf="selectedCertificatePolicy" class="modal-backdrop no-print" role="dialog" aria-modal="true">
        <div class="modal-dialog" style="max-width: 620px;">
          <div class="modal-header">
            <h3>Certificate of Motor Insurance</h3>
            <button type="button" class="modal-close-btn" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <div class="cert-card">
              <div class="cert-watermark">INSURED</div>
              <div class="cert-header">
                <div>
                  <div class="cert-company">SAFEMOTOR INSURANCE CO.</div>
                  <div class="cert-title">CERTIFICATE OF MOTOR INSURANCE</div>
                </div>
                <div style="text-align: right;">
                  <div class="cert-num font-mono">{{ selectedCertificatePolicy.policyNumber }}</div>
                  <span class="badge badge-success">ACTIVE COVER</span>
                </div>
              </div>
              <div class="cert-grid">
                <div>
                  <div class="sub-label">Policyholder</div>
                  <div class="cert-val">{{ selectedCertificatePolicy.customerName }}</div>
                </div>
                <div>
                  <div class="sub-label">Insured Vehicle</div>
                  <div class="cert-val font-mono">{{ selectedCertificatePolicy.vehicleRegistrationNumber }}</div>
                </div>
                <div>
                  <div class="sub-label">Coverage Tier</div>
                  <div class="cert-val">{{ selectedCertificatePolicy.productCode || 'COMPREHENSIVE' }}</div>
                </div>
                <div>
                  <div class="sub-label">Deductible</div>
                  <div class="cert-val">{{ selectedCertificatePolicy.deductibleAmount | number:'1.2-2' }}</div>
                </div>
                <div>
                  <div class="sub-label">Effective From</div>
                  <div class="cert-val">{{ selectedCertificatePolicy.startDate }}</div>
                </div>
                <div>
                  <div class="sub-label">Expiry Date</div>
                  <div class="cert-val">{{ selectedCertificatePolicy.endDate }}</div>
                </div>
              </div>
              <div class="cert-footer">
                <div>Authorized Underwriter: Alexander Reed</div>
                <div>SafeMotor Digital Verification Stamp ✓</div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()">Close</button>
            <button class="btn btn-primary" (click)="printPage()">Print Certificate</button>
          </div>
        </div>
      </div>

      <!-- MODAL: OFFICIAL RECEIPT -->
      <div *ngIf="selectedReceipt" class="modal-backdrop no-print" role="dialog" aria-modal="true">
        <div class="modal-dialog" style="max-width: 560px;">
          <div class="modal-header">
            <h3>Official Payment Receipt</h3>
            <button type="button" class="modal-close-btn" (click)="closeModals()">✕</button>
          </div>
          <div class="modal-body">
            <div class="receipt-card">
              <div class="receipt-watermark">RECEIPT</div>
              <div class="receipt-header">
                <div>
                  <div class="receipt-title">SAFEMOTOR OFFICIAL RECEIPT</div>
                  <div class="receipt-subtitle">Premium Collection Voucher</div>
                </div>
                <div style="text-align: right;">
                  <div class="receipt-ref font-mono">{{ selectedReceipt.transactionReference }}</div>
                  <span class="badge badge-success">{{ selectedReceipt.status }}</span>
                </div>
              </div>
              <div class="receipt-grid">
                <div>
                  <div class="sub-label">Policyholder</div>
                  <div class="receipt-val">{{ data?.customer?.fullName }}</div>
                </div>
                <div>
                  <div class="sub-label">Policy Number</div>
                  <div class="receipt-val font-mono">{{ selectedReceipt.policyNumber }}</div>
                </div>
              </div>
              <div class="receipt-amount-box">
                <div class="sub-label">Amount Settled</div>
                <div class="receipt-amount-value">{{ selectedReceipt.amount | number:'1.2-2' }}</div>
              </div>
              <div class="receipt-footer">
                <span>Date: {{ selectedReceipt.paymentDate | date:'medium' }}</span>
                <span>Authorized Officer: Marcus Vance (Finance)</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModals()">Close</button>
            <button class="btn btn-primary" (click)="printPage()">Print Receipt</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .top-nav-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .nav-right-tools { display: flex; align-items: center; gap: 0.75rem; position: relative; }

    .notif-wrapper { position: relative; }
    .btn-notif-bell { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; font-size: 1rem; }
    .notif-bubble { position: absolute; top: -4px; right: -4px; background: #dc2626; color: #fff; font-size: 0.65rem; font-weight: 700; border-radius: 10px; padding: 1px 5px; }

    .notif-dropdown { position: absolute; top: 42px; right: 0; width: 320px; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); z-index: 50; overflow: hidden; }
    .notif-header { padding: 0.625rem 0.875rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; }
    .notif-list { max-height: 280px; overflow-y: auto; }
    .notif-item { padding: 0.625rem 0.875rem; border-bottom: 1px solid #f1f5f9; font-size: 0.775rem; }
    .notif-item.unread { background: #eff6ff; }
    .notif-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
    .notif-title { font-weight: 600; color: #0f172a; }
    .notif-time { font-size: 0.7rem; color: #94a3b8; }
    .notif-msg { margin: 0 0 4px 0; color: #475569; }
    .btn-mark-read { background: transparent; border: none; font-size: 0.7rem; color: #4f46e5; cursor: pointer; padding: 0; }
    .notif-empty { padding: 1.5rem; text-align: center; color: #94a3b8; font-size: 0.8rem; }

    .user-hero-card { padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; background: #fff; border: 1px solid #e2e8f0; margin-bottom: 1.25rem; }
    .user-hero-main { display: flex; align-items: center; gap: 1.25rem; }
    .user-hero-avatar { width: 54px; height: 54px; border-radius: 14px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: 700; flex-shrink: 0; }
    .hero-name-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .hero-name-row h1 { font-size: 1.35rem; margin: 0; color: #0f172a; }
    .badge-role-pill { font-size: 0.725rem; font-weight: 600; background: #eef2ff; color: #4f46e5; padding: 2px 8px; border-radius: 6px; }
    .badge-kyc-pill { font-size: 0.725rem; font-weight: 600; padding: 2px 8px; border-radius: 6px; }
    .kyc-verified { background: #ecfdf5; color: #059669; }
    .kyc-pending { background: #fef3c7; color: #d97706; }
    .user-meta-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #64748b; margin-top: 4px; flex-wrap: wrap; }
    .user-hero-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 0.875rem; }
    .metric-sub { font-size: 0.725rem; color: #64748b; margin-top: 2px; }

    .dashboard-tabs-bar { display: flex; gap: 0.5rem; border-bottom: 2px solid #e2e8f0; margin-bottom: 1.25rem; overflow-x: auto; }
    .dash-tab-btn { background: transparent; border: none; border-bottom: 2px solid transparent; padding: 0.625rem 1rem; font-size: 0.8375rem; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.15s; white-space: nowrap; margin-bottom: -2px; }
    .dash-tab-btn:hover { color: #0f172a; }
    .dash-tab-btn.active { color: #4f46e5; border-bottom-color: #4f46e5; }

    .tab-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .policies-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }
    .user-policy-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.85rem; }
    .p-card-top { display: flex; align-items: center; gap: 0.75rem; }
    .p-card-badge { width: 36px; height: 36px; border-radius: 8px; background: #e0e7ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .p-card-header-info { flex: 1; }
    .p-card-number { font-size: 0.9rem; font-weight: 700; color: #0f172a; }
    .p-card-prod { font-size: 0.75rem; color: #64748b; }
    .p-card-vehicle-box { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 6px; padding: 0.625rem; }
    .sub-label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; }
    .vehicle-plate { font-size: 0.9rem; font-weight: 700; color: #0f172a; }
    .vehicle-desc { font-size: 0.75rem; color: #475569; }
    .p-card-financials { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; text-align: center; background: #f8fafc; border-radius: 6px; padding: 0.5rem; }
    .p-fin-lbl { font-size: 0.7rem; color: #64748b; }
    .p-fin-val { font-size: 0.875rem; font-weight: 700; }
    .p-card-term { display: flex; justify-content: space-between; align-items: center; font-size: 0.775rem; }
    .term-dates { font-weight: 600; color: #334155; }
    .p-card-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

    .garage-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .vehicle-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.15rem; }
    .vehicle-card-top { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
    .vehicle-icon { font-size: 1.5rem; }
    .vehicle-model { font-size: 0.8rem; color: #64748b; }
    .vehicle-meta { font-size: 0.775rem; color: #64748b; }

    .quote-result-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin: 1rem 0; font-size: 0.825rem; }
    .quote-header { display: flex; justify-content: space-between; margin-bottom: 0.625rem; }
    .quote-line { display: flex; justify-content: space-between; margin-bottom: 4px; color: #475569; }
    .quote-total { display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 6px; font-weight: 700; color: #0f172a; }
    .total-val { font-size: 1.15rem; color: #4f46e5; }

    .cert-card { background: #fff; border: 2px solid #0f172a; border-radius: 8px; padding: 1.5rem; position: relative; overflow: hidden; }
    .cert-watermark { position: absolute; right: 10px; top: 10px; font-size: 4rem; font-weight: 900; color: rgba(15,23,42,0.04); pointer-events: none; }
    .cert-header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 0.75rem; margin-bottom: 1rem; }
    .cert-company { font-size: 0.75rem; font-weight: 700; color: #64748b; }
    .cert-title { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
    .cert-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .cert-val { font-size: 0.9rem; font-weight: 700; color: #0f172a; }
    .cert-footer { display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 0.75rem; }

    .receipt-card { background: #fff; border: 2px solid #0f172a; border-radius: 8px; padding: 1.25rem; position: relative; }
    .receipt-watermark { position: absolute; right: 10px; top: 10px; font-size: 3rem; font-weight: 900; color: rgba(15,23,42,0.04); pointer-events: none; }
    .receipt-header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 0.5rem; margin-bottom: 0.75rem; }
    .receipt-title { font-size: 1rem; font-weight: 800; color: #0f172a; }
    .receipt-subtitle { font-size: 0.75rem; color: #64748b; }
    .receipt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem; }
    .receipt-amount-box { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 0.75rem; text-align: center; margin-bottom: 0.75rem; }
    .receipt-amount-value { font-size: 1.5rem; font-weight: 800; color: #059669; }
    .receipt-footer { display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 0.5rem; }

    .ref-code { font-family: monospace; font-size: 0.75rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
    .inst-pill { font-size: 0.725rem; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; color: #334155; }
    .link-cell { color: #4f46e5; text-decoration: none; font-weight: 500; font-size: 0.8125rem; }
    .link-cell:hover { text-decoration: underline; }
    .amount { font-variant-numeric: tabular-nums; }
    .btn-xs { padding: 2px 6px; font-size: 0.725rem; border-radius: 4px; }
    .text-xs { font-size: 0.725rem; }
    .text-muted { color: #64748b; }
    .text-success { color: #059669; }
    .font-mono { font-family: monospace; }
  `]
})
export class UserDashboardComponent implements OnInit {
  customerId = 1; // Default to Abebe Bikila (first seeded customer)
  data: CustomerDashboard | null = null;
  customerSchedules: BillingSchedule[] = [];
  notifications: AppNotification[] = [];
  showNotificationsPanel = false;

  activeTab: 'policies' | 'vehicles' | 'payments' | 'claims' = 'policies';
  loading = true;
  errorMessage: string | null = null;
  actionSuccessMessage: string | null = null;
  actionErrorMessage: string | null = null;

  // Modals state
  modalError: string | null = null;

  // Profile modal
  showProfileModal = false;
  submittingProfile = false;
  profileForm = { fullName: '', phone: '', email: '' };

  // KYC modal
  showKycModal = false;
  submittingKyc = false;
  kycForm = { documentType: 'NATIONAL_ID', fileName: 'national_id_scan.pdf' };

  // Quote & Buy modal
  showQuoteModal = false;
  submittingQuote = false;
  quoteForm: {
    vehicleId: number | null;
    productCode: string;
    estimatedValue: number;
    startDate: string;
    installmentsCount: number;
  } = {
    vehicleId: null,
    productCode: 'COMPREHENSIVE',
    estimatedValue: 25000,
    startDate: new Date().toISOString().substring(0, 10),
    installmentsCount: 1
  };
  quoteResult: QuoteCalculationDto | null = null;

  // Vehicle modal
  showVehicleModal = false;
  newVehiclePlate = '';
  newVehicleMake = '';
  newVehicleModel = '';
  newVehicleYear = new Date().getFullYear();

  // Payment modal
  showPaymentModal = false;
  submittingPayment = false;
  paymentPolicyId: number | null = null;
  paymentBillingScheduleId?: number;
  paymentAmount: number | null = null;
  paymentMethod = 'MOBILE_MONEY';
  paymentRef = '';
  paymentNote = '';

  // Claim modal
  showClaimModal = false;
  claimPolicyId: number | null = null;
  claimIncidentDate = new Date().toISOString().substring(0, 10);
  claimAmount: number | null = null;
  claimDesc = '';

  // Certificate & Receipt modals
  selectedCertificatePolicy: Policy | null = null;
  selectedReceipt: Payment | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private vehicleService: VehicleService,
    private policyService: PolicyService,
    private paymentService: PaymentService,
    private billingService: BillingService,
    private claimService: ClaimService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.customerId = Number(params['id']);
      } else {
        // If logged in as customer, use their associated customer ID if available
        const user = this.authService.currentUser;
        if (user && user.roles.includes('ROLE_CUSTOMER')) {
          this.customerId = 1; // Abebe Bikila
        }
      }
      this.loadDashboard();
      this.loadNotifications();
    });
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    this.customerService.getCustomerDashboard(this.customerId).subscribe({
      next: (dashboardData) => {
        this.data = dashboardData;
        this.loading = false;
        this.loadCustomerSchedules();
        this.cdr.markForCheck();
      },
      error: (err: ApiErrorResponse) => {
        this.errorMessage = err.message || 'Failed to load user dashboard';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadCustomerSchedules(): void {
    if (!this.data || !this.data.policies) return;
    this.customerSchedules = [];
    const issued = this.data.policies.filter(p => p.status === 'ISSUED');
    issued.forEach(pol => {
      this.billingService.getSchedulesByPolicy(pol.id).subscribe({
        next: (schedules) => {
          this.customerSchedules = [...this.customerSchedules, ...schedules];
          this.cdr.markForCheck();
        }
      });
    });
  }

  loadNotifications(): void {
    this.notificationService.getNotifications({ customerId: this.customerId }).subscribe({
      next: (list) => {
        this.notifications = list;
        this.cdr.markForCheck();
      }
    });
  }

  get unreadNotifsCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  toggleNotifications(): void {
    this.showNotificationsPanel = !this.showNotificationsPanel;
    this.cdr.markForCheck();
  }

  markNotificationRead(n: AppNotification): void {
    this.notificationService.markAsRead(n.id).subscribe({
      next: () => {
        n.read = true;
        this.cdr.markForCheck();
      }
    });
  }

  setTab(tab: 'policies' | 'vehicles' | 'payments' | 'claims'): void {
    this.activeTab = tab;
  }

  get issuedPolicies(): Policy[] {
    return this.data ? this.data.policies.filter(p => p.status === 'ISSUED') : [];
  }

  closeModals(): void {
    this.showProfileModal = false;
    this.showKycModal = false;
    this.showQuoteModal = false;
    this.showVehicleModal = false;
    this.showPaymentModal = false;
    this.showClaimModal = false;
    this.selectedCertificatePolicy = null;
    this.selectedReceipt = null;
    this.modalError = null;
    this.cdr.markForCheck();
  }

  // --- Profile Actions ---
  openProfileModal(): void {
    if (!this.data) return;
    this.profileForm = {
      fullName: this.data.customer.fullName,
      phone: this.data.customer.phone,
      email: this.data.customer.email || ''
    };
    this.modalError = null;
    this.showProfileModal = true;
    this.cdr.markForCheck();
  }

  submitProfile(): void {
    this.submittingProfile = true;
    this.modalError = null;

    this.customerService.updateCustomer(this.customerId, this.profileForm, 'abebe.customer').subscribe({
      next: () => {
        this.submittingProfile = false;
        this.closeModals();
        this.actionSuccessMessage = 'Profile contact details updated successfully!';
        this.loadDashboard();
        setTimeout(() => { this.actionSuccessMessage = null; this.cdr.markForCheck(); }, 4000);
      },
      error: (err) => {
        this.submittingProfile = false;
        this.modalError = err.error?.message || 'Failed to update profile';
        this.cdr.markForCheck();
      }
    });
  }

  // --- KYC Actions ---
  openKycModal(): void {
    this.kycForm = {
      documentType: 'NATIONAL_ID',
      fileName: 'national_id_card.pdf'
    };
    this.modalError = null;
    this.showKycModal = true;
    this.cdr.markForCheck();
  }

  submitKyc(): void {
    this.submittingKyc = true;
    this.modalError = null;

    this.customerService.updateKycStatus(this.customerId, 'VERIFIED', this.kycForm.documentType, 'abebe.customer').subscribe({
      next: () => {
        this.submittingKyc = false;
        this.closeModals();
        this.actionSuccessMessage = 'KYC Document submitted and verified successfully!';
        this.loadDashboard();
        setTimeout(() => { this.actionSuccessMessage = null; this.cdr.markForCheck(); }, 4000);
      },
      error: (err) => {
        this.submittingKyc = false;
        this.modalError = err.error?.message || 'Failed to submit KYC document';
        this.cdr.markForCheck();
      }
    });
  }

  // --- Quote & Buy Policy ---
  openQuoteModal(): void {
    const firstVeh = this.data && this.data.vehicles.length > 0 ? this.data.vehicles[0].id : null;
    this.quoteForm = {
      vehicleId: firstVeh,
      productCode: 'COMPREHENSIVE',
      estimatedValue: 25000,
      startDate: new Date().toISOString().substring(0, 10),
      installmentsCount: 1
    };
    this.quoteResult = null;
    this.modalError = null;
    this.showQuoteModal = true;
    if (firstVeh) {
      this.calculateMotorQuote();
    }
    this.cdr.markForCheck();
  }

  quoteForVehicle(v: Vehicle): void {
    this.quoteForm = {
      vehicleId: v.id,
      productCode: 'COMPREHENSIVE',
      estimatedValue: 25000,
      startDate: new Date().toISOString().substring(0, 10),
      installmentsCount: 1
    };
    this.quoteResult = null;
    this.modalError = null;
    this.showQuoteModal = true;
    this.calculateMotorQuote();
    this.cdr.markForCheck();
  }

  onQuoteVehicleChange(): void {
    if (this.quoteForm.vehicleId) {
      this.calculateMotorQuote();
    }
  }

  calculateMotorQuote(): void {
    if (!this.quoteForm.vehicleId) return;

    const req: QuoteCalculationRequest = {
      vehicleId: this.quoteForm.vehicleId,
      productCode: this.quoteForm.productCode,
      estimatedValue: this.quoteForm.estimatedValue
    };

    this.policyService.calculateQuote(req).subscribe({
      next: (res) => {
        this.quoteResult = res;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.modalError = err.error?.message || 'Failed to calculate quote';
        this.cdr.markForCheck();
      }
    });
  }

  buyPolicy(): void {
    if (!this.quoteForm.vehicleId || !this.quoteResult) return;

    this.submittingQuote = true;
    this.modalError = null;

    const endDate = new Date(this.quoteForm.startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const req: PolicyCreateRequest = {
      customerId: this.customerId,
      vehicleId: this.quoteForm.vehicleId,
      productCode: this.quoteForm.productCode,
      coverageDescription: this.quoteResult.coverageDescription,
      deductibleAmount: this.quoteResult.deductibleAmount,
      startDate: this.quoteForm.startDate,
      endDate: endDate.toISOString().substring(0, 10),
      premium: this.quoteResult.totalPremium,
      installmentsCount: this.quoteForm.installmentsCount,
      vehicleMarketValue: this.quoteForm.estimatedValue
    };

    this.policyService.createPolicy(req).subscribe({
      next: (created) => {
        this.submittingQuote = false;
        this.closeModals();
        this.actionSuccessMessage = `Policy ${created.policyNumber} successfully purchased and bound! Certificate generated.`;
        this.loadDashboard();
        this.openCertificateModal(created);
        setTimeout(() => { this.actionSuccessMessage = null; this.cdr.markForCheck(); }, 5000);
      },
      error: (err) => {
        this.submittingQuote = false;
        this.modalError = err.error?.message || 'Failed to issue policy';
        this.cdr.markForCheck();
      }
    });
  }

  // --- Vehicle Actions ---
  openVehicleModal(): void {
    this.newVehiclePlate = '';
    this.newVehicleMake = '';
    this.newVehicleModel = '';
    this.newVehicleYear = new Date().getFullYear();
    this.modalError = null;
    this.showVehicleModal = true;
    this.cdr.markForCheck();
  }

  submitVehicle(): void {
    if (!this.newVehiclePlate.trim() || !this.newVehicleMake.trim() || !this.newVehicleModel.trim()) {
      this.modalError = 'All vehicle fields are required.';
      return;
    }

    const req: VehicleCreateRequest = {
      customerId: this.customerId,
      registrationNumber: this.newVehiclePlate.trim().toUpperCase(),
      make: this.newVehicleMake.trim(),
      model: this.newVehicleModel.trim(),
      manufactureYear: this.newVehicleYear
    };

    this.vehicleService.createVehicle(req).subscribe({
      next: () => {
        this.closeModals();
        this.actionSuccessMessage = 'Vehicle ' + req.registrationNumber + ' successfully added to fleet garage!';
        this.loadDashboard();
        setTimeout(() => { this.actionSuccessMessage = null; this.cdr.markForCheck(); }, 4000);
      },
      error: (err: ApiErrorResponse) => {
        this.modalError = err.message || 'Failed to register vehicle';
        this.cdr.markForCheck();
      }
    });
  }

  // --- Payment & Installment Actions ---
  openPaymentModal(policy?: Policy): void {
    this.paymentPolicyId = policy ? policy.id : (this.issuedPolicies.length > 0 ? this.issuedPolicies[0].id : null);
    this.paymentBillingScheduleId = undefined;
    this.paymentAmount = policy && policy.outstandingBalance > 0 ? policy.outstandingBalance : null;
    this.paymentMethod = 'MOBILE_MONEY';
    this.paymentRef = 'MOB-PAY-' + Math.floor(100000 + Math.random() * 900000);
    this.paymentNote = 'Mobile Money transfer via Customer Portal';
    this.modalError = null;
    this.showPaymentModal = true;
    this.cdr.markForCheck();
  }

  payInstallment(schedule: BillingSchedule): void {
    this.paymentPolicyId = schedule.policyId;
    this.paymentBillingScheduleId = schedule.id;
    this.paymentAmount = schedule.balance;
    this.paymentMethod = 'MOBILE_MONEY';
    this.paymentRef = 'MOB-PAY-' + Math.floor(100000 + Math.random() * 900000);
    this.paymentNote = `Installment #${schedule.installmentNumber} settlement`;
    this.modalError = null;
    this.showPaymentModal = true;
    this.cdr.markForCheck();
  }

  onPaymentPolicyChange(): void {
    if (!this.paymentPolicyId) return;
    const pol = this.issuedPolicies.find(p => p.id === this.paymentPolicyId);
    if (pol) {
      this.paymentAmount = pol.outstandingBalance;
    }
  }

  submitPayment(): void {
    if (!this.paymentPolicyId || !this.paymentAmount || this.paymentAmount <= 0) {
      this.modalError = 'Please select a policy and enter a valid positive amount.';
      return;
    }

    this.submittingPayment = true;
    this.modalError = null;

    const req: PaymentCreateRequest = {
      amount: this.paymentAmount,
      transactionReference: this.paymentRef.trim(),
      paymentMethod: this.paymentMethod,
      note: this.paymentNote.trim(),
      billingScheduleId: this.paymentBillingScheduleId
    };

    this.paymentService.recordPayment(this.paymentPolicyId, req).subscribe({
      next: (created) => {
        this.submittingPayment = false;
        this.closeModals();
        this.actionSuccessMessage = `Payment ${created.transactionReference} of $${created.amount} successfully settled!`;
        this.loadDashboard();
        this.viewReceipt(created);
        setTimeout(() => { this.actionSuccessMessage = null; this.cdr.markForCheck(); }, 4000);
      },
      error: (err: ApiErrorResponse) => {
        this.submittingPayment = false;
        this.modalError = err.message || 'Payment failed';
        this.cdr.markForCheck();
      }
    });
  }

  // --- Claim Actions ---
  openClaimModal(policy?: Policy): void {
    const defaultPolicy = policy || (this.issuedPolicies.length > 0 ? this.issuedPolicies[0] : null);
    this.claimPolicyId = defaultPolicy ? defaultPolicy.id : null;
    this.claimIncidentDate = new Date().toISOString().substring(0, 10);
    this.claimAmount = null;
    this.claimDesc = '';
    this.modalError = null;
    this.showClaimModal = true;
    this.cdr.markForCheck();
  }

  submitClaim(): void {
    if (!this.claimPolicyId || !this.claimAmount || this.claimAmount <= 0 || !this.claimDesc.trim()) {
      this.modalError = 'Please fill out all required FNOL claim details.';
      return;
    }

    const req: ClaimCreateRequest = {
      policyId: this.claimPolicyId,
      incidentDate: this.claimIncidentDate,
      description: this.claimDesc.trim(),
      requestedAmount: this.claimAmount
    };

    this.claimService.createClaim(req).subscribe({
      next: (created) => {
        this.closeModals();
        this.actionSuccessMessage = `Claim #${created.claimNumber} successfully filed! Assigned to Claims Adjuster Sarah Chen for assessment.`;
        this.loadDashboard();
        setTimeout(() => { this.actionSuccessMessage = null; this.cdr.markForCheck(); }, 4000);
      },
      error: (err: ApiErrorResponse) => {
        this.modalError = err.message || 'Claim submission failed';
        this.cdr.markForCheck();
      }
    });
  }

  // --- Policy Renewal ---
  renewPolicy(p: Policy): void {
    if (!confirm(`Do you want to renew policy ${p.policyNumber} for another term?`)) return;

    const start = new Date(p.endDate);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);

    const req: PolicyRenewalRequest = {
      startDate: start.toISOString().substring(0, 10),
      endDate: end.toISOString().substring(0, 10),
      premium: p.premium,
      coverageDescription: p.coverageDescription
    };

    this.policyService.renewPolicy(p.id, req).subscribe({
      next: (renewed) => {
        this.actionSuccessMessage = `Policy successfully renewed as #${renewed.policyNumber}!`;
        this.loadDashboard();
        setTimeout(() => { this.actionSuccessMessage = null; this.cdr.markForCheck(); }, 4000);
      },
      error: (err) => {
        this.actionErrorMessage = err.error?.message || 'Failed to renew policy.';
        setTimeout(() => { this.actionErrorMessage = null; this.cdr.markForCheck(); }, 4000);
      }
    });
  }

  // --- Certificate & Receipt View ---
  openCertificateModal(p: Policy): void {
    this.selectedCertificatePolicy = p;
    this.cdr.markForCheck();
  }

  viewReceipt(pay: Payment): void {
    this.selectedReceipt = pay;
    this.cdr.markForCheck();
  }

  printPage(): void {
    window.print();
  }

  getInitials(name: string): string {
    if (!name) return 'AB';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
}
