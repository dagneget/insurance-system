import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

// Auth & Actor components
import { ActorSelectionComponent } from './features/auth/actor-selection.component';
import { LoginComponent } from './features/auth/login.component';

// Role Dashboards
import { UnderwriterDashboardComponent } from './features/dashboards/underwriter-dashboard.component';
import { ClaimsDashboardComponent } from './features/dashboards/claims-dashboard.component';
import { FinanceDashboardComponent } from './features/dashboards/finance-dashboard.component';
import { AgentDashboardComponent } from './features/dashboards/agent-dashboard.component';
import { AdminDashboardComponent } from './features/dashboards/admin-dashboard.component';

// Existing feature components
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { UserDirectoryComponent } from './features/users/user-directory.component';
import { UserDashboardComponent } from './features/users/user-dashboard.component';
import { CustomerListComponent } from './features/customers/customer-list.component';
import { CustomerDetailComponent } from './features/customers/customer-detail.component';
import { VehicleListComponent } from './features/vehicles/vehicle-list.component';
import { PolicyListComponent } from './features/policies/policy-list.component';
import { PolicyDetailComponent } from './features/policies/policy-detail.component';
import { PaymentLedgerComponent } from './features/payments/payment-ledger.component';
import { ClaimListComponent } from './features/claims/claim-list.component';
import { ClaimDetailComponent } from './features/claims/claim-detail.component';

export const routes: Routes = [
  // Root Redirector - Always present Actor Directory first
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'actors'
  },

  // Public Actor Selection & Authentication
  { path: 'actors', component: ActorSelectionComponent },
  { path: 'login', component: LoginComponent },

  // Role-Specific Guarded Dashboards
  {
    path: 'dashboards/customer',
    component: UserDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_CUSTOMER', 'ROLE_ADMIN'] }
  },
  {
    path: 'dashboards/underwriter',
    component: UnderwriterDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_UNDERWRITER', 'ROLE_ADMIN'] }
  },
  {
    path: 'dashboards/claims',
    component: ClaimsDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_CLAIMS_OFFICER', 'ROLE_ADMIN'] }
  },
  {
    path: 'dashboards/finance',
    component: FinanceDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_FINANCE_OFFICER', 'ROLE_ADMIN'] }
  },
  {
    path: 'dashboards/agent',
    component: AgentDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_AGENT', 'ROLE_ADMIN'] }
  },
  {
    path: 'dashboards/admin',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_ADMIN'] }
  },

  // Operational & Management Routes - strictly role-guarded
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard, () => {
      const auth = inject(AuthService);
      const router = inject(Router);
      return router.createUrlTree([auth.getDashboardRouteForRole()]);
    }]
  },
  {
    path: 'users',
    component: UserDirectoryComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_AGENT', 'ROLE_ADMIN'] }
  },
  {
    path: 'users/:id/dashboard',
    component: UserDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_CUSTOMER', 'ROLE_AGENT', 'ROLE_ADMIN'] }
  },
  { path: 'customers/:id/dashboard', redirectTo: 'users/:id/dashboard' },

  {
    path: 'policies',
    component: PolicyListComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_UNDERWRITER', 'ROLE_AGENT', 'ROLE_ADMIN', 'ROLE_CUSTOMER'] }
  },
  {
    path: 'policies/:id',
    component: PolicyDetailComponent,
    canActivate: [authGuard]
  },
  {
    path: 'payments',
    component: PaymentLedgerComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_FINANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_CUSTOMER'] }
  },
  {
    path: 'claims',
    component: ClaimListComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_CLAIMS_OFFICER', 'ROLE_ADMIN', 'ROLE_CUSTOMER'] }
  },
  {
    path: 'claims/:id',
    component: ClaimDetailComponent,
    canActivate: [authGuard]
  },
  {
    path: 'customers',
    component: CustomerListComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_AGENT', 'ROLE_ADMIN'] }
  },
  {
    path: 'customers/:id',
    component: CustomerDetailComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_AGENT', 'ROLE_ADMIN'] }
  },
  {
    path: 'vehicles',
    component: VehicleListComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_AGENT', 'ROLE_ADMIN', 'ROLE_CUSTOMER'] }
  },

  // Catch-all fallback
  { path: '**', redirectTo: 'actors' }
];
