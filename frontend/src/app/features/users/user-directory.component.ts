import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { CustomerDirectoryItem } from '../../core/models/customer.model';
import { ApiErrorResponse } from '../../core/models/api-error.model';

@Component({
  selector: 'app-user-directory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1>User Directory & Portals</h1>
          <p style="color: var(--text-muted);">
            Select any policyholder to launch their personalized motor insurance dashboard, or switch operational roles.
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <a routerLink="/customers" class="btn btn-secondary">+ Register New Customer</a>
          <a routerLink="/dashboards/admin" class="btn btn-primary">Operations Desk</a>
        </div>
      </div>

      <!-- Quick Metrics Summary -->
      <div *ngIf="!loading && directory.length > 0" class="metrics-grid" style="margin-bottom: 1.5rem;">
        <div class="metric-card primary">
          <div class="label">Total Policyholders</div>
          <div class="value">{{ directory.length }}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
            Registered customer accounts
          </div>
        </div>

        <div class="metric-card success">
          <div class="label">Active Coverage</div>
          <div class="value">{{ activePolicyholdersCount }}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
            Users with active motor policies
          </div>
        </div>

        <div class="metric-card warning">
          <div class="label">Balances Outstanding</div>
          <div class="value" [style.color]="balanceDueCount > 0 ? 'var(--warning)' : 'var(--text-main)'">
            {{ balanceDueCount }}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
            Accounts with pending installments
          </div>
        </div>

        <div class="metric-card danger">
          <div class="label">Active Claims Filed</div>
          <div class="value" [style.color]="openClaimsCount > 0 ? 'var(--danger)' : 'var(--text-main)'">
            {{ openClaimsCount }}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
            Pending assessment or payout
          </div>
        </div>
      </div>

      <!-- Filter Toolbar -->
      <div class="card" style="padding: 1rem; margin-bottom: 1.5rem;">
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
          <input
            type="text"
            class="form-control"
            style="flex: 1; min-width: 260px;"
            placeholder="Search by customer name, phone, or email..."
            [(ngModel)]="searchQuery"
            (input)="applyFilter()"
          />
          <button
            class="btn btn-toolbar"
            [class.btn-active-pill]="statusFilter === 'all'"
            (click)="setStatusFilter('all')"
          >
            All Users ({{ directory.length }})
          </button>
          <button
            class="btn btn-toolbar"
            [class.btn-active-pill]="statusFilter === 'active'"
            (click)="setStatusFilter('active')"
          >
            Active Coverage
          </button>
          <button
            class="btn btn-toolbar"
            [class.btn-active-pill]="statusFilter === 'balance'"
            (click)="setStatusFilter('balance')"
          >
            Balance Due
          </button>
          <button
            class="btn btn-toolbar"
            [class.btn-active-pill]="statusFilter === 'claims'"
            (click)="setStatusFilter('claims')"
          >
            Open Claims
          </button>
          <button *ngIf="searchQuery || statusFilter !== 'all'" class="btn btn-secondary btn-sm" (click)="resetFilters()">
            Clear
          </button>
        </div>
      </div>

      <!-- Loading / Error -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading user directory and portfolio metrics...</p>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger">
        <strong>Error:</strong> {{ errorMessage }}
        <button class="btn btn-sm btn-secondary" style="margin-left: 1rem;" (click)="loadDirectory()">Retry</button>
      </div>

      <!-- Policyholders User Cards Grid -->
      <div *ngIf="!loading">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h2 style="font-size: 1.15rem; margin: 0;">Policyholder Dashboards ({{ filteredDirectory.length }})</h2>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Click any card to enter that user's personal view</span>
        </div>

        <div *ngIf="filteredDirectory.length === 0" class="card empty-state">
          <h3>No matching users found</h3>
          <p>No policyholders match your current search or filter criteria.</p>
          <button class="btn btn-secondary" style="margin-top: 0.75rem;" (click)="resetFilters()">Reset Filters</button>
        </div>

        <div *ngIf="filteredDirectory.length > 0" class="user-cards-grid">
          <div
            *ngFor="let u of filteredDirectory"
            class="user-portal-card"
            (click)="openUserDashboard(u.id)"
          >
            <div class="user-card-top">
              <div class="user-card-avatar">
                {{ getInitials(u.fullName) }}
              </div>
              <div class="user-card-header-info">
                <div class="user-card-name">{{ u.fullName }}</div>
                <div class="user-card-id">ID #CUST-00{{ u.id }}</div>
              </div>
              <span class="badge-role">Policyholder</span>
            </div>

            <div class="user-card-contact">
              <div class="contact-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span>{{ u.phone }}</span>
              </div>
              <div class="contact-item" *ngIf="u.email">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <span>{{ u.email }}</span>
              </div>
            </div>

            <div class="user-card-metrics">
              <div class="u-metric">
                <div class="u-metric-val">{{ u.vehicleCount }}</div>
                <div class="u-metric-lbl">Vehicles</div>
              </div>
              <div class="u-metric">
                <div class="u-metric-val">{{ u.activePoliciesCount }}</div>
                <div class="u-metric-lbl">Active Policies</div>
              </div>
              <div class="u-metric">
                <div class="u-metric-val">\${{ u.totalPaid | number:'1.0-0' }}</div>
                <div class="u-metric-lbl">Paid</div>
              </div>
            </div>

            <div class="user-card-footer">
              <div class="user-status-indicators">
                <span *ngIf="u.outstandingBalance > 0" class="badge-dot badge-warning" title="Outstanding Balance Due">
                  Due: \${{ u.outstandingBalance | number:'1.2-2' }}
                </span>
                <span *ngIf="u.outstandingBalance <= 0 && u.totalPaid > 0" class="badge-dot badge-issued" title="Fully Settled">
                  Settled
                </span>
                <span *ngIf="u.openClaimsCount > 0" class="badge-dot badge-danger" title="Open Claims">
                  {{ u.openClaimsCount }} Claim(s)
                </span>
              </div>

              <button class="btn btn-sm btn-primary" (click)="openUserDashboard(u.id); $event.stopPropagation()">
                Enter Portal →
              </button>
            </div>
          </div>
        </div>

        <!-- Operational Desks & Staff Personas Section -->
        <div style="margin-top: 2.5rem; margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.15rem; margin-bottom: 0.35rem;">Operational Desks & Internal Roles</h2>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">
            Fast-switch to internal staff operations dashboards and adjudication work queues.
          </p>
        </div>

        <div class="staff-cards-grid">
          <!-- Persona 1: Alexander Reed -->
          <div class="staff-card" routerLink="/dashboard">
            <div class="staff-avatar staff-underwriting">AR</div>
            <div class="staff-info">
              <div class="staff-name">Alexander Reed</div>
              <div class="staff-role">Underwriting Lead & Portfolio Head</div>
              <div class="staff-desc">Full portfolio metrics, policy issuance, risk underwriting, and expiry tracking.</div>
            </div>
            <a routerLink="/dashboard" class="btn btn-sm btn-secondary">Open Portfolio →</a>
          </div>

          <!-- Persona 2: Sarah Chen -->
          <div class="staff-card" routerLink="/claims">
            <div class="staff-avatar staff-claims">SC</div>
            <div class="staff-info">
              <div class="staff-name">Sarah Chen</div>
              <div class="staff-role">Senior Claims Adjuster</div>
              <div class="staff-desc">First notice of loss assessments, approvals, repudiations, and settlement vouchers.</div>
            </div>
            <a routerLink="/claims" class="btn btn-sm btn-secondary">Open Claims Desk →</a>
          </div>

          <!-- Persona 3: Marcus Vance -->
          <div class="staff-card" routerLink="/payments">
            <div class="staff-avatar staff-finance">MV</div>
            <div class="staff-info">
              <div class="staff-name">Marcus Vance</div>
              <div class="staff-role">Billing & Ledger Lead</div>
              <div class="staff-desc">Centralized collections ledger, receipt generation, reconciliation, and void audits.</div>
            </div>
            <a routerLink="/payments" class="btn btn-sm btn-secondary">Open Ledger →</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }

    .user-portal-card {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.03);
      transition: all 0.15s ease-in-out;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .user-portal-card:hover {
      border-color: #cbd5e1;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px -2px rgba(15, 23, 42, 0.08);
    }

    .user-card-top {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin-bottom: 0.85rem;
    }

    .user-card-avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .user-card-header-info {
      flex: 1;
      min-width: 0;
    }

    .user-card-name {
      font-size: 0.975rem;
      font-weight: 700;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-card-id {
      font-size: 0.725rem;
      color: var(--text-muted);
    }

    .badge-role {
      font-size: 0.7rem;
      font-weight: 600;
      background: #f1f5f9;
      color: #475569;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      flex-shrink: 0;
    }

    .user-card-contact {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 1rem;
      padding: 0.65rem 0.75rem;
      background: #f8fafc;
      border-radius: 8px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.775rem;
      color: #475569;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .contact-item svg {
      color: #94a3b8;
      flex-shrink: 0;
    }

    .user-card-metrics {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0.5rem;
      text-align: center;
      padding: 0.65rem 0;
      border-top: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 1rem;
    }

    .u-metric-val {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .u-metric-lbl {
      font-size: 0.675rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .user-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .user-status-indicators {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-wrap: wrap;
    }

    .btn-active-pill {
      background-color: var(--primary) !important;
      color: #ffffff !important;
      border-color: var(--primary) !important;
    }

    /* Staff Desks */
    .staff-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
    }

    .staff-card {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
    }
    .staff-card:hover {
      border-color: #cbd5e1;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px -2px rgba(15, 23, 42, 0.08);
      text-decoration: none;
    }

    .staff-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 700;
    }
    .staff-underwriting { background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); }
    .staff-claims { background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%); }
    .staff-finance { background: linear-gradient(135deg, #059669 0%, #10b981 100%); }

    .staff-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .staff-role {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--primary);
    }

    .staff-desc {
      font-size: 0.775rem;
      color: var(--text-muted);
      line-height: 1.4;
      margin-top: 0.25rem;
    }
  `]
})
export class UserDirectoryComponent implements OnInit {
  directory: CustomerDirectoryItem[] = [];
  filteredDirectory: CustomerDirectoryItem[] = [];
  loading = true;
  errorMessage: string | null = null;
  searchQuery = '';
  statusFilter: 'all' | 'active' | 'balance' | 'claims' = 'all';

  activePolicyholdersCount = 0;
  balanceDueCount = 0;
  openClaimsCount = 0;

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDirectory();
  }

  loadDirectory(): void {
    this.loading = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    this.customerService.getDirectory().subscribe({
      next: (items) => {
        this.directory = items;
        this.calculateAggregates();
        this.applyFilter();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: ApiErrorResponse) => {
        this.errorMessage = err.message || 'Failed to load user directory';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  calculateAggregates(): void {
    this.activePolicyholdersCount = this.directory.filter(u => u.activePoliciesCount > 0).length;
    this.balanceDueCount = this.directory.filter(u => u.outstandingBalance > 0).length;
    this.openClaimsCount = this.directory.filter(u => u.openClaimsCount > 0).length;
  }

  applyFilter(): void {
    let result = [...this.directory];

    if (this.statusFilter === 'active') {
      result = result.filter(u => u.activePoliciesCount > 0);
    } else if (this.statusFilter === 'balance') {
      result = result.filter(u => u.outstandingBalance > 0);
    } else if (this.statusFilter === 'claims') {
      result = result.filter(u => u.openClaimsCount > 0);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(u =>
        u.fullName.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    }

    this.filteredDirectory = result;
    this.cdr.markForCheck();
  }

  setStatusFilter(filter: 'all' | 'active' | 'balance' | 'claims'): void {
    this.statusFilter = filter;
    this.applyFilter();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.applyFilter();
  }

  openUserDashboard(userId: number): void {
    this.router.navigate(['/users', userId, 'dashboard']);
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
}
