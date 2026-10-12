import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/auth.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  template: `
    <aside class="keeper-sidebar" aria-label="Main navigation">

      <!-- ── Brand Header ──────────────────────────────────────── -->
      <div class="sidebar-brand-row">
        <!-- Hamburger Menu Toggle Icon (matching reference) -->
        <button type="button" class="hamburger-toggle-btn" aria-label="Toggle navigation menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <a routerLink="/" class="brand-link" aria-label="SafeMotor home">
          <div class="brand-text-block">
            <span class="brand-title">SafeMotor</span>
            <span class="brand-subtitle">Powered by Core</span>
          </div>
        </a>

        <!-- Switch Actor Dropdown Trigger -->
        <a routerLink="/actors" class="brand-chevron-btn" title="Switch actor / portal" aria-label="Switch actor">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </a>
      </div>

      <!-- ── Grouped Navigation by Role ────────────────────────── -->
      <nav class="sidebar-nav" aria-label="Primary navigation">

        <!-- 1. UNDERWRITER MENU -->
        <ng-container *ngIf="isUnderwriter">
          <div class="nav-section-title">UNDERWRITING</div>

          <a routerLink="/dashboards/underwriter" routerLinkActive="active" class="nav-item">
            <svg class="nav-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect width="7" height="9" x="3" y="3" rx="1.5"/>
              <rect width="7" height="5" x="14" y="3" rx="1.5"/>
              <rect width="7" height="9" x="14" y="12" rx="1.5"/>
              <rect width="7" height="5" x="3" y="16" rx="1.5"/>
            </svg>
            <span class="nav-label">Underwriting Desk</span>
          </a>

          <a routerLink="/policies" [routerLinkActiveOptions]="{exact: true}" routerLinkActive="active" class="nav-item">
            <svg class="nav-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span class="nav-label">Policies Portfolio</span>
          </a>

          <a routerLink="/policies" [queryParams]="{ filter: 'expiring' }" routerLinkActive="active" class="nav-item">
            <svg class="nav-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span class="nav-label">Pending Renewals</span>
            <span class="nav-count-badge">2</span>
          </a>
        </ng-container>

        <!-- 2. CLAIMS OFFICER MENU -->
        <ng-container *ngIf="isClaimsOfficer">
          <div class="nav-section-title">CLAIMS DESK</div>

          <a routerLink="/dashboards/claims" routerLinkActive="active" class="nav-item">
            <svg class="nav-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect width="7" height="9" x="3" y="3" rx="1.5"/>
              <rect width="7" height="5" x="14" y="3" rx="1.5"/>
              <rect width="7" height="9" x="14" y="12" rx="1.5"/>
              <rect width="7" height="5" x="3" y="16" rx="1.5"/>
            </svg>
            <span class="nav-label">Claims Desk</span>
          </a>

          <a routerLink="/claims" routerLinkActive="active" class="nav-item">
            <svg class="nav-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect width="8" height="4" x="8" y="2" rx="1"/>
              <path d="m9 14 2 2 4-4"/>
            </svg>
            <span class="nav-label">Claims Directory</span>
          </a>

          <a routerLink="/policies" routerLinkActive="active" class="nav-item">
            <svg class="nav-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span class="nav-label">Policy Lookup</span>
          </a>
        </ng-container>

        <!-- 3. FINANCE OFFICER MENU -->
        <ng-container *ngIf="isFinanceOfficer">
          <div class="nav-section-title">FINANCE &amp; BILLING</div>

          <a routerLink="/dashboards/finance" routerLinkActive="active" class="nav-item">
            <svg class="nav-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect width="7" height="9" x="3" y="3" rx="1.5"/>
              <rect width="7" height="5" x="14" y="3" rx="1.5"/>
              <rect width="7" height="9" x="14" y="12" rx="1.5"/>
              <rect width="7" height="5" x="3" y="16" rx="1.5"/>
            </svg>
            <span class="nav-label">Finance Desk</span>
          </a>

          <a routerLink="/payments" routerLinkActive="active" class="nav-item">
            <svg class="nav-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect width="20" height="14" x="2" y="5" rx="2"/>
              <line x1="2" x2="22" y1="10" y2="10"/>
            </svg>
            <span class="nav-label">Payment Ledger</span>
          </a>

          <a routerLink="/policies" routerLinkActive="active" class="nav-item">
            <svg class="nav-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span class="nav-label">Policy Balances</span>
          </a>
        </ng-container>

        <!-- 4. AGENT / BROKER MENU -->
        <ng-container *ngIf="isAgent">
          <div class="nav-section-title">BROKER DESK</div>

          <a routerLink="/dashboards/agent" routerLinkActive="active" class="nav-item">
            <svg class="nav-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect width="7" height="9" x="3" y="3" rx="1.5"/>
              <rect width="7" height="5" x="14" y="3" rx="1.5"/>
              <rect width="7" height="9" x="14" y="12" rx="1.5"/>
              <rect width="7" height="5" x="3" y="16" rx="1.5"/>
            </svg>
            <span class="nav-label">Agent Overview</span>
          </a>

          <a routerLink="/customers" routerLinkActive="active" class="nav-item">
            <svg class="nav-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
            <span class="nav-label">Customers</span>
          </a>

          <a routerLink="/vehicles" routerLinkActive="active" class="nav-item">
            <svg class="nav-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
            <span class="nav-label">Vehicles Fleet</span>
          </a>

          <a routerLink="/policies" routerLinkActive="active" class="nav-item">
            <svg class="nav-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span class="nav-label">Proposals &amp; Policies</span>
          </a>
        </ng-container>

        <!-- 5. POLICYHOLDER / CUSTOMER MENU -->
        <ng-container *ngIf="isCustomer">
          <div class="nav-section-title">MY ACCOUNT</div>

          <a routerLink="/dashboards/customer" routerLinkActive="active" class="nav-item">
            <svg class="nav-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect width="7" height="9" x="3" y="3" rx="1.5"/>
              <rect width="7" height="5" x="14" y="3" rx="1.5"/>
              <rect width="7" height="9" x="14" y="12" rx="1.5"/>
              <rect width="7" height="5" x="3" y="16" rx="1.5"/>
            </svg>
            <span class="nav-label">My Policyholder Portal</span>
          </a>
        </ng-container>

        <!-- 6. ADMINISTRATOR MENU -->
        <ng-container *ngIf="isAdmin">
          <div class="nav-section-title">ADMINISTRATION</div>

          <a routerLink="/dashboards/admin" routerLinkActive="active" class="nav-item">
            <svg class="nav-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect width="7" height="9" x="3" y="3" rx="1.5"/>
              <rect width="7" height="5" x="14" y="3" rx="1.5"/>
              <rect width="7" height="9" x="14" y="12" rx="1.5"/>
              <rect width="7" height="5" x="3" y="16" rx="1.5"/>
            </svg>
            <span class="nav-label">Admin Overview</span>
          </a>

          <div class="nav-section-title" style="margin-top: 1.25rem;">OPERATIONAL DESKS</div>

          <a routerLink="/dashboards/underwriter" routerLinkActive="active" class="nav-item">
            <span class="nav-label">Underwriting Desk</span>
          </a>
          <a routerLink="/dashboards/claims" routerLinkActive="active" class="nav-item">
            <span class="nav-label">Claims Desk</span>
          </a>
          <a routerLink="/dashboards/finance" routerLinkActive="active" class="nav-item">
            <span class="nav-label">Finance Desk</span>
          </a>
          <a routerLink="/dashboards/agent" routerLinkActive="active" class="nav-item">
            <span class="nav-label">Agent Desk</span>
          </a>

          <div class="nav-section-title" style="margin-top: 1.25rem;">REGISTRIES</div>

          <a routerLink="/policies" routerLinkActive="active" class="nav-item"><span class="nav-label">Policies</span></a>
          <a routerLink="/claims" routerLinkActive="active" class="nav-item"><span class="nav-label">Claims</span></a>
          <a routerLink="/payments" routerLinkActive="active" class="nav-item"><span class="nav-label">Payments</span></a>
          <a routerLink="/customers" routerLinkActive="active" class="nav-item"><span class="nav-label">Customers</span></a>
          <a routerLink="/vehicles" routerLinkActive="active" class="nav-item"><span class="nav-label">Vehicles</span></a>

          <div class="nav-section-title" style="margin-top: 1.25rem;">TOOLS</div>

          <a routerLink="/actors" routerLinkActive="active" class="nav-item">
            <svg class="nav-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span class="nav-label">Actor Portals</span>
          </a>
        </ng-container>
      </nav>

      <!-- ── Bottom Performance Widget (matching reference bottom card) ─ -->
      <div class="sidebar-bottom-container">
        <div class="bottom-contest-card">
          <div class="contest-header">
            <span class="contest-title">SafeMotor Core · Online</span>
          </div>

          <div class="contest-avatar-wrap">
            <div class="contest-avatar-circle">
              <span>{{ getInitials(authService.currentUser?.fullName) }}</span>
            </div>
            <div class="contest-points-number">{{ (authService.currentUser?.roles?.length || 1) * 100 + 363 }}</div>
          </div>

          <div class="contest-action-row">
            <button type="button" class="btn-contest-link" (click)="toggleRoleSwitcher()">
              {{ authService.getRoleDisplayName(activeRole!) }} &gt;
            </button>
            <button
              type="button"
              class="sidebar-logout-icon-btn"
              (click)="authService.logout()"
              title="Sign Out"
              aria-label="Sign Out"
            >
              ⎋
            </button>
          </div>
        </div>

        <!-- Role switcher dropdown -->
        <div *ngIf="showRoleSwitcher && hasMultipleRoles" class="role-switcher-dropdown" role="listbox">
          <div class="role-switcher-label">Switch Active Role</div>
          <button
            *ngFor="let r of authService.currentUser?.roles"
            type="button"
            class="role-option-btn"
            [class.is-active]="r === activeRole"
            (click)="selectRole(r)"
          >
            <span>{{ authService.getRoleDisplayName(r) }}</span>
            <span *ngIf="r === activeRole">✓</span>
          </button>
        </div>
      </div>

    </aside>
  `,
  styles: [`
    .keeper-sidebar {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: #ffffff;
      padding: 1.25rem 1rem;
      user-select: none;
      position: relative;
    }

    /* ── Brand Header Row ────────────────────────────────────── */
    .sidebar-brand-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.65rem;
      margin-bottom: 1.5rem;
      padding: 0 0.25rem;
    }

    .hamburger-toggle-btn {
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem;
      border-radius: 6px;
      transition: color 0.12s ease;
    }

    .hamburger-toggle-btn:hover {
      color: #0f172a;
    }

    .brand-link {
      display: flex;
      align-items: center;
      text-decoration: none;
      flex: 1;
    }

    .brand-text-block {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
      line-height: 1.1;
    }

    .brand-subtitle {
      font-size: 0.65rem;
      color: #94a3b8;
      font-weight: 500;
    }

    .brand-chevron-btn {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      text-decoration: none;
      transition: all 0.12s ease;
    }

    .brand-chevron-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    /* ── Navigation List ─────────────────────────────────────── */
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
      overflow-y: auto;
      scrollbar-width: thin;
      padding-right: 0.25rem;
    }

    .nav-section-title {
      font-size: 0.6875rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 0.5rem 0.65rem 0.25rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.55rem 0.75rem;
      border-radius: 8px;
      color: #64748b;
      font-size: 0.835rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.12s ease;
      position: relative;
    }

    .nav-item:hover {
      background-color: #f8fafc;
      color: #0f172a;
      text-decoration: none;
    }

    .nav-item-icon {
      color: inherit;
      flex-shrink: 0;
      transition: color 0.12s ease;
    }

    .nav-label {
      flex: 1;
    }

    /* Active Nav Item - Solid Dark Charcoal Pill matching Reference */
    .nav-item.active {
      background-color: #1e293b;
      color: #ffffff;
      font-weight: 600;
    }

    .nav-item.active .nav-item-icon {
      color: #ffffff;
    }

    .nav-count-badge {
      background-color: #ef4444;
      color: #ffffff;
      font-size: 0.675rem;
      font-weight: 700;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    /* ── Bottom Performance Widget (matching reference bottom card) ─ */
    .sidebar-bottom-container {
      margin-top: auto;
      padding-top: 1rem;
      position: relative;
    }

    .bottom-contest-card {
      background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
      border-radius: 12px;
      padding: 0.95rem 1rem;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 4px 12px rgba(6, 78, 59, 0.2);
    }

    .contest-header {
      font-size: 0.6875rem;
      color: #a7f3d0;
      font-weight: 600;
      margin-bottom: 0.65rem;
    }

    .contest-avatar-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      margin-bottom: 0.65rem;
    }

    .contest-avatar-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #10b981;
      border: 3px solid rgba(255, 255, 255, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 700;
      color: #ffffff;
      box-shadow: 0 0 16px rgba(16, 185, 129, 0.5);
    }

    .contest-points-number {
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #ffffff;
    }

    .contest-action-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      margin-top: 0.25rem;
      padding-top: 0.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
    }

    .btn-contest-link {
      background: transparent;
      border: none;
      color: #ffffff;
      font-size: 0.725rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .btn-contest-link:hover {
      text-decoration: underline;
    }

    .sidebar-logout-icon-btn {
      background: transparent;
      border: none;
      color: #cbd5e1;
      font-size: 1.1rem;
      cursor: pointer;
      line-height: 1;
      transition: color 0.12s ease;
    }

    .sidebar-logout-icon-btn:hover {
      color: #f87171;
    }

    /* ── Role Switcher Dropdown ──────────────────────────────── */
    .role-switcher-dropdown {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 0;
      right: 0;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
      padding: 0.5rem;
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .role-switcher-label {
      font-size: 0.675rem;
      text-transform: uppercase;
      font-weight: 700;
      color: #94a3b8;
      padding: 0.35rem 0.5rem 0.2rem;
    }

    .role-option-btn {
      background: #f8fafc;
      border: 1px solid transparent;
      border-radius: 6px;
      padding: 0.45rem 0.65rem;
      font-size: 0.785rem;
      font-weight: 500;
      color: #334155;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.12s ease;
    }

    .role-option-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .role-option-btn.is-active {
      background: #ecfdf5;
      border-color: #a7f3d0;
      color: #047857;
      font-weight: 600;
    }
  `]
})
export class NavbarComponent {
  showRoleSwitcher = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  get activeRole(): UserRole | null {
    return this.authService.activeRole;
  }

