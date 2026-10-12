import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ActorProfile } from '../../core/models/auth.model';

@Component({
  selector: 'app-actor-selection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="actors-page">
      <!-- Page header -->
      <header class="actors-header">
        <div class="actors-brand">
          <div class="actors-brand-mark" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 4.5L18.5 7.5V12C18.5 16.5 15.5 19.5 12 21C8.5 19.5 5.5 16.5 5.5 12V7.5L12 4.5Z" fill="#4f46e5" stroke="#4f46e5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9.5 12L11 13.5L14.5 10" stroke="#ffffff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="actors-brand-name">SafeMotor</span>
        </div>
        <h1 class="actors-title">Motor Insurance Portal</h1>
        <p class="actors-subtitle">
          Select your role to access role-specific workflows, dashboards, and operational tools.
        </p>
      </header>

      <!-- Actor cards grid -->
      <div class="actors-grid" role="list">
        <div
          *ngFor="let actor of actors"
          class="actor-card"
          role="listitem"
          tabindex="0"
          (click)="selectActor(actor)"
          (keydown.enter)="selectActor(actor)"
          (keydown.space)="selectActor(actor)"
          [attr.aria-label]="'Sign in as ' + actor.title"
        >
          <!-- Card top row -->
          <div class="actor-card-top">
            <div class="actor-icon" [ngClass]="'icon-' + actor.badge.toLowerCase().replace(' ', '-').replace('/', '-')" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path [attr.d]="actor.iconSvgPath" />
              </svg>
            </div>
            <span class="actor-tag">{{ actor.badge }}</span>
          </div>

          <!-- Card content -->
          <div class="actor-content">
            <h2 class="actor-role-title">{{ actor.title }}</h2>
            <p class="actor-description">{{ actor.description }}</p>
          </div>

          <!-- Persona chip -->
          <div class="actor-persona" aria-hidden="true">
            <div class="persona-avatar">{{ getInitials(actor.personaName) }}</div>
            <div class="persona-text">
              <div class="persona-name">{{ actor.personaName }}</div>
              <div class="persona-job">{{ actor.personaTitle }}</div>
            </div>
          </div>

          <!-- CTA -->
          <div class="actor-cta">
            <span class="actor-cta-text">Continue as {{ actor.shortRole }}</span>
            <svg class="actor-cta-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Footer note -->
      <p class="actors-footnote">
        This is a demonstration system with synthetic data only. No real personal or financial information is used.
      </p>
    </div>
  `,
  styles: [`
    .actors-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 3rem 2rem 2rem;

      @media (max-width: 768px) {
        padding: 2rem 1rem;
      }
    }

    /* ── Header ──────────────────────────────────────────── */
    .actors-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .actors-brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 1.25rem;
    }

    .actors-brand-mark {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #eef2ff;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .actors-brand-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.025em;
    }

    .actors-title {
      font-size: 1.875rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
      margin-bottom: 0.6rem;
      line-height: 1.2;
    }

    .actors-subtitle {
      font-size: 0.9375rem;
      color: #64748b;
      max-width: 500px;
      margin: 0 auto;
      line-height: 1.6;
    }

    /* ── Grid ────────────────────────────────────────────── */
    .actors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }

    /* ── Actor card ──────────────────────────────────────── */
    .actor-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.375rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      cursor: pointer;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
      position: relative;
      outline: none;
    }

    .actor-card:hover {
      border-color: #a5b4fc;
      box-shadow: 0 8px 24px -4px rgba(79, 70, 229, 0.1), 0 2px 8px -2px rgba(79, 70, 229, 0.06);
      transform: translateY(-2px);
    }

    .actor-card:focus-visible {
      outline: 2px solid #4f46e5;
      outline-offset: 2px;
      border-color: #6366f1;
    }

    /* ── Card top row ──────────────────────────────────── */
    .actor-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .actor-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-policyholder  { background: #eef2ff; color: #4f46e5; }
    .icon-underwriting  { background: #fdf4ff; color: #9333ea; }
    .icon-claims        { background: #eff6ff; color: #2563eb; }
    .icon-finance       { background: #ecfdf5; color: #059669; }
    .icon-agency        { background: #fff7ed; color: #ea580c; }
    .icon-administration { background: #f1f5f9; color: #334155; }

    .actor-tag {
      font-size: 0.725rem;
      font-weight: 600;
      color: #64748b;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 3px 8px;
      border-radius: 6px;
      letter-spacing: 0.01em;
    }

    /* ── Card content ──────────────────────────────────── */
    .actor-content {
      flex: 1;
    }

    .actor-role-title {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.35rem;
      letter-spacing: -0.01em;
    }

    .actor-description {
      font-size: 0.8125rem;
      color: #64748b;
      line-height: 1.55;
      margin: 0;
    }

    /* ── Persona chip ──────────────────────────────────── */
    .actor-persona {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      background: #f8fafc;
      border-radius: 9px;
      border: 1px solid #f1f5f9;
    }

    .persona-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #4f46e5;
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .persona-text {
      flex: 1;
      min-width: 0;
    }

    .persona-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .persona-job {
      font-size: 0.7rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── CTA row ───────────────────────────────────────── */
    .actor-cta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
    }

    .actor-cta-text {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #4f46e5;
    }

    .actor-cta-arrow {
      color: #a5b4fc;
      transition: transform 0.12s ease, color 0.12s ease;
    }

    .actor-card:hover .actor-cta-arrow {
      transform: translateX(3px);
      color: #4f46e5;
    }

    /* ── Footnote ──────────────────────────────────────── */
    .actors-footnote {
      text-align: center;
      font-size: 0.775rem;
      color: #94a3b8;
      line-height: 1.5;
      max-width: 560px;
      margin: 0 auto;
    }
  `]
})
export class ActorSelectionComponent {
  actors: ActorProfile[] = [
    {
      id: 'ROLE_CUSTOMER',
      title: 'Policyholder / Customer',
      shortRole: 'Policyholder',
      badge: 'Policyholder',
      description: 'Access active vehicle coverages, track policy schedules, review receipts, and file First Notice of Loss claims.',
      defaultUsername: 'abebe.customer',
      defaultPassword: 'password123',
      personaName: 'Abebe Bikila',
      personaTitle: 'Private Fleet Owner',
      iconSvgPath: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
      primaryDashboardUrl: '/dashboards/customer'
    },
    {
      id: 'ROLE_UNDERWRITER',
      title: 'Underwriter & Portfolio Lead',
      shortRole: 'Underwriter',
      badge: 'Underwriting',
      description: 'Assess risk profiles, verify motor premium calculations, issue policies, process endorsements, and manage renewals.',
      defaultUsername: 'alexander.uw',
      defaultPassword: 'password123',
      personaName: 'Alexander Reed',
      personaTitle: 'Underwriting Lead',
      iconSvgPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
      primaryDashboardUrl: '/dashboards/underwriter'
    },
    {
      id: 'ROLE_CLAIMS_OFFICER',
      title: 'Claims Officer / Adjuster',
      shortRole: 'Claims Officer',
      badge: 'Claims',
      description: 'Review First Notice of Loss filings, evaluate incident liability, determine approved payouts, and issue settlements.',
      defaultUsername: 'sarah.claims',
      defaultPassword: 'password123',
      personaName: 'Sarah Chen',
      personaTitle: 'Senior Claims Adjuster',
      iconSvgPath: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M9 14l2 2 4-4',
      primaryDashboardUrl: '/dashboards/claims'
    },
    {
      id: 'ROLE_FINANCE_OFFICER',
      title: 'Finance & Billing Officer',
      shortRole: 'Finance Officer',
      badge: 'Finance',
      description: 'Track premium billing schedules, record payments, manage collections ledger, generate receipts, and review void audits.',
      defaultUsername: 'marcus.finance',
      defaultPassword: 'password123',
      personaName: 'Marcus Vance',
      personaTitle: 'Billing & Ledger Lead',
      iconSvgPath: 'M2 5h20v14H2z M2 10h20',
      primaryDashboardUrl: '/dashboards/finance'
    },
    {
      id: 'ROLE_AGENT',
      title: 'Insurance Agent / Broker',
      shortRole: 'Agent',
      badge: 'Agency',
      description: 'Onboard new policyholders, register customer vehicles, prepare rating quotes, and assist in policy applications.',
      defaultUsername: 'david.agent',
      defaultPassword: 'password123',
      personaName: 'David Kim',
      personaTitle: 'Certified Insurance Broker',
      iconSvgPath: 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2',
      primaryDashboardUrl: '/dashboards/agent'
    },
    {
      id: 'ROLE_ADMIN',
      title: 'Operations Director / Admin',
      shortRole: 'Administrator',
      badge: 'Administration',
      description: 'Multi-role operational oversight, tariff configuration, user role management, system health, and cross-team audits.',
      defaultUsername: 'elena.manager',
      defaultPassword: 'password123',
      personaName: 'Elena Rostova',
      personaTitle: 'Head of Operations',
      iconSvgPath: 'M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
      primaryDashboardUrl: '/dashboards/admin'
    }
  ];

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Arriving at the Actor Directory resets any active session so the user chooses fresh
    if (this.authService.isAuthenticated()) {
      this.authService.logout(false);
    }
  }

  selectActor(actor: ActorProfile): void {
    this.authService.logout(false);
    this.router.navigate(['/login'], {
      queryParams: {
        role: actor.id,
        user: actor.defaultUsername
      }
    });
  }

  getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
  }
}
