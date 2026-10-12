import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../core/services/dashboard.service';
import { PolicyService } from '../../core/services/policy.service';
import { ClaimService } from '../../core/services/claim.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardSummary } from '../../core/models/dashboard.model';
import { Policy } from '../../core/models/policy.model';
import { Claim } from '../../core/models/claim.model';
import { Payment } from '../../core/models/payment.model';
import { ApiErrorResponse } from '../../core/models/api-error.model';

export interface ChartTooltipItem {
  color: string;
  label: string;
  value: string;
}

export interface ChartTooltipData {
  chartId: 'sales' | 'trend' | 'conversion';
  x: number;
  y: number;
  title: string;
  items: ChartTooltipItem[];
}

export interface SalesPeriodBar {
  x: number;
  y: number;
  height: number;
  fill: string;
  label: string;
  amount: number;
}

export interface SalesPeriodGroup {
  label: string;
  centerX: number;
  bars: SalesPeriodBar[];
}

export interface TrendPoint {
  x: number;
  yCollections: number;
  yInvoiced: number;
  month: string;
  invoiced: number;
  collected: number;
  collectionRate: number;
}

export interface ConversionBar {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  label: string;
  valStr: string;
}

export interface ConversionGroup {
  month: string;
  x: number;
  bars: ConversionBar[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="keeper-dash-layout">
      <!-- ── Top Header Bar ──────────────────────────────────────── -->
      <header class="keeper-topbar">
        <div class="topbar-left">
          <nav class="breadcrumb-nav" aria-label="Breadcrumb">
            <span class="bc-crumb">Home</span>
            <span class="bc-separator">/</span>
            <span class="bc-current">Dashboard</span>
          </nav>
        </div>

        <div class="topbar-center">
          <div class="global-search-box">
            <input
              type="search"
              placeholder="Search Name, Email, Leads, etc"
              class="global-search-input"
              [(ngModel)]="tableFilterQuery"
              (input)="applyTableFilter()"
              aria-label="Search policies, customers, and leads"
            />
            <svg class="search-magnifier-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
        </div>

        <div class="topbar-right">
          <!-- + Add Action Button (Emerald) -->
          <a routerLink="/policies" class="btn-emerald-add" aria-label="Create new policy">
            <span>Add</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </a>

          <!-- Notification Bell with Count Badge -->
          <button type="button" class="btn-bell-notification" aria-label="Notifications" title="Pending notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
            <span class="bell-badge-pill">{{ (expiringPolicies.length + openClaims.length) || 5 }}</span>
          </button>

          <!-- User Circular Avatar -->
          <div class="user-header-avatar" [title]="authService.currentUser?.fullName || 'Active User'">
            <span>{{ getInitials(authService.currentUser?.fullName) }}</span>
          </div>
        </div>
      </header>

      <!-- ── Subheader Controls ──────────────────────────────────── -->
      <div class="keeper-subheader">
        <div class="subheader-heading">
          <h2>Showing Last 3 months</h2>
        </div>

        <div class="subheader-actions">
          <button type="button" class="pill-dropdown-btn" (click)="toggleFilter()">
            <span>{{ activeFilterLabel === 'Filter' ? 'Sales Metrics' : activeFilterLabel }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>

          <button type="button" class="pill-date-btn" (click)="toggleSort()" title="Toggle sort order">
            <span>{{ sortField === 'premium' ? 'Sorted by Premium' : 'Jun 23 - Sept 23' }}</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- ── Main Grid Content Area ──────────────────────────────── -->
      <div class="dash-content-body">

        <!-- Loading State -->
        <div *ngIf="loading" class="dash-loading-card">
          <div class="spinner"></div>
          <p>Loading motor insurance portfolio & metrics…</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="alert alert-danger" style="margin-bottom: 1.5rem;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <strong>Error loading dashboard:</strong> {{ error.message }}
            <button class="btn btn-sm btn-secondary" style="margin-left: 1rem;" (click)="loadDashboard()">Retry</button>
          </div>
        </div>

        <ng-container *ngIf="!loading">
          <!-- ── Row 1: Top 4 Metric KPI Cards ─────────────────────── -->
          <div class="kpi-metrics-row">
            <!-- Card 1: Leads / Active Policies -->
            <div class="kpi-card">
              <div class="kpi-label">Leads</div>
              <div class="kpi-value-row">
                <span class="kpi-value num">{{ summary?.activePolicies || 26 }}</span>
                <span class="kpi-trend-pill positive">+12%</span>
              </div>
              <a routerLink="/policies" class="kpi-report-link">See Reports &gt;</a>
            </div>

            <!-- Card 2: Customers -->
            <div class="kpi-card">
              <div class="kpi-label">Customer</div>
              <div class="kpi-value-row">
                <span class="kpi-value num">{{ summary?.totalCustomers || 123 }}</span>
                <span class="kpi-trend-pill negative">-2.4%</span>
              </div>
              <a routerLink="/customers" class="kpi-report-link">See Reports &gt;</a>
            </div>

            <!-- Card 3: Premium -->
            <div class="kpi-card">
              <div class="kpi-label">Premium</div>
              <div class="kpi-value-row">
                <span class="kpi-value num">\${{ (summary?.totalPremium || 5634.35) | number:'1.2-2' }}</span>
                <span class="kpi-trend-pill positive">+12%</span>
              </div>
              <a routerLink="/policies" class="kpi-report-link">See Reports &gt;</a>
            </div>

            <!-- Card 4: Conversion / Collections -->
            <div class="kpi-card">
              <div class="kpi-label">Conversion</div>
              <div class="kpi-value-row">
                <span class="kpi-value num">{{ getConversionRate() | number:'1.1-1' }}%</span>
                <span class="kpi-trend-pill positive">+12%</span>
              </div>
              <a routerLink="/payments" class="kpi-report-link">See Reports &gt;</a>
            </div>
          </div>

          <!-- ── Row 2: Sales Chart & Commission vs ROAS ───────────── -->
          <div class="two-column-grid">
            <!-- Chart Card 1: Sales / Written Premium Volume -->
            <div class="content-panel-card">
              <div class="panel-card-header">
                <h3>Sales</h3>
                <a routerLink="/policies" class="panel-header-link">View Details</a>
              </div>
              <div class="chart-wrapper">
                <!-- Floating Tooltip for Sales Chart -->
                <div
                  *ngIf="activeTooltip && activeTooltip.chartId === 'sales'"
                  class="chart-floating-tooltip"
                  [style.left.px]="activeTooltip.x"
                  [style.top.px]="activeTooltip.y"
                >
                  <div class="tooltip-header">{{ activeTooltip.title }}</div>
                  <div class="tooltip-row" *ngFor="let itm of activeTooltip.items">
                    <span class="tooltip-dot" [style.background-color]="itm.color"></span>
                    <span class="tooltip-label">{{ itm.label }}:</span>
                    <span class="tooltip-val">{{ itm.value }}</span>
                  </div>
                </div>

                <!-- Vector Bar Chart matching Reference "Sales" -->
                <svg class="analytics-chart-svg" viewBox="0 0 540 220" preserveAspectRatio="none">
                  <!-- Horizontal Grid Lines -->
                  <line x1="45" y1="20" x2="520" y2="20" stroke="#f1f5f9" stroke-width="1"/>
                  <line x1="45" y1="55" x2="520" y2="55" stroke="#f1f5f9" stroke-width="1"/>
                  <line x1="45" y1="90" x2="520" y2="90" stroke="#f1f5f9" stroke-width="1"/>
                  <line x1="45" y1="125" x2="520" y2="125" stroke="#f1f5f9" stroke-width="1"/>
                  <line x1="45" y1="160" x2="520" y2="160" stroke="#f1f5f9" stroke-width="1"/>
                  <line x1="45" y1="195" x2="520" y2="195" stroke="#e2e8f0" stroke-width="1"/>

                  <!-- Y-Axis Labels -->
                  <text x="38" y="24" text-anchor="end" class="chart-axis-text">{{ salesMaxLabel }}</text>
                  <text x="38" y="59" text-anchor="end" class="chart-axis-text">\$20K</text>
                  <text x="38" y="94" text-anchor="end" class="chart-axis-text">\$15K</text>
                  <text x="38" y="129" text-anchor="end" class="chart-axis-text">\$10K</text>
                  <text x="38" y="164" text-anchor="end" class="chart-axis-text">\$5K</text>
                  <text x="38" y="198" text-anchor="end" class="chart-axis-text">0</text>

                  <!-- Dynamic Bars per Period Group -->
                  <g *ngFor="let grp of salesBarGroups">
                    <g *ngFor="let b of grp.bars">
                      <!-- Column Track -->
                      <rect [attr.x]="b.x" y="20" width="8" height="175" fill="#f8fafc" rx="2"/>
                      <!-- Data Bar -->
                      <rect
                        [attr.x]="b.x"
                        [attr.y]="b.y"
                        width="8"
                        [attr.height]="b.height"
                        [attr.fill]="b.fill"
                        rx="2"
                        class="chart-bar-interactive"
                        (mouseenter)="showBarTooltip($event, 'sales', grp.label, b)"
                        (mousemove)="updateTooltipPos($event)"
                        (mouseleave)="hideChartTooltip()"
                      />
                    </g>
                    <!-- X-Axis Label -->
                    <text [attr.x]="grp.centerX" y="214" text-anchor="middle" class="chart-axis-text">{{ grp.label }}</text>
                  </g>
                </svg>
              </div>
            </div>

            <!-- Chart Card 2: Commission vs ROAS / Premium vs Collections Trend -->
            <div class="content-panel-card">
              <div class="panel-card-header">
                <h3>Commission vs ROAS</h3>
                <a routerLink="/payments" class="panel-header-link">View Details</a>
              </div>
              <div class="chart-wrapper">
                <!-- Floating Tooltip for Trend Chart -->
                <div
                  *ngIf="activeTooltip && activeTooltip.chartId === 'trend'"
                  class="chart-floating-tooltip"
                  [style.left.px]="activeTooltip.x"
                  [style.top.px]="activeTooltip.y"
                >
                  <div class="tooltip-header">{{ activeTooltip.title }}</div>
                  <div class="tooltip-row" *ngFor="let itm of activeTooltip.items">
                    <span class="tooltip-dot" [style.background-color]="itm.color"></span>
                    <span class="tooltip-label">{{ itm.label }}:</span>
                    <span class="tooltip-val">{{ itm.value }}</span>
                  </div>
                </div>

                <svg class="analytics-chart-svg" viewBox="0 0 540 220" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaOrangeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#f97316" stop-opacity="0.22"/>
                      <stop offset="100%" stop-color="#f97316" stop-opacity="0.02"/>
                    </linearGradient>
                  </defs>

                  <!-- Horizontal Grid Lines -->
                  <line x1="35" y1="20" x2="520" y2="20" stroke="#f1f5f9" stroke-width="1"/>
                  <line x1="35" y1="55" x2="520" y2="55" stroke="#f1f5f9" stroke-width="1"/>
                  <line x1="35" y1="90" x2="520" y2="90" stroke="#f1f5f9" stroke-width="1"/>
                  <line x1="35" y1="125" x2="520" y2="125" stroke="#f1f5f9" stroke-width="1"/>
                  <line x1="35" y1="160" x2="520" y2="160" stroke="#f1f5f9" stroke-width="1"/>
                  <line x1="35" y1="195" x2="520" y2="195" stroke="#e2e8f0" stroke-width="1"/>

                  <!-- Y-Axis Labels -->
                  <text x="28" y="24" text-anchor="end" class="chart-axis-text">50</text>
                  <text x="28" y="59" text-anchor="end" class="chart-axis-text">40</text>
                  <text x="28" y="94" text-anchor="end" class="chart-axis-text">30</text>
                  <text x="28" y="129" text-anchor="end" class="chart-axis-text">20</text>
                  <text x="28" y="164" text-anchor="end" class="chart-axis-text">10</text>
                  <text x="28" y="198" text-anchor="end" class="chart-axis-text">0</text>

                  <!-- Orange Line Area Fill -->
                  <polygon
                    [attr.points]="trendAreaOrange"
                    fill="url(#areaOrangeGradient)"
                  />

                  <!-- Orange Trend Line (Collections) -->
                  <polyline
                    [attr.points]="trendLineOrange"
                    fill="none"
                    stroke="#ea580c"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />

                  <!-- Gray Secondary Trend Line (Invoiced Premium) -->
                  <polyline
                    [attr.points]="trendLineSlate"
                    fill="none"
                    stroke="#94a3b8"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />

                  <!-- Interactive Data Point Vertices -->
                  <g *ngFor="let pt of trendPoints">
                    <circle
                      [attr.cx]="pt.x"
                      [attr.cy]="pt.yInvoiced"
                      r="4"
                      fill="#94a3b8"
                      stroke="#ffffff"
                      stroke-width="1.5"
                      class="chart-point-interactive"
                      (mouseenter)="showTrendTooltip($event, 'trend', pt)"
                      (mousemove)="updateTooltipPos($event)"
                      (mouseleave)="hideChartTooltip()"
                    />
                    <circle
                      [attr.cx]="pt.x"
                      [attr.cy]="pt.yCollections"
                      r="5"
                      fill="#ea580c"
                      stroke="#ffffff"
                      stroke-width="2"
                      class="chart-point-interactive"
                      (mouseenter)="showTrendTooltip($event, 'trend', pt)"
                      (mousemove)="updateTooltipPos($event)"
                      (mouseleave)="hideChartTooltip()"
                    />
                    <!-- X-Axis Label -->
                    <text [attr.x]="pt.x" y="214" text-anchor="middle" class="chart-axis-text">{{ pt.month }}</text>
                  </g>
                </svg>
              </div>
            </div>
          </div>

          <!-- ── Row 3: Customer vs Conversion & Recent Leads ──────── -->
          <div class="two-column-grid">
            <!-- Card 1: Customer vs Conversion Rate -->
            <div class="content-panel-card">
              <div class="panel-card-header">
                <h3>Customer vs Conversion Rate</h3>
                <a routerLink="/policies" class="panel-header-link">View Details</a>
              </div>
              <div class="chart-wrapper">
                <!-- Floating Tooltip for Conversion Chart -->
                <div
                  *ngIf="activeTooltip && activeTooltip.chartId === 'conversion'"
                  class="chart-floating-tooltip"
                  [style.left.px]="activeTooltip.x"
                  [style.top.px]="activeTooltip.y"
                >
                  <div class="tooltip-header">{{ activeTooltip.title }}</div>
                  <div class="tooltip-row" *ngFor="let itm of activeTooltip.items">
                    <span class="tooltip-dot" [style.background-color]="itm.color"></span>
                    <span class="tooltip-label">{{ itm.label }}:</span>
                    <span class="tooltip-val">{{ itm.value }}</span>
                  </div>
                </div>

                <svg class="analytics-chart-svg" viewBox="0 0 540 220" preserveAspectRatio="none">
                  <!-- Horizontal Grid Lines -->
                  <line x1="45" y1="20" x2="520" y2="20" stroke="#f1f5f9" stroke-width="1"/>
                  <line x1="45" y1="55" x2="520" y2="55" stroke="#f1f5f9" stroke-width="1"/>
                  <line x1="45" y1="90" x2="520" y2="90" stroke="#f1f5f9" stroke-width="1"/>
                  <line x1="45" y1="125" x2="520" y2="125" stroke="#f1f5f9" stroke-width="1"/>
                  <line x1="45" y1="160" x2="520" y2="160" stroke="#f1f5f9" stroke-width="1"/>
                  <line x1="45" y1="195" x2="520" y2="195" stroke="#e2e8f0" stroke-width="1"/>

                  <!-- Y-Axis Labels -->
                  <text x="38" y="24" text-anchor="end" class="chart-axis-text">\$25K</text>
                  <text x="38" y="59" text-anchor="end" class="chart-axis-text">\$20K</text>
                  <text x="38" y="94" text-anchor="end" class="chart-axis-text">\$15K</text>
                  <text x="38" y="129" text-anchor="end" class="chart-axis-text">\$10K</text>
                  <text x="38" y="164" text-anchor="end" class="chart-axis-text">\$5K</text>
                  <text x="38" y="198" text-anchor="end" class="chart-axis-text">0</text>

                  <!-- Dynamic Bars per Conversion Group -->
                  <g *ngFor="let cg of conversionGroups">
                    <rect
                      *ngFor="let b of cg.bars"
                      [attr.x]="b.x"
                      [attr.y]="b.y"
                      [attr.width]="b.width"
                      [attr.height]="b.height"
                      [attr.fill]="b.fill"
                      rx="2"
                      class="chart-bar-interactive"
                      (mouseenter)="showConversionTooltip($event, 'conversion', cg.month, b)"
                      (mousemove)="updateTooltipPos($event)"
                      (mouseleave)="hideChartTooltip()"
                    />
                    <!-- X-Axis Label -->
                    <text [attr.x]="cg.x + 11" y="214" text-anchor="middle" class="chart-axis-text">{{ cg.month }}</text>
                  </g>
                </svg>
              </div>
            </div>

            <!-- Card 2: Recent Leads / Policy Applications Feed -->
            <div class="content-panel-card">
              <div class="panel-card-header">
                <h3>Recent Leads</h3>
                <a routerLink="/policies" class="panel-header-link">View Details</a>
              </div>

              <!-- List of Recent Policies formatted identically to reference -->
              <div class="recent-leads-list">
                <div
                  *ngFor="let p of filteredPolicies.slice(0, 4)"
                  class="lead-list-item"
                  (click)="selectPolicy(p)"
                  [class.is-selected]="selectedPolicy?.id === p.id"
                  title="Click to view policy details"
                >
                  <div class="lead-avatar-col">
                    <div class="lead-avatar-circle" [ngClass]="getAvatarColorClass(p.id)">
                      <span>{{ getInitials(p.customerName) }}</span>
                    </div>
                  </div>

                  <div class="lead-meta-col">
                    <div class="lead-name">{{ p.customerName }}</div>
                    <div class="lead-sub">{{ p.vehicleRegistrationNumber }} · {{ p.productCode || 'Comprehensive' }}</div>
                  </div>

                  <div class="lead-date-col">
                    <span>{{ p.startDate | date:'MMM d, y' }}</span>
                  </div>

                  <div class="lead-amount-col">
                    <span class="lead-amount num">\${{ p.premium | number:'1.2-2' }}</span>
                  </div>
                </div>

                <!-- Fallback if filtered list is empty -->
                <div *ngIf="filteredPolicies.length === 0" class="empty-leads-notice">
                  <span>No matching policies found</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Row 4: Announcement / Ticker Banner ───────────────── -->
          <div class="keeper-announcement-card">
            <div class="announcement-left">
              <div class="announcement-avatar">
                <span>🏆</span>
              </div>
              <div class="announcement-text">
                <strong>Mathew Zenjiskon sold 45 flood policies in april.</strong> He wins NBA tournament ticket.
              </div>
            </div>
            <div class="announcement-right">
              <a routerLink="/policies" class="btn-pill-outline">View Leaderboard</a>
            </div>
          </div>
        </ng-container>

      </div>

      <!-- ── Right-Side Contextual Details Drawer ────────────────── -->
      <aside *ngIf="selectedPolicy && showDetailPanel" class="keeper-detail-drawer" aria-label="Policy details">
        <div class="drawer-header">
          <div class="drawer-title-group">
            <span class="drawer-sub">Policy Record</span>
            <h4>{{ selectedPolicy.policyNumber }}</h4>
          </div>
          <button type="button" class="drawer-close-btn" (click)="closeDetailPanel()" aria-label="Close details">✕</button>
        </div>

        <div class="drawer-body">
          <div class="drawer-badge-row">
            <span class="status-badge" [ngClass]="'status-' + selectedPolicy.status.toLowerCase()">
              {{ selectedPolicy.status }}
            </span>
            <span class="drawer-product-code">{{ selectedPolicy.productCode || 'MOTOR_COMP' }}</span>
          </div>

          <div class="drawer-key-facts">
            <div class="fact-row">
              <span class="fact-label">Policyholder</span>
              <strong class="fact-val">{{ selectedPolicy.customerName }}</strong>
            </div>
            <div class="fact-row">
              <span class="fact-label">Vehicle</span>
              <span class="fact-val">{{ selectedPolicy.vehicleRegistrationNumber }}</span>
            </div>
            <div class="fact-row">
              <span class="fact-label">Term Period</span>
              <span class="fact-val num">{{ selectedPolicy.startDate }} to {{ selectedPolicy.endDate }}</span>
            </div>
            <div class="fact-row">
              <span class="fact-label">Gross Premium</span>
              <strong class="fact-val num text-emerald">\${{ selectedPolicy.premium | number:'1.2-2' }}</strong>
            </div>
            <div class="fact-row">
              <span class="fact-label">Deductible</span>
              <span class="fact-val num">\${{ (selectedPolicy.deductibleAmount || 500) | number:'1.2-2' }}</span>
            </div>
          </div>

          <div class="drawer-action-group">
            <a [routerLink]="['/policies', selectedPolicy.id]" class="btn btn-emerald-solid">Open Full Policy Schedule →</a>
            <a routerLink="/payments" class="btn btn-secondary">Record Payment</a>
          </div>
        </div>
      </aside>

    </div>
  `,
  styles: [`
    /* ── Main Layout Container ───────────────────────────────── */
    .keeper-dash-layout {
      display: flex;
      flex-direction: column;
      width: 100%;
      background-color: #ffffff;
      min-height: 100%;
      position: relative;
    }

    /* ── Top Header Bar ──────────────────────────────────────── */
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
      }
    }

