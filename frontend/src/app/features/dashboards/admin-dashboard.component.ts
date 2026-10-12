import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { TariffService } from '../../core/services/tariff.service';
import { AdminService } from '../../core/services/admin.service';
import { DashboardSummary } from '../../core/models/dashboard.model';
import { Tariff } from '../../core/models/tariff.model';
import { UserManagement, UnderwriterAuthority, CreateUserRequest } from '../../core/models/user-management.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container" style="padding-top: 1.5rem; padding-bottom: 3rem;">

      <!-- Header -->
      <div class="page-header">
        <div>
          <div class="role-badge-row">
            <span class="role-tag role-tag-admin">Operations Director Desk</span>
            <span class="badge-dot badge-issued">System Nominal</span>
          </div>
          <h1 style="font-size: 1.625rem; font-weight: 700; margin-top: 4px; color: #0f172a;">
            Enterprise Governance &amp; Administration
          </h1>
          <p style="color: #64748b; font-size: 0.875rem; margin-top: 4px;">
            Tariff actuarial configuration, user RBAC &amp; authority limits, database migrations, and immutable audit trails.
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <a routerLink="/actors" class="btn btn-secondary">Actor Directory</a>
          <button (click)="loadAllData()" class="btn btn-secondary" title="Refresh data">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-bar">
        <button [class.active]="activeTab === 'health'" (click)="activeTab = 'health'" class="tab-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
          </svg>
          System Health &amp; Migrations
        </button>
        <button [class.active]="activeTab === 'tariffs'" (click)="activeTab = 'tariffs'" class="tab-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          Tariff &amp; Pricing Engine
        </button>
        <button [class.active]="activeTab === 'users'" (click)="activeTab = 'users'" class="tab-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          User Accounts &amp; Underwriter Authorities
        </button>
        <button [class.active]="activeTab === 'audit'" (click)="activeTab = 'audit'" class="tab-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
          </svg>
          Audit Trail Logs ({{ auditLogs.length }})
        </button>
      </div>

      <!-- Notification Toast -->
      <div *ngIf="actionMessage" class="action-toast" [class.error]="actionIsError">
        <span>{{ actionMessage }}</span>
        <button (click)="actionMessage = null" class="close-btn">&times;</button>
      </div>

      <!-- TAB 1: SYSTEM HEALTH -->
      <div *ngIf="activeTab === 'health'">
        <div class="infra-card">
          <div class="infra-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <div class="infra-text">
            <div class="infra-title">PostgreSQL 16 Enterprise Database · Ready &amp; Connected</div>
            <div class="infra-sub">Schema Version: <strong>V8 (Billing Allocations &amp; Claim Investigations)</strong> · Flyway: Applied · Port: 5432</div>
          </div>
          <span class="badge badge-success">Flyway Migrations Current (V8)</span>
        </div>

        <div *ngIf="summary" class="metrics-grid">
          <div class="metric-card primary">
            <div class="label">Total Policies</div>
            <div class="value">{{ summary.totalPolicies }}</div>
            <div class="sub-value">Active: {{ summary.activePolicies }}</div>
          </div>
          <div class="metric-card success">
            <div class="label">Gross Written Premium</div>
            <div class="value">\${{ summary.totalPremium | number:'1.2-2' }}</div>
            <div class="sub-value">Written Portfolio</div>
          </div>
          <div class="metric-card warning">
            <div class="label">Open Claims</div>
            <div class="value">{{ summary.openClaimsCount }}</div>
            <div class="sub-value">Awaiting Adjustment</div>
          </div>
          <div class="metric-card info">
            <div class="label">Registered Accounts</div>
            <div class="value">{{ summary.totalCustomers }}</div>
            <div class="sub-value">Fleet Units: {{ summary.totalVehicles }}</div>
          </div>
        </div>

        <!-- System Architecture Highlights -->
        <div class="grid grid-2" style="margin-top: 1.5rem; gap: 1rem;">
          <div class="card">
            <h3 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 0.5rem; color: #0f172a;">Active Security &amp; Segregation Controls</h3>
            <ul class="spec-list">
              <li><span class="dot green"></span><strong>Maker-Checker Claims:</strong> Claims adjuster approves loss; only Finance disburses payout vouchers.</li>
              <li><span class="dot green"></span><strong>Tariff Governance:</strong> Actuarial rates managed exclusively by Operations Admin; loaded at policy binding.</li>
              <li><span class="dot green"></span><strong>Underwriter Authority:</strong> Bound limits prevent unauthorized discounts/loadings or high-value risks.</li>
              <li><span class="dot green"></span><strong>Dual Sign-off Payment Voids:</strong> Transaction cancellations $> \$2,500$ require manager co-signature.</li>
              <li><span class="dot green"></span><strong>Append-Only Audit:</strong> Trigger-enforced PostgreSQL database logs preventing deletion or alteration.</li>
            </ul>
          </div>
          <div class="card">
            <h3 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 0.5rem; color: #0f172a;">Runtime Environment Status</h3>
            <table class="data-table" style="font-size: 0.8rem;">
              <tbody>
                <tr><td><strong>Frontend</strong></td><td>Angular 19 Standalone + Vite Dev Server (Port 4200)</td></tr>
                <tr><td><strong>Backend API</strong></td><td>Spring Boot 3.4.3 + Java 21 / 25 (Port 8080)</td></tr>
                <tr><td><strong>Database</strong></td><td>PostgreSQL 16.15 (Flyway Schema v8)</td></tr>
                <tr><td><strong>Active Tariffs</strong></td><td>{{ tariffs.length }} Product Categories</td></tr>
                <tr><td><strong>Active Operators</strong></td><td>{{ users.length }} Registered System Actors</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: TARIFF CONFIGURATION -->
      <div *ngIf="activeTab === 'tariffs'">
        <div class="card" style="padding: 0;">
          <div class="section-header">
            <div>
              <h3 class="section-title">Actuarial Tariff &amp; Rating Engine Configuration</h3>
              <p class="section-desc">Changes here dynamically govern quote pricing, underwriter loading boundaries, broker commissions, and policy excess levels.</p>
            </div>
          </div>

          <div class="table-responsive" style="border: none;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product Cover</th>
                  <th>Base Rate</th>
                  <th>Min Premium</th>
                  <th>Tax Rate</th>
                  <th>Standard Excess</th>
                  <th>Max Loading</th>
                  <th>Max Discount</th>
                  <th>Broker Comm.</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let t of tariffs">
                  <td>
                    <strong>{{ t.productName }}</strong>
                    <div style="font-size: 0.725rem; color: #64748b; font-family: monospace;">{{ t.productCode }}</div>
                  </td>
                  <td>{{ (t.baseRatePercentage * 100) | number:'1.2-2' }}%</td>
                  <td>\${{ t.minPremium | number:'1.2-2' }}</td>
                  <td>{{ (t.taxPercentage * 100) | number:'1.1-1' }}%</td>
                  <td>\${{ t.standardExcess | number:'1.2-2' }}</td>
                  <td><span class="badge badge-warning">+{{ (t.maxLoadingPercentage * 100) | number:'1.1-1' }}%</span></td>
                  <td><span class="badge badge-info">-{{ (t.maxDiscountPercentage * 100) | number:'1.1-1' }}%</span></td>
                  <td><span class="badge badge-success">{{ (t.brokerCommissionPercentage * 100) | number:'1.1-1' }}%</span></td>
                  <td>
                    <button (click)="openTariffModal(t)" class="btn btn-sm btn-secondary">
                      Configure Rates
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 3: USER DIRECTORY & AUTHORITIES -->
      <div *ngIf="activeTab === 'users'">
        <div class="card" style="padding: 0;">
          <div class="section-header">
            <div>
              <h3 class="section-title">System User Directory &amp; Underwriter Authority Limits</h3>
              <p class="section-desc">Manage system access, active statuses, and underwriter binding limits.</p>
            </div>
            <button (click)="openCreateUserModal()" class="btn btn-primary btn-sm">
              + New User Account
            </button>
          </div>

          <div class="table-responsive" style="border: none;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>User &amp; Username</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Account Status</th>
                  <th>Underwriter Authority Limits</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of users">
                  <td>
                    <div style="font-weight: 600; color: #0f172a;">{{ u.fullName }}</div>
                    <div style="font-size: 0.75rem; color: #64748b; font-family: monospace;">{{ u.username }}</div>
                  </td>
                  <td class="cell-secondary">{{ u.email || '—' }}</td>
                  <td>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                      <span *ngFor="let r of u.roles" class="badge badge-info" style="font-size: 0.675rem;">
                        {{ r.replace('ROLE_', '') }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button (click)="toggleUserStatus(u)" [class.badge-success]="u.active" [class.badge-danger]="!u.active" class="badge" style="cursor: pointer; border: none;">
                      {{ u.active ? '● Active' : '○ Suspended' }}
                    </button>
                  </td>
                  <td>
                    <div *ngIf="u.authority; else noAuth">
                      <div style="font-size: 0.775rem;">
                        <strong>Max Sum Insured:</strong> \${{ u.authority.maxSumInsured | number:'1.0-0' }}
                      </div>
                      <div style="font-size: 0.725rem; color: #64748b;">
                        Load: +{{ (u.authority.maxLoadingPercentage * 100) | number:'1.0-0' }}% | 
                        Disc: -{{ (u.authority.maxDiscountPercentage * 100) | number:'1.0-0' }}% |
                        Referrals: {{ u.authority.canApproveReferrals ? 'Yes' : 'No' }}
                      </div>
                    </div>
                    <ng-template #noAuth>
                      <span style="font-size: 0.75rem; color: #94a3b8;">Standard operator (No UW limit)</span>
                    </ng-template>
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px;">
                      <button *ngIf="hasRole(u, 'ROLE_UNDERWRITER')" (click)="openAuthorityModal(u)" class="btn btn-sm btn-secondary" title="Edit Underwriter Authority">
                        Authority
                      </button>
                      <a [routerLink]="['/login']" [queryParams]="{ user: u.username, role: u.roles[0] }" class="btn btn-sm btn-secondary" title="Switch session">
                        Sign In →
                      </a>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 4: AUDIT TRAIL LOGS -->
      <div *ngIf="activeTab === 'audit'">
        <div class="card" style="padding: 0;">
          <div class="section-header">
            <div>
              <h3 class="section-title">Immutable Enterprise Audit Logs</h3>
              <p class="section-desc">Append-only audit trail with actor credentials, timestamps, and JSON snapshots.</p>
            </div>
            <div style="display: flex; gap: 8px;">
              <button (click)="exportAuditLogsCsv()" class="btn btn-secondary btn-sm" [disabled]="auditLogs.length === 0">Export Audit CSV</button>
              <button (click)="loadAuditLogs()" class="btn btn-secondary btn-sm">Refresh Trail</button>
            </div>
          </div>

          <div *ngIf="auditLogs.length === 0" style="padding: 2rem; text-align: center; color: #64748b;">
            No audit events recorded yet. Perform an action like updating a tariff or authority limit to generate logs.
          </div>

          <div *ngIf="auditLogs.length > 0" class="table-responsive" style="border: none;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Change Snapshot</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let a of auditLogs">
                  <td style="font-size: 0.775rem; font-family: monospace; white-space: nowrap;">
                    {{ a.createdAt | date:'yyyy-MM-dd HH:mm:ss' }}
                  </td>
                  <td><strong>{{ a.actorUsername }}</strong></td>
                  <td><span class="badge badge-info" style="font-size: 0.675rem;">{{ a.actorRole }}</span></td>
                  <td><span class="badge badge-warning" style="font-size: 0.675rem;">{{ a.action }}</span></td>
                  <td style="font-size: 0.8rem;">{{ a.entityType }} #{{ a.entityId }}</td>
                  <td>
                    <button (click)="selectedAudit = a" class="btn btn-sm btn-secondary">
                      View JSON Diff
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- MODAL: EDIT TARIFF -->
      <div *ngIf="selectedTariff" class="modal-backdrop">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Configure Tariff: {{ selectedTariff.productName }}</h3>
            <button (click)="selectedTariff = null" class="close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <div class="grid grid-2" style="gap: 1rem;">
              <div class="form-group">
                <label>Base Rate Percentage (%)</label>
                <input type="number" step="0.01" [(ngModel)]="tariffEditForm.baseRatePercent" class="form-control">
                <span class="hint">Annual percentage applied to Vehicle Sum Insured</span>
              </div>
              <div class="form-group">
                <label>Minimum Floor Premium (\$)</label>
                <input type="number" step="100" [(ngModel)]="tariffEditForm.minPremium" class="form-control">
                <span class="hint">Lowest acceptable written premium</span>
              </div>
              <div class="form-group">
                <label>Tax / VAT Rate (%)</label>
                <input type="number" step="0.5" [(ngModel)]="tariffEditForm.taxPercent" class="form-control">
                <span class="hint">Statutory tax applied to gross premium</span>
              </div>
              <div class="form-group">
                <label>Standard Excess Deductible (\$)</label>
                <input type="number" step="50" [(ngModel)]="tariffEditForm.standardExcess" class="form-control">
                <span class="hint">First-loss excess deducted upon claim</span>
              </div>
              <div class="form-group">
                <label>Maximum Risk Loading (%)</label>
                <input type="number" step="1" [(ngModel)]="tariffEditForm.maxLoadingPercent" class="form-control">
                <span class="hint">Ceiling for adverse risk factor surcharges</span>
              </div>
              <div class="form-group">
                <label>Maximum Commercial Discount (%)</label>
                <input type="number" step="1" [(ngModel)]="tariffEditForm.maxDiscountPercent" class="form-control">
                <span class="hint">Authority ceiling for fleet or loyalty discounts</span>
              </div>
              <div class="form-group">
                <label>Broker Commission Rate (%)</label>
                <input type="number" step="0.5" [(ngModel)]="tariffEditForm.brokerCommissionPercent" class="form-control">
                <span class="hint">Standard brokerage commission payable on bound policies</span>
              </div>
              <div class="form-group">
                <label>Third Party Property Damage Limit (\$)</label>
                <input type="number" step="5000" [(ngModel)]="tariffEditForm.thirdPartyPropertyLimit" class="form-control">
                <span class="hint">Statutory property liability sublimit</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button (click)="selectedTariff = null" class="btn btn-secondary">Cancel</button>
            <button (click)="saveTariff()" class="btn btn-primary">Save &amp; Audit Log</button>
          </div>
        </div>
      </div>

      <!-- MODAL: EDIT UNDERWRITER AUTHORITY -->
      <div *ngIf="selectedUserForAuthority" class="modal-backdrop">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Underwriter Authority: {{ selectedUserForAuthority.fullName }}</h3>
            <button (click)="selectedUserForAuthority = null" class="close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <div class="grid grid-2" style="gap: 1rem;">
              <div class="form-group">
                <label>Maximum Sum Insured Approval Limit (\$)</label>
                <input type="number" step="10000" [(ngModel)]="authorityEditForm.maxSumInsured" class="form-control">
                <span class="hint">Risks exceeding this sum are referred to Senior Portfolio Lead</span>
              </div>
              <div class="form-group">
                <label>Max Loading Authority (%)</label>
                <input type="number" step="1" [(ngModel)]="authorityEditForm.maxLoadingPercent" class="form-control">
                <span class="hint">Maximum loading percentage this underwriter can apply</span>
              </div>
              <div class="form-group">
                <label>Max Discount Authority (%)</label>
                <input type="number" step="1" [(ngModel)]="authorityEditForm.maxDiscountPercent" class="form-control">
                <span class="hint">Maximum discretionary discount allowable</span>
              </div>
              <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-top: 1.5rem;">
                <input type="checkbox" id="referralAuth" [(ngModel)]="authorityEditForm.canApproveReferrals" style="width: 18px; height: 18px;">
                <label for="referralAuth" style="margin: 0; cursor: pointer;">Can Approve Referred / High-Risk Policies</label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button (click)="selectedUserForAuthority = null" class="btn btn-secondary">Cancel</button>
            <button (click)="saveAuthority()" class="btn btn-primary">Save Authority Limits</button>
          </div>
        </div>
      </div>

      <!-- MODAL: CREATE USER -->
      <div *ngIf="isCreateUserOpen" class="modal-backdrop">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Provision New User Account</h3>
            <button (click)="isCreateUserOpen = false" class="close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <div class="grid grid-2" style="gap: 1rem;">
              <div class="form-group">
                <label>Username</label>
                <input type="text" [(ngModel)]="newUserForm.username" placeholder="e.g. john.smith" class="form-control">
              </div>
              <div class="form-group">
                <label>Temporary Password</label>
                <input type="password" [(ngModel)]="newUserForm.password" placeholder="••••••••" class="form-control">
              </div>
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" [(ngModel)]="newUserForm.fullName" placeholder="e.g. John Smith" class="form-control">
              </div>
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" [(ngModel)]="newUserForm.email" placeholder="e.g. john@safemotor.demo" class="form-control">
              </div>
              <div class="form-group" style="grid-column: span 2;">
                <label>Primary Role</label>
                <select [(ngModel)]="newUserForm.role" class="form-control">
                  <option value="ROLE_UNDERWRITER">Underwriter &amp; Portfolio Lead</option>
                  <option value="ROLE_CLAIMS_OFFICER">Claims Officer / Adjuster</option>
                  <option value="ROLE_FINANCE_OFFICER">Finance &amp; Billing Officer</option>
                  <option value="ROLE_AGENT">Insurance Agent / Broker</option>
                  <option value="ROLE_CUSTOMER">Policyholder / Customer</option>
                  <option value="ROLE_ADMIN">Operations Director / Admin</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button (click)="isCreateUserOpen = false" class="btn btn-secondary">Cancel</button>
            <button (click)="createUser()" class="btn btn-primary">Create User</button>
          </div>
        </div>
      </div>

      <!-- MODAL: AUDIT DIFF VIEWER -->
      <div *ngIf="selectedAudit" class="modal-backdrop">
        <div class="modal-content" style="max-width: 650px;">
          <div class="modal-header">
            <h3>Audit Snapshot: {{ selectedAudit.action }} #{{ selectedAudit.id }}</h3>
            <button (click)="selectedAudit = null" class="close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <div style="font-size: 0.8rem; margin-bottom: 0.75rem; color: #475569;">
              <strong>Actor:</strong> {{ selectedAudit.actorUsername }} ({{ selectedAudit.actorRole }}) &middot;
              <strong>Target:</strong> {{ selectedAudit.entityType }} ID {{ selectedAudit.entityId }} &middot;
              <strong>Logged:</strong> {{ selectedAudit.createdAt | date:'yyyy-MM-dd HH:mm:ss' }}
            </div>
            
            <div class="grid grid-2" style="gap: 1rem;">
              <div>
                <label style="font-weight: 600; font-size: 0.75rem; color: #64748b;">PREVIOUS STATE (OLD):</label>
                <pre class="json-box">{{ selectedAudit.oldValue || '(Initial state / None)' }}</pre>
              </div>
              <div>
                <label style="font-weight: 600; font-size: 0.75rem; color: #64748b;">COMMITTED STATE (NEW):</label>
                <pre class="json-box">{{ selectedAudit.newValue || '(Removed / Null)' }}</pre>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button (click)="selectedAudit = null" class="btn btn-secondary">Close</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .role-badge-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .role-tag { font-size: 0.725rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
    .role-tag-admin { color: #334155; background: #f1f5f9; }

    .infra-card { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .infra-icon { width: 42px; height: 42px; border-radius: 10px; background: #eef2ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .infra-text { flex: 1; min-width: 200px; }
    .infra-title { font-size: 0.9rem; font-weight: 600; color: #0f172a; }
    .infra-sub { font-size: 0.775rem; color: #64748b; margin-top: 2px; }

    .tab-bar { display: flex; gap: 8px; border-bottom: 1px solid #e2e8f0; margin-bottom: 1.5rem; }
    .tab-btn { display: flex; align-items: center; gap: 8px; padding: 0.625rem 1rem; font-size: 0.85rem; font-weight: 500; color: #64748b; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.15s ease; }
    .tab-btn:hover { color: #0f172a; }
    .tab-btn.active { color: #0284c7; border-bottom-color: #0284c7; font-weight: 600; }

    .section-header { padding: 0.875rem 1.25rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
    .section-title { font-size: 0.9rem; font-weight: 600; color: #0f172a; margin: 0; }
    .section-desc { font-size: 0.75rem; color: #64748b; margin: 2px 0 0; }

    .spec-list { list-style: none; padding: 0; margin: 0; font-size: 0.8rem; color: #334155; }
    .spec-list li { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f8fafc; }
    .dot { width: 7px; height: 7px; border-radius: 50%; }
    .dot.green { background: #10b981; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(2px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-content { background: white; border-radius: 12px; width: 100%; max-width: 580px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); overflow: hidden; animation: popIn 0.2s ease-out; }
    @keyframes popIn { from { transform: scale(0.97); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .modal-header { padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #0f172a; }
    .modal-body { padding: 1.25rem; max-height: 75vh; overflow-y: auto; }
    .modal-footer { padding: 0.875rem 1.25rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 0.5rem; background: #f8fafc; }
    .close-btn { background: none; border: none; font-size: 1.25rem; color: #64748b; cursor: pointer; }

    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group label { font-size: 0.775rem; font-weight: 600; color: #334155; }
    .form-group .hint { font-size: 0.7rem; color: #94a3b8; }
    .form-control { padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; }
    .form-control:focus { outline: none; border-color: #0284c7; box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15); }

    .json-box { background: #0f172a; color: #38bdf8; padding: 0.75rem; border-radius: 6px; font-size: 0.7rem; font-family: monospace; white-space: pre-wrap; word-break: break-all; max-height: 250px; overflow-y: auto; }

    .action-toast { background: #0284c7; color: white; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; font-weight: 500; }
    .action-toast.error { background: #ef4444; }
    .action-toast .close-btn { color: white; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  activeTab: 'health' | 'tariffs' | 'users' | 'audit' = 'health';
  summary: DashboardSummary | null = null;
  tariffs: Tariff[] = [];
  users: UserManagement[] = [];
  auditLogs: any[] = [];

  actionMessage: string | null = null;
  actionIsError = false;

  // Tariff Edit
  selectedTariff: Tariff | null = null;
  tariffEditForm = {
    baseRatePercent: 0,
    minPremium: 0,
    taxPercent: 0,
    standardExcess: 0,
    maxLoadingPercent: 0,
    maxDiscountPercent: 0,
    brokerCommissionPercent: 0,
    thirdPartyPropertyLimit: 0
  };

  // Underwriter Authority Edit
  selectedUserForAuthority: UserManagement | null = null;
  authorityEditForm = {
    maxSumInsured: 0,
    maxLoadingPercent: 0,
    maxDiscountPercent: 0,
    canApproveReferrals: false
  };

  // Create User
  isCreateUserOpen = false;
  newUserForm = {
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'ROLE_UNDERWRITER'
  };

  // Audit View
  selectedAudit: any = null;

  constructor(
    private dashboardService: DashboardService,
    private tariffService: TariffService,
    private adminService: AdminService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.dashboardService.getSummary().subscribe({
      next: (res) => { this.summary = res; this.cdr.markForCheck(); }
    });
    this.tariffService.getAllTariffs().subscribe({
      next: (res) => { this.tariffs = res; this.cdr.markForCheck(); }
    });
    this.adminService.getAllUsers().subscribe({
      next: (res) => { this.users = res; this.cdr.markForCheck(); }
    });
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.adminService.getAuditLogs().subscribe({
      next: (res) => { this.auditLogs = res; this.cdr.markForCheck(); }
    });
  }

  exportAuditLogsCsv(): void {
    if (this.auditLogs.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Actor Username', 'Actor Role', 'Action', 'Entity Type', 'Entity ID', 'Old Value', 'New Value'];
    const rows = this.auditLogs.map(a => [
      a.id,
      a.createdAt,
      `"${a.actorUsername || ''}"`,
      `"${a.actorRole || ''}"`,
      `"${a.action || ''}"`,
      `"${a.entityType || ''}"`,
      a.entityId || '',
      `"${(a.oldValue || '').replace(/"/g, '""')}"`,
      `"${(a.newValue || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  hasRole(user: UserManagement, role: string): boolean {
    return user.roles.includes(role);
  }

  // Tariff Management
  openTariffModal(tariff: Tariff): void {
    this.selectedTariff = tariff;
    this.tariffEditForm = {
      baseRatePercent: Number((tariff.baseRatePercentage * 100).toFixed(2)),
      minPremium: tariff.minPremium,
      taxPercent: Number((tariff.taxPercentage * 100).toFixed(2)),
      standardExcess: tariff.standardExcess,
      maxLoadingPercent: Number((tariff.maxLoadingPercentage * 100).toFixed(2)),
      maxDiscountPercent: Number((tariff.maxDiscountPercentage * 100).toFixed(2)),
      brokerCommissionPercent: Number((tariff.brokerCommissionPercentage * 100).toFixed(2)),
      thirdPartyPropertyLimit: tariff.thirdPartyPropertyLimit || 100000
    };
  }

  saveTariff(): void {
    if (!this.selectedTariff) return;

    const payload: Partial<Tariff> = {
      baseRatePercentage: this.tariffEditForm.baseRatePercent / 100,
      minPremium: this.tariffEditForm.minPremium,
      taxPercentage: this.tariffEditForm.taxPercent / 100,
      standardExcess: this.tariffEditForm.standardExcess,
      maxLoadingPercentage: this.tariffEditForm.maxLoadingPercent / 100,
      maxDiscountPercentage: this.tariffEditForm.maxDiscountPercent / 100,
      brokerCommissionPercentage: this.tariffEditForm.brokerCommissionPercent / 100,
      thirdPartyPropertyLimit: this.tariffEditForm.thirdPartyPropertyLimit
    };

    const currentAdmin = this.authService.currentUser?.username || 'elena.manager';

    this.tariffService.updateTariff(this.selectedTariff.productCode, payload, currentAdmin).subscribe({
      next: (updated) => {
        this.selectedTariff = null;
        this.showMessage(`Tariff for ${updated.productName} updated and audit logged successfully!`);
        this.loadAllData();
      },
      error: (err) => {
        this.showMessage(err.message || 'Failed to update tariff', true);
      }
    });
  }

  // Authority Limits Management
  openAuthorityModal(user: UserManagement): void {
    this.selectedUserForAuthority = user;
    const auth = user.authority;
    this.authorityEditForm = {
      maxSumInsured: auth ? auth.maxSumInsured : 75000,
      maxLoadingPercent: auth ? Number((auth.maxLoadingPercentage * 100).toFixed(0)) : 25,
      maxDiscountPercent: auth ? Number((auth.maxDiscountPercentage * 100).toFixed(0)) : 15,
      canApproveReferrals: auth ? auth.canApproveReferrals : false
    };
  }

  saveAuthority(): void {
    if (!this.selectedUserForAuthority) return;

    const payload: UnderwriterAuthority = {
      maxSumInsured: this.authorityEditForm.maxSumInsured,
      maxLoadingPercentage: this.authorityEditForm.maxLoadingPercent / 100,
      maxDiscountPercentage: this.authorityEditForm.maxDiscountPercent / 100,
      canApproveReferrals: this.authorityEditForm.canApproveReferrals
    };

    const currentAdmin = this.authService.currentUser?.username || 'elena.manager';

    this.adminService.updateUnderwriterAuthority(this.selectedUserForAuthority.id, payload, currentAdmin).subscribe({
      next: () => {
        this.selectedUserForAuthority = null;
        this.showMessage('Underwriter authority limits updated successfully!');
        this.loadAllData();
      },
      error: (err) => {
        this.showMessage(err.message || 'Failed to update authority', true);
      }
    });
  }

  // User Status Toggle
  toggleUserStatus(user: UserManagement): void {
    const newStatus = !user.active;
    const currentAdmin = this.authService.currentUser?.username || 'elena.manager';

    this.adminService.toggleUserStatus(user.id, newStatus, currentAdmin).subscribe({
      next: () => {
        this.showMessage(`User ${user.username} is now ${newStatus ? 'Active' : 'Suspended'}`);
        this.loadAllData();
      },
      error: (err) => {
        this.showMessage(err.message || 'Cannot toggle user status', true);
      }
    });
  }

  // Create User
  openCreateUserModal(): void {
    this.newUserForm = {
      username: '',
      password: '',
      fullName: '',
      email: '',
      role: 'ROLE_UNDERWRITER'
    };
    this.isCreateUserOpen = true;
  }

  createUser(): void {
    if (!this.newUserForm.username || !this.newUserForm.password || !this.newUserForm.fullName) {
      this.showMessage('Please complete username, password, and full name', true);
      return;
    }

    const req: CreateUserRequest = {
      username: this.newUserForm.username.trim(),
      password: this.newUserForm.password.trim(),
      fullName: this.newUserForm.fullName.trim(),
      email: this.newUserForm.email.trim(),
      roles: [this.newUserForm.role]
    };

    const currentAdmin = this.authService.currentUser?.username || 'elena.manager';

    this.adminService.createUser(req, currentAdmin).subscribe({
      next: (created) => {
        this.isCreateUserOpen = false;
        this.showMessage(`User account ${created.username} provisioned successfully!`);
        this.loadAllData();
      },
      error: (err) => {
        this.showMessage(err.message || 'Failed to create user', true);
      }
    });
  }

  showMessage(msg: string, isError = false): void {
    this.actionMessage = msg;
    this.actionIsError = isError;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.actionMessage = null;
      this.cdr.markForCheck();
    }, 5000);
  }
}
