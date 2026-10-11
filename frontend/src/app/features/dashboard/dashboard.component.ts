import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { PolicyService } from '../../core/services/policy.service';
import { ClaimService } from '../../core/services/claim.service';
import { DashboardSummary } from '../../core/models/dashboard.model';
import { Policy } from '../../core/models/policy.model';
import { Claim } from '../../core/models/claim.model';
import { ApiErrorResponse } from '../../core/models/api-error.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="page-header">
        <div>
          <h1>Operations Dashboard</h1>
          <p style="color: var(--text-muted)">Live metrics and operational overview derived from PostgreSQL database.</p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <a routerLink="/customers" class="btn btn-secondary">+ Customer</a>
          <a routerLink="/policies" class="btn btn-secondary">+ Policy</a>
          <a routerLink="/claims" class="btn btn-primary">+ Claim</a>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="alert alert-danger">
        <strong>Error loading dashboard:</strong> {{ error.message }}
        <button class="btn btn-sm btn-secondary" style="margin-left: 1rem;" (click)="loadDashboard()">Retry</button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading database aggregates...</p>
      </div>

      <div *ngIf="!loading && summary">
        <!-- Metrics Grid -->
        <div class="metrics-grid">
          <div class="metric-card primary">
            <div class="label">Total Policies</div>
            <div class="value">{{ summary.totalPolicies }}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
              Issued: {{ summary.activePolicies }} · Draft: {{ summary.draftPolicies }}
            </div>
          </div>

          <div class="metric-card info">
            <div class="label">Gross Premium</div>
            <div class="value">\${{ summary.totalPremium | number:'1.2-2' }}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
              Total written premium
            </div>
          </div>

          <div class="metric-card success">
            <div class="label">Simulated Payments</div>
            <div class="value">\${{ summary.totalPaid | number:'1.2-2' }}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
              Total settled collections
            </div>
          </div>

          <div class="metric-card warning">
            <div class="label">Outstanding Balance</div>
            <div class="value">\${{ summary.totalOutstanding | number:'1.2-2' }}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
              Uncollected balance
            </div>
          </div>

          <div class="metric-card danger">
            <div class="label">Open Claims</div>
            <div class="value">{{ summary.openClaimsCount }}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
              Awaiting review / decision
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem;">
          <!-- Recent Policies -->
          <div class="card">
            <div class="card-title">
              <span>Recent Policies</span>
              <a routerLink="/policies" class="btn btn-sm btn-secondary">View All</a>
            </div>

            <div *ngIf="recentPolicies.length === 0" class="empty-state">
              <p>No policies recorded yet.</p>
            </div>

            <div *ngIf="recentPolicies.length > 0" class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Policy #</th>
                    <th>Customer</th>
                    <th>Premium</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of recentPolicies">
                    <td><strong>{{ p.policyNumber }}</strong></td>
                    <td>{{ p.customerName }}</td>
                    <td>\${{ p.premium | number:'1.2-2' }}</td>
                    <td>
                      <span [ngClass]="'badge badge-' + p.status.toLowerCase()">{{ p.status }}</span>
                    </td>
                    <td>
                      <a [routerLink]="['/policies', p.id]" class="btn btn-sm btn-secondary">Details</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Open Claims -->
          <div class="card">
            <div class="card-title">
              <span>Claims Requiring Action</span>
              <a routerLink="/claims" class="btn btn-sm btn-secondary">View All</a>
            </div>

            <div *ngIf="openClaims.length === 0" class="empty-state">
              <p>No open claims at this time.</p>
            </div>

            <div *ngIf="openClaims.length > 0" class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Claim #</th>
                    <th>Policy #</th>
                    <th>Requested</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let c of openClaims">
                    <td><strong>{{ c.claimNumber }}</strong></td>
                    <td>{{ c.policyNumber }}</td>
                    <td>\${{ c.requestedAmount | number:'1.2-2' }}</td>
                    <td>
                      <span [ngClass]="'badge badge-' + c.status.toLowerCase().replace('_', '-')">{{ c.status }}</span>
                    </td>
                    <td>
                      <a [routerLink]="['/claims', c.id]" class="btn btn-sm btn-primary">Review</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  summary: DashboardSummary | null = null;
  recentPolicies: Policy[] = [];
  openClaims: Claim[] = [];
  loading = true;
  error: ApiErrorResponse | null = null;

  constructor(
    private dashboardService: DashboardService,
    private policyService: PolicyService,
    private claimService: ClaimService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.dashboardService.getSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });

    this.policyService.getPolicies().subscribe({
      next: (policies) => {
        this.recentPolicies = policies.slice(0, 5);
        this.cdr.markForCheck();
      }
    });

    this.claimService.getClaims().subscribe({
      next: (claims) => {
        this.openClaims = claims
          .filter(c => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW' || c.status === 'APPROVED')
          .slice(0, 5);
        this.cdr.markForCheck();
      }
    });
  }
}