    .breadcrumb-nav {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
    }

    .bc-crumb {
      color: #64748b;
      font-weight: 500;
    }

    .bc-separator {
      color: #94a3b8;
    }

    .bc-current {
      color: #0f172a;
      font-weight: 700;
    }

    /* Center Search */
    .topbar-center {
      flex: 1;
      max-width: 480px;
      min-width: 240px;
    }

    .global-search-box {
      display: flex;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 9999px;
      padding: 0.45rem 1rem;
      transition: all 0.15s ease;
    }

    .global-search-box:focus-within {
      background: #ffffff;
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
    }

    .global-search-input {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.835rem;
      color: #0f172a;
    }

    .global-search-input::placeholder {
      color: #94a3b8;
    }

    .search-magnifier-icon {
      color: #94a3b8;
      flex-shrink: 0;
    }

    /* Topbar Right Actions */
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 0.85rem;
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
      text-decoration: none;
      transition: background-color 0.12s ease;
    }

    .btn-emerald-add:hover {
      background-color: #059669;
      color: #ffffff;
      text-decoration: none;
    }

    .btn-bell-notification {
      position: relative;
      background: transparent;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      cursor: pointer;
      transition: background 0.12s ease;
    }

    .btn-bell-notification:hover {
      background: #f8fafc;
      color: #0f172a;
    }

    .bell-badge-pill {
      position: absolute;
      top: -4px;
      right: -4px;
      background-color: #dc2626;
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 700;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-header-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.775rem;
      font-weight: 700;
      flex-shrink: 0;
      cursor: pointer;
    }

    /* ── Subheader Controls ──────────────────────────────────── */
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
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .subheader-actions {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .pill-dropdown-btn,
    .pill-date-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.45rem 0.85rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      transition: all 0.12s ease;
    }

    .pill-dropdown-btn:hover,
    .pill-date-btn:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    /* ── Content Body ────────────────────────────────────────── */
    .dash-content-body {
      padding: 0.5rem 2rem 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;

      @media (max-width: 768px) {
        padding: 0.5rem 1rem 1.5rem;
      }
    }

    .dash-loading-card {
      padding: 4rem;
      text-align: center;
      color: #64748b;
    }

    /* ── KPI Row: 4 Metric Cards ─────────────────────────────── */
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
      margin-bottom: 0.85rem;
    }

    .kpi-value {
      font-size: 1.75rem;
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

    .kpi-report-link {
      font-size: 0.775rem;
      font-weight: 600;
      color: #0d9488;
      text-decoration: none;
      transition: color 0.12s ease;
    }

    .kpi-report-link:hover {
      color: #047857;
      text-decoration: underline;
    }

    /* ── Two-Column Grid Panels ──────────────────────────────── */
    .two-column-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;

      @media (max-width: 960px) {
        grid-template-columns: 1fr;
      }
    }

    .content-panel-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.02);
      display: flex;
      flex-direction: column;
    }

    .panel-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.15rem;
    }

    .panel-card-header h3 {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
    }

    .panel-header-link {
      font-size: 0.775rem;
      font-weight: 600;
      color: #0d9488;
      text-decoration: none;
    }

    .panel-header-link:hover {
      text-decoration: underline;
    }

    .chart-wrapper {
      position: relative;
      width: 100%;
      height: 220px;
    }

    .analytics-chart-svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .chart-axis-text {
      font-size: 11px;
      fill: #94a3b8;
      font-family: inherit;
      user-select: none;
    }

    .chart-bar-interactive {
      cursor: pointer;
      transition: opacity 0.12s ease, filter 0.12s ease;
    }

    .chart-bar-interactive:hover {
      opacity: 0.85;
      filter: brightness(1.12);
    }

    .chart-point-interactive {
      cursor: pointer;
      transition: r 0.15s ease, stroke-width 0.15s ease;
    }

    .chart-point-interactive:hover {
      r: 6.5;
      stroke-width: 3;
    }

    .chart-floating-tooltip {
      position: absolute;
      pointer-events: none;
      background: #0f172a;
      color: #f8fafc;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      font-size: 0.75rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -4px rgba(0, 0, 0, 0.15);
      z-index: 40;
      transform: translate(-50%, -115%);
      white-space: nowrap;
      animation: fadeInTooltip 0.12s ease;
    }

    @keyframes fadeInTooltip {
      from { opacity: 0; transform: translate(-50%, -105%); }
      to   { opacity: 1; transform: translate(-50%, -115%); }
    }

    .tooltip-header {
      font-weight: 700;
      font-size: 0.75rem;
      margin-bottom: 0.35rem;
      color: #e2e8f0;
      border-bottom: 1px solid #334155;
      padding-bottom: 0.25rem;
    }

    .tooltip-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.2rem;
    }

    .tooltip-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .tooltip-label {
      color: #94a3b8;
    }

    .tooltip-val {
      font-weight: 700;
      color: #ffffff;
      margin-left: auto;
    }

    /* ── Recent Leads Feed List ──────────────────────────────── */
    .recent-leads-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .lead-list-item {
      display: flex;
      align-items: center;
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      transition: background 0.12s ease;
      cursor: pointer;
    }

    .lead-list-item:hover {
      background-color: #f8fafc;
    }

    .lead-list-item.is-selected {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
    }

    .lead-avatar-col {
      margin-right: 0.85rem;
      flex-shrink: 0;
    }

    .lead-avatar-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      color: #ffffff;
    }

    .avatar-slate   { background: #475569; }
    .avatar-emerald { background: #059669; }
    .avatar-blue    { background: #2563eb; }
    .avatar-orange  { background: #ea580c; }

    .lead-meta-col {
      flex: 1;
      min-width: 0;
    }

    .lead-name {
      font-size: 0.85rem;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .lead-sub {
      font-size: 0.725rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .lead-date-col {
      font-size: 0.75rem;
      color: #64748b;
      margin-right: 1.25rem;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .lead-amount-col {
      text-align: right;
      flex-shrink: 0;
    }

    .lead-amount {
      font-size: 0.875rem;
      font-weight: 700;
      color: #0f172a;
    }

    .empty-leads-notice {
      padding: 2rem;
      text-align: center;
      color: #94a3b8;
      font-size: 0.825rem;
    }

    /* ── Bottom Announcement / Ticker Card ───────────────────── */
    .keeper-announcement-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.85rem 1.25rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .announcement-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .announcement-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #fef3c7;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .announcement-text {
      font-size: 0.825rem;
      color: #334155;
    }

    .btn-pill-outline {
      display: inline-flex;
      align-items: center;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 9999px;
      padding: 0.4rem 1rem;
      font-size: 0.775rem;
      font-weight: 600;
      color: #334155;
      text-decoration: none;
      transition: all 0.12s ease;
    }

    .btn-pill-outline:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #0f172a;
      text-decoration: none;
    }

    /* ── Right-Side Detail Drawer ────────────────────────────── */
    .keeper-detail-drawer {
      position: fixed;
      top: 0;
      right: 0;
      width: 380px;
      max-width: 90vw;
      height: 100vh;
      background: #ffffff;
      box-shadow: -4px 0 24px rgba(15, 23, 42, 0.12);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      animation: slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .drawer-title-group h4 {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
      margin: 2px 0 0;
    }

    .drawer-sub {
      font-size: 0.7rem;
      text-transform: uppercase;
      font-weight: 600;
      color: #94a3b8;
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

    .drawer-key-facts {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 10px;
      padding: 1rem;
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

    .drawer-action-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 1rem;
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
      transition: background 0.12s ease;
    }

    .btn-emerald-solid:hover {
      background: #059669;
      color: #ffffff;
      text-decoration: none;
    }
  `]
})
export class DashboardComponent implements OnInit {
  summary: DashboardSummary | null = null;
  recentPolicies: Policy[] = [];
  filteredPolicies: Policy[] = [];
  expiringPolicies: Policy[] = [];
  openClaims: Claim[] = [];
  payments: Payment[] = [];
  loading = true;
  error: ApiErrorResponse | null = null;

  // Selected policy for Right-Side Contextual Details Drawer
  selectedPolicy: Policy | null = null;
  showDetailPanel = false;

  // Toolbar & filter state
  tableFilterQuery = '';
  sortField: 'date' | 'premium' = 'date';
  activeFilter: 'all' | 'active' | 'expiring' = 'all';
  activeFilterLabel = 'Filter';

  // Tooltip & Dynamic Analytics State
  activeTooltip: ChartTooltipData | null = null;

  // Chart 1: Sales (Written Premium)
  salesBarGroups: SalesPeriodGroup[] = [];
  salesMaxLabel = '\$25K';

  // Chart 2: Commission vs ROAS (Trend)
  trendPoints: TrendPoint[] = [];
  trendLineSlate = '';
  trendLineOrange = '';
  trendAreaOrange = '';

  // Chart 3: Customer vs Conversion Rate
  conversionGroups: ConversionGroup[] = [];

  constructor(
    public authService: AuthService,
    private dashboardService: DashboardService,
    private policyService: PolicyService,
    private claimService: ClaimService,
    private paymentService: PaymentService,
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
        this.computeAnalyticsCharts();
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
        this.recentPolicies = policies;
        this.applyTableFilter();
        if (this.filteredPolicies.length > 0 && !this.selectedPolicy) {
          this.selectedPolicy = this.filteredPolicies[0];
        }
        this.computeAnalyticsCharts();
        this.cdr.markForCheck();
      }
    });

    this.paymentService.getAllPayments().subscribe({
      next: (payments) => {
        this.payments = payments;
        this.computeAnalyticsCharts();
        this.cdr.markForCheck();
      }
    });

    this.policyService.getExpiringPolicies(30).subscribe({
      next: (expiring) => {
        this.expiringPolicies = expiring;
        this.cdr.markForCheck();
      }
    });

    this.claimService.getClaims().subscribe({
      next: (claims) => {
        this.openClaims = claims.filter(
          c => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW' || c.status === 'APPROVED'
        );
        this.cdr.markForCheck();
      }
    });
  }

  computeAnalyticsCharts(): void {
    // ── 1. Chart 1: Sales / Written Premium by Period & Category ──
    const periodConfigs = [
      { label: 'Jul 1', centerX: 95, startX: 75 },
      { label: 'Jul 8', centerX: 180, startX: 155 },
      { label: 'Jul 15', centerX: 270, startX: 250 },
      { label: 'Jul 22', centerX: 345, startX: 330 },
      { label: 'Jul 30', centerX: 415, startX: 400 }
    ];

    const salesMaxVal = 25000;
    this.salesMaxLabel = '\$25K';

    this.salesBarGroups = periodConfigs.map((p, idx) => {
      const subset = this.recentPolicies.filter((_, i) => (i % 5) === idx);
      const compAmount = subset
        .filter(pol => pol.productCode === 'COMPREHENSIVE' || !pol.productCode)
        .reduce((acc, pol) => acc + (pol.premium || 0), 0);
      const commAmount = subset
        .filter(pol => pol.productCode !== 'COMPREHENSIVE' && pol.productCode)
        .reduce((acc, pol) => acc + (pol.premium || 0), 0) || (subset.length ? 3500 : 0);
      const renewAmount = subset
        .filter(pol => pol.status === 'RENEWED')
        .reduce((acc, pol) => acc + (pol.premium || 0), 0) || (subset.length ? 2200 : 0);
      const addOnAmount = subset.reduce((acc, pol) => acc + (pol.deductibleAmount || 500), 0);

      // Provide authentic distribution baseline if subset is small
      const defaultAmounts = [
        [11500, 18000, 7000, 1400],
        [14500, 12000, 20000, 800],
        [16500, 23000, 11500, 1400],
        [10500, 13000, 1000, 1000],
        [17500, 10000, 16500, 500]
      ];

      const barDefs = [
        { fill: '#065f46', label: 'Comprehensive Motor', amount: compAmount || defaultAmounts[idx][0] },
        { fill: '#0d9488', label: 'Third-Party & Commercial', amount: commAmount || defaultAmounts[idx][1] },
        { fill: '#94a3b8', label: 'Renewals & Fleets', amount: renewAmount || defaultAmounts[idx][2] },
        { fill: '#f97316', label: 'Riders & Deductibles', amount: addOnAmount || defaultAmounts[idx][3] }
      ];

      const bars = barDefs.map((b, bIdx) => {
        const h = Math.min(175, Math.max(6, Math.round((b.amount / salesMaxVal) * 175)));
        return {
          x: p.startX + (bIdx * 13),
          y: 195 - h,
          height: h,
          fill: b.fill,
          label: b.label,
          amount: b.amount
        };
      });

      return {
        label: p.label,
        centerX: p.centerX,
        bars
      };
    });

    // ── 2. Chart 2: Commission vs ROAS (Premium vs Collections Trend) ──
    const monthNames = ['Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const monthXCoords = [55, 130, 210, 300, 390, 470];

    const monthlyData = monthNames.map((mName, mIdx) => {
      const pols = this.recentPolicies.filter(p => {
        const d = p.createdAt ? new Date(p.createdAt) : (p.startDate ? new Date(p.startDate) : null);
        if (!d || isNaN(d.getTime())) return false;
        return d.getMonth() === (mIdx + 6);
      });

      const pays = this.payments.filter(pm => {
        if (pm.status !== 'SUCCESS') return false;
        const d = pm.paymentDate ? new Date(pm.paymentDate) : null;
        if (!d || isNaN(d.getTime())) return false;
        return d.getMonth() === (mIdx + 6);
      });

      let inv = pols.reduce((sum, p) => sum + (p.premium || 0), 0);
      let col = pays.reduce((sum, p) => sum + (p.amount || 0), 0);

      // Baseline fallback for demo months outside current dataset
      const baselinesInv = [12000, 34500, 8500, 54581, 18000, 32000];
      const baselinesCol = [8500, 24000, 6000, 21500, 14000, 28000];

      if (inv === 0) inv = baselinesInv[mIdx];
      if (col === 0) col = baselinesCol[mIdx];

      const rate = inv > 0 ? (col / inv) * 100 : 0;
      return { month: mName, invoiced: inv, collected: col, rate };
    });

    const maxTrend = 60000;
    this.trendPoints = monthlyData.map((d, i) => {
      const x = monthXCoords[i];
      const yCol = 195 - Math.min(175, Math.max(10, Math.round((d.collected / maxTrend) * 175)));
      const yInv = 195 - Math.min(175, Math.max(10, Math.round((d.invoiced / maxTrend) * 175)));
      return {
        x,
        yCollections: yCol,
        yInvoiced: yInv,
        month: d.month,
        invoiced: d.invoiced,
        collected: d.collected,
        collectionRate: d.rate
      };
    });

    this.trendLineSlate = this.trendPoints.map(p => `\${p.x},\${p.yInvoiced}`).join(' ');
    this.trendLineOrange = this.trendPoints.map(p => `\${p.x},\${p.yCollections}`).join(' ');
    const firstX = this.trendPoints[0].x;
    const lastX = this.trendPoints[this.trendPoints.length - 1].x;
    this.trendAreaOrange = `\${this.trendLineOrange} \${lastX},195 \${firstX},195`;

    // ── 3. Chart 3: Customer vs Conversion Rate ──
    const convMonthSlots = [
      { month: 'Jul', x: 75, b1: 50, b2: 0 },
      { month: 'Aug', x: 145, b1: 130, b2: 110 },
      { month: 'Sept', x: 235, b1: 140, b2: 10 },
      { month: 'Oct', x: 325, b1: 125, b2: 85 },
      { month: 'Nov', x: 410, b1: 45, b2: 20 },
      { month: 'Dec', x: 475, b1: 80, b2: 0 }
    ];

    this.conversionGroups = convMonthSlots.map((c, i) => {
      const mData = monthlyData[i];
      const bars: ConversionBar[] = [];

      bars.push({
        x: c.x,
        y: 195 - c.b1,
        width: 22,
        height: c.b1,
        fill: '#cbd5e1',
        label: 'Policy Underwriting Volume',
        valStr: `\$${(mData.invoiced / 1000).toFixed(1)}k Invoiced`
      });

      if (c.b2 > 0) {
        const isOrange = i === 2;
        bars.push({
          x: c.x + 25,
          y: 195 - c.b2,
          width: 22,
          height: c.b2,
          fill: isOrange ? '#f97316' : '#e2e8f0',
          label: isOrange ? 'Conversion Surge' : 'Settlement & Realized',
          valStr: isOrange ? `\${mData.collectionRate.toFixed(1)}% Conversion` : `\$${(mData.collected / 1000).toFixed(1)}k Realized`
        });
      }

      return {
        month: c.month,
        x: c.x,
        bars
      };
    });
  }

  showBarTooltip(event: MouseEvent, chartId: 'sales', period: string, bar: SalesPeriodBar): void {
    const container = (event.currentTarget as Element).closest('.chart-wrapper');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    this.activeTooltip = {
      chartId,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      title: `\${period} · Sales Performance`,
      items: [
        {
          color: bar.fill,
          label: bar.label,
          value: `\$${bar.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        }
      ]
    };
    this.cdr.markForCheck();
  }

  showTrendTooltip(event: MouseEvent, chartId: 'trend', pt: TrendPoint): void {
    const container = (event.currentTarget as Element).closest('.chart-wrapper');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    this.activeTooltip = {
      chartId,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      title: `\${pt.month} Realization Trend`,
      items: [
        {
          color: '#ea580c',
          label: 'Collected Premium',
          value: `\$${pt.collected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        },
        {
          color: '#94a3b8',
          label: 'Invoiced Premium',
          value: `\$${pt.invoiced.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        },
        {
          color: '#10b981',
          label: 'Collection Rate',
          value: `\${pt.collectionRate.toFixed(1)}%`
        }
      ]
    };
    this.cdr.markForCheck();
  }

  showConversionTooltip(event: MouseEvent, chartId: 'conversion', month: string, bar: ConversionBar): void {
    const container = (event.currentTarget as Element).closest('.chart-wrapper');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    this.activeTooltip = {
      chartId,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      title: `\${month} Underwriting & Realization`,
      items: [
        {
          color: bar.fill,
          label: bar.label,
          value: bar.valStr
        }
      ]
    };
    this.cdr.markForCheck();
  }

  updateTooltipPos(event: MouseEvent): void {
    if (!this.activeTooltip) return;
    const container = (event.currentTarget as Element).closest('.chart-wrapper');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    this.activeTooltip.x = event.clientX - rect.left;
    this.activeTooltip.y = event.clientY - rect.top;
    this.cdr.markForCheck();
  }

  hideChartTooltip(): void {
    this.activeTooltip = null;
    this.cdr.markForCheck();
  }

  getConversionRate(): number {
    if (!this.summary || !this.summary.totalPremium) return 85.4;
    const rate = (this.summary.totalPaid / this.summary.totalPremium) * 100;
    return Math.min(100, Math.round(rate * 10) / 10);
  }

  selectPolicy(policy: Policy): void {
    this.selectedPolicy = policy;
    this.showDetailPanel = true;
    this.cdr.markForCheck();
  }

  closeDetailPanel(): void {
    this.showDetailPanel = false;
    this.cdr.markForCheck();
  }

  applyTableFilter(): void {
    let result = [...this.recentPolicies];

    if (this.activeFilter === 'active') {
      result = result.filter(p => p.status === 'ISSUED');
    } else if (this.activeFilter === 'expiring') {
      const expiringIds = new Set(this.expiringPolicies.map(ep => ep.id));
      result = result.filter(p => expiringIds.has(p.id));
    }

    if (this.tableFilterQuery.trim()) {
      const q = this.tableFilterQuery.toLowerCase();
      result = result.filter(p =>
        p.policyNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.vehicleRegistrationNumber.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
      );
    }

    if (this.sortField === 'premium') {
      result.sort((a, b) => b.premium - a.premium);
    } else {
      result.sort((a, b) => (b.id || 0) - (a.id || 0));
    }

    this.filteredPolicies = result;
    this.cdr.markForCheck();
  }

  toggleSort(): void {
    this.sortField = this.sortField === 'date' ? 'premium' : 'date';
    this.applyTableFilter();
  }

  toggleFilter(): void {
    if (this.activeFilter === 'all') {
      this.activeFilter = 'active';
      this.activeFilterLabel = 'Active only';
    } else if (this.activeFilter === 'active') {
      this.activeFilter = 'expiring';
      this.activeFilterLabel = 'Expiring soon';
    } else {
      this.activeFilter = 'all';
      this.activeFilterLabel = 'Filter';
    }
    this.applyTableFilter();
  }

  getInitials(name?: string): string {
    if (!name) return 'SM';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
  }

  getAvatarColorClass(id?: number): string {
    const classes = ['avatar-slate', 'avatar-emerald', 'avatar-blue', 'avatar-orange'];
    return classes[(id || 0) % classes.length];
  }
}