  get isUnderwriter(): boolean {
    return this.activeRole === 'ROLE_UNDERWRITER';
  }

  get isClaimsOfficer(): boolean {
    return this.activeRole === 'ROLE_CLAIMS_OFFICER';
  }

  get isFinanceOfficer(): boolean {
    return this.activeRole === 'ROLE_FINANCE_OFFICER';
  }

  get isAgent(): boolean {
    return this.activeRole === 'ROLE_AGENT';
  }

  get isCustomer(): boolean {
    return this.activeRole === 'ROLE_CUSTOMER';
  }

  get isAdmin(): boolean {
    return this.activeRole === 'ROLE_ADMIN';
  }

  get dashboardLink(): string {
    return this.authService.getDashboardRouteForRole();
  }

  get hasMultipleRoles(): boolean {
    return (this.authService.currentUser?.roles.length || 0) > 1;
  }

  get canViewPolicies(): boolean {
    return !this.authService.isAuthenticated() ||
           this.authService.hasRole(['ROLE_UNDERWRITER', 'ROLE_AGENT', 'ROLE_ADMIN', 'ROLE_CUSTOMER']);
  }

  get canViewPayments(): boolean {
    return !this.authService.isAuthenticated() ||
           this.authService.hasRole(['ROLE_FINANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_CUSTOMER']);
  }

  get canViewClaims(): boolean {
    return !this.authService.isAuthenticated() ||
           this.authService.hasRole(['ROLE_CLAIMS_OFFICER', 'ROLE_ADMIN', 'ROLE_CUSTOMER']);
  }

  get canViewCustomers(): boolean {
    return !this.authService.isAuthenticated() ||
           this.authService.hasRole(['ROLE_AGENT', 'ROLE_ADMIN']);
  }

  toggleRoleSwitcher(): void {
    if (this.hasMultipleRoles) {
      this.showRoleSwitcher = !this.showRoleSwitcher;
      this.cdr.markForCheck();
    } else {
      this.router.navigate(['/actors']);
    }
  }

  selectRole(role: UserRole): void {
    this.authService.switchRole(role).subscribe({
      next: () => {
        this.showRoleSwitcher = false;
        const target = this.authService.getDashboardRouteForRole(role);
        this.router.navigateByUrl(target);
        this.cdr.markForCheck();
      }
    });
  }

  getInitials(name?: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
  }
}
