import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CustomerListComponent } from './features/customers/customer-list.component';
import { CustomerDetailComponent } from './features/customers/customer-detail.component';
import { VehicleListComponent } from './features/vehicles/vehicle-list.component';
import { PolicyListComponent } from './features/policies/policy-list.component';
import { PolicyDetailComponent } from './features/policies/policy-detail.component';
import { ClaimListComponent } from './features/claims/claim-list.component';
import { ClaimDetailComponent } from './features/claims/claim-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'customers', component: CustomerListComponent },
  { path: 'customers/:id', component: CustomerDetailComponent },
  { path: 'vehicles', component: VehicleListComponent },
  { path: 'policies', component: PolicyListComponent },
  { path: 'policies/:id', component: PolicyDetailComponent },
  { path: 'claims', component: ClaimListComponent },
  { path: 'claims/:id', component: ClaimDetailComponent },
  { path: '**', redirectTo: 'dashboard' }
];
