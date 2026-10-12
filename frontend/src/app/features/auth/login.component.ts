import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiErrorResponse } from '../../core/models/api-error.model';
import { UserRole } from '../../core/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="login-card">

        <!-- Brand + header -->
        <div class="login-header">
          <div class="login-brand-mark" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 4.5L18.5 7.5V12C18.5 16.5 15.5 19.5 12 21C8.5 19.5 5.5 16.5 5.5 12V7.5L12 4.5Z" fill="#4f46e5" stroke="#4f46e5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9.5 12L11 13.5L14.5 10" stroke="#ffffff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1 class="login-title">Sign in to SafeMotor</h1>
          <p class="login-subtitle">Motor Insurance Management &amp; Operations</p>
        </div>

        <!-- Role context banner -->
        <div *ngIf="targetRoleLabel" class="role-banner" role="status">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span class="role-banner-label">Authenticating as</span>
          <strong class="role-banner-value">{{ targetRoleLabel }}</strong>
        </div>

        <!-- Error alert -->
        <div *ngIf="errorMessage" class="alert alert-danger" role="alert" aria-live="polite">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="flex-shrink:0">
            <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Sign-in form -->
        <form (ngSubmit)="onSubmit()" novalidate aria-label="Sign-in form">
          <div class="form-group">
            <label class="form-label" for="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              class="form-control"
              placeholder="e.g. alexander.uw"
              [(ngModel)]="username"
              name="username"
              required
              autocomplete="username"
              [attr.aria-invalid]="errorMessage ? 'true' : null"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              class="form-control"
              placeholder="••••••••"
              [(ngModel)]="password"
              name="password"
              required
              autocomplete="current-password"
              [attr.aria-invalid]="errorMessage ? 'true' : null"
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary login-submit-btn"
            [disabled]="loading || !username.trim() || !password.trim()"
            [attr.aria-busy]="loading"
          >
            <span *ngIf="loading" class="spinner" style="width: 14px; height: 14px;" aria-hidden="true"></span>
            <span>{{ loading ? 'Signing in…' : 'Sign in' }}</span>
          </button>
        </form>

        <!-- Quick demo credentials -->
        <div class="demo-section">
          <div class="demo-section-label">Quick demo access</div>
          <div class="demo-grid">
            <button type="button" class="demo-btn" (click)="fillCredentials('abebe.customer', 'password123', 'ROLE_CUSTOMER')">
              <span class="demo-btn-icon" aria-hidden="true">👤</span> Policyholder
            </button>
            <button type="button" class="demo-btn" (click)="fillCredentials('alexander.uw', 'password123', 'ROLE_UNDERWRITER')">
              <span class="demo-btn-icon" aria-hidden="true">🛡️</span> Underwriter
            </button>
            <button type="button" class="demo-btn" (click)="fillCredentials('sarah.claims', 'password123', 'ROLE_CLAIMS_OFFICER')">
              <span class="demo-btn-icon" aria-hidden="true">⚖️</span> Claims Officer
            </button>
            <button type="button" class="demo-btn" (click)="fillCredentials('marcus.finance', 'password123', 'ROLE_FINANCE_OFFICER')">
              <span class="demo-btn-icon" aria-hidden="true">💳</span> Finance Officer
            </button>
            <button type="button" class="demo-btn" (click)="fillCredentials('david.agent', 'password123', 'ROLE_AGENT')">
              <span class="demo-btn-icon" aria-hidden="true">🤝</span> Agent / Broker
            </button>
            <button type="button" class="demo-btn demo-btn-admin" (click)="fillCredentials('elena.manager', 'password123', 'ROLE_ADMIN')">
              <span class="demo-btn-icon" aria-hidden="true">⭐</span> Admin (Multi-Role)
            </button>
          </div>
        </div>

        <!-- Back link -->
        <div class="login-back">
          <a routerLink="/actors" class="back-link">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="m19 12H5"/><path d="m12 19-7-7 7-7"/>
            </svg>
            Back to Actor Directory
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100%;
      padding: 2.5rem 1rem;
    }

    .login-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 2.25rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.07), 0 1px 4px -1px rgba(15, 23, 42, 0.04);
    }

    /* ── Header ────────────────────────────────────────── */
    .login-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .login-brand-mark {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #eef2ff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.9rem;
    }

    .login-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.025em;
      margin-bottom: 0.25rem;
    }

    .login-subtitle {
      font-size: 0.825rem;
      color: #64748b;
      margin: 0;
    }

    /* ── Role banner ───────────────────────────────────── */
    .role-banner {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: #eef2ff;
      border: 1px solid #e0e7ff;
      border-radius: 8px;
      font-size: 0.8rem;
      color: #3730a3;
      margin-bottom: 1.25rem;
    }

    .role-banner-label {
      color: #6366f1;
      font-weight: 500;
      font-size: 0.75rem;
    }

    .role-banner-value {
      font-weight: 600;
    }

    /* ── Submit button ─────────────────────────────────── */
    .login-submit-btn {
      width: 100%;
      padding: 0.625rem 1rem;
      font-size: 0.9rem;
      font-weight: 600;
      margin-top: 0.5rem;
      min-height: 42px;
      justify-content: center;
      gap: 8px;
    }

    /* ── Demo section ──────────────────────────────────── */
    .demo-section {
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid #f1f5f9;
    }

    .demo-section-label {
      font-size: 0.725rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 0.625rem;
    }

    .demo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .demo-btn {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 7px;
      padding: 0.4rem 0.65rem;
      font-size: 0.775rem;
      font-weight: 500;
      color: #334155;
      cursor: pointer;
      text-align: left;
      transition: all 0.12s ease;
      font-family: inherit;
      display: flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      overflow: hidden;
    }

    .demo-btn:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: #0f172a;
    }

    .demo-btn-admin {
      grid-column: 1 / -1;
      background: #eef2ff;
      border-color: #e0e7ff;
      color: #3730a3;
    }

    .demo-btn-admin:hover {
      background: #e0e7ff;
      border-color: #c7d2fe;
    }

    .demo-btn-icon {
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    /* ── Back link ─────────────────────────────────────── */
    .login-back {
      text-align: center;
      margin-top: 1.25rem;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
    }

    .back-link {
      font-size: 0.8rem;
      color: #64748b;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: color 0.12s ease;
    }

    .back-link:hover {
      color: #4f46e5;
      text-decoration: none;
    }
  `]
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  loading = false;
  errorMessage: string | null = null;
  targetRoleLabel: string | null = null;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['user']) {
        this.username = params['user'];
        this.password = 'password123';
      }
      if (params['role']) {
        this.targetRoleLabel = this.authService.getRoleDisplayName(params['role'] as UserRole);
      }
    });
  }

  fillCredentials(user: string, pass: string, role: UserRole): void {
    this.username = user;
    this.password = pass;
    this.targetRoleLabel = this.authService.getRoleDisplayName(role);
    this.errorMessage = null;
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    this.authService.login({
      username: this.username.trim(),
      password: this.password.trim()
    }).subscribe({
      next: (user) => {
        this.loading = false;
        const targetRoute = this.authService.getDashboardRouteForRole(user.activeRole);
        this.router.navigateByUrl(targetRoute);
      },
      error: (err: ApiErrorResponse) => {
        this.loading = false;
        this.errorMessage = err.message || 'Authentication failed. Please check credentials.';
        this.cdr.markForCheck();
      }
    });
  }
}
