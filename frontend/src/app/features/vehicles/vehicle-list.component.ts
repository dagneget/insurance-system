import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VehicleService } from '../../core/services/vehicle.service';
import { CustomerService } from '../../core/services/customer.service';
import { Vehicle, VehicleCreateRequest } from '../../core/models/vehicle.model';
import { Customer } from '../../core/models/customer.model';
import { ApiErrorResponse } from '../../core/models/api-error.model';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="page-header">
        <div>
          <h1>Vehicles</h1>
          <p style="color: var(--text-muted)">Manage registered motor vehicles linked to customers.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">+ Register Vehicle</button>
      </div>

      <!-- Search Bar -->
      <div class="card" style="padding: 1rem; margin-bottom: 1.5rem;">
        <div style="display: flex; gap: 0.75rem;">
          <input
            type="text"
            class="form-control"
            placeholder="Search by plate number, make, model, or customer name..."
            [(ngModel)]="searchQuery"
            (keyup.enter)="loadVehicles()"
          />
          <button class="btn btn-secondary" (click)="loadVehicles()">Search</button>
          <button *ngIf="searchQuery" class="btn btn-secondary" (click)="resetSearch()">Clear</button>
        </div>
      </div>

      <!-- Alert -->
      <div *ngIf="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>
      <div *ngIf="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading registered vehicles...</p>
      </div>

      <!-- Table -->
      <div *ngIf="!loading" class="card" style="padding: 0;">
        <div *ngIf="vehicles.length === 0" class="empty-state">
          <h3>No vehicles found</h3>
          <p>Register a vehicle for an existing customer.</p>
          <button class="btn btn-primary" style="margin-top: 1rem;" (click)="openCreateModal()">+ Register Vehicle</button>
        </div>

        <div *ngIf="vehicles.length > 0" class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Plate / Reg #</th>
                <th>Make & Model</th>
                <th>Year</th>
                <th>Owner (Customer)</th>
                <th>Registered Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let v of vehicles">
                <td>#{{ v.id }}</td>
                <td><strong>{{ v.registrationNumber }}</strong></td>
                <td>{{ v.make }} {{ v.model }}</td>
                <td>{{ v.manufactureYear }}</td>
                <td>
                  <a [routerLink]="['/customers', v.customerId]"><strong>{{ v.customerName }}</strong></a>
                </td>
                <td>{{ v.createdAt | date:'mediumDate' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Register Vehicle Modal -->
      <div *ngIf="showModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Register New Vehicle</h3>
            <button class="btn btn-sm btn-secondary" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="modalError" class="alert alert-danger">
              {{ modalError }}
            </div>

            <form (ngSubmit)="submitCreate()">
              <div class="form-group">
                <label class="form-label">Vehicle Owner (Customer) *</label>
                <select class="form-control" [(ngModel)]="newVehicle.customerId" name="customerId" required>
                  <option [ngValue]="0" disabled>Select Customer...</option>
                  <option *ngFor="let c of customerList" [ngValue]="c.id">
                    {{ c.fullName }} ({{ c.phone }})
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Registration / Plate Number *</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. 3-A12345"
                  required
                  [(ngModel)]="newVehicle.registrationNumber"
                  name="registrationNumber"
                />
                <span class="form-text">Unique identification plate for the motor vehicle.</span>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label">Make *</label>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="e.g. Toyota"
                    required
                    [(ngModel)]="newVehicle.make"
                    name="make"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Model *</label>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="e.g. Corolla"
                    required
                    [(ngModel)]="newVehicle.model"
                    name="model"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Manufacture Year *</label>
                <input
                  type="number"
                  class="form-control"
                  placeholder="2021"
                  required
                  min="1900"
                  max="2030"
                  [(ngModel)]="newVehicle.manufactureYear"
                  name="manufactureYear"
                />
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()" [disabled]="submitting">Cancel</button>
            <button
              class="btn btn-primary"
              (click)="submitCreate()"
              [disabled]="submitting || !newVehicle.customerId || !newVehicle.registrationNumber || !newVehicle.make || !newVehicle.model"
            >
              <span *ngIf="submitting" class="spinner" style="width: 1rem; height: 1rem;"></span>
              Save Vehicle
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VehicleListComponent implements OnInit {
  vehicles: Vehicle[] = [];
  customerList: Customer[] = [];
  searchQuery = '';
  loading = true;
  errorMessage = '';
  successMessage = '';

  showModal = false;
  submitting = false;
  modalError = '';
  newVehicle: VehicleCreateRequest = {
    customerId: 0,
    registrationNumber: '',
    make: '',
    model: '',
    manufactureYear: 2022
  };

  constructor(
    private vehicleService: VehicleService,
    private customerService: CustomerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();
    this.vehicleService.getVehicles(this.searchQuery).subscribe({
      next: (data) => {
        this.vehicles = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: ApiErrorResponse) => {
        this.errorMessage = err.message || 'Failed to load vehicles';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  resetSearch(): void {
    this.searchQuery = '';
    this.loadVehicles();
  }

  openCreateModal(): void {
    this.modalError = '';
    this.newVehicle = {
      customerId: 0,
      registrationNumber: '',
      make: '',
      model: '',
      manufactureYear: new Date().getFullYear() - 2
    };

    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.customerList = customers;
        this.showModal = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Could not load customer list for vehicle registration.';
        this.cdr.markForCheck();
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.cdr.markForCheck();
  }

  submitCreate(): void {
    if (!this.newVehicle.customerId || !this.newVehicle.registrationNumber.trim() || !this.newVehicle.make.trim() || !this.newVehicle.model.trim()) {
      this.modalError = 'All vehicle fields are required.';
      this.cdr.markForCheck();
      return;
    }

    this.submitting = true;
    this.modalError = '';
    this.cdr.markForCheck();

    this.vehicleService.createVehicle(this.newVehicle).subscribe({
      next: (created) => {
        this.submitting = false;
        this.showModal = false;
        this.successMessage = `Vehicle ${created.registrationNumber} registered successfully!`;
        this.loadVehicles();
        this.cdr.markForCheck();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.markForCheck();
        }, 4000);
      },
      error: (err: ApiErrorResponse) => {
        this.submitting = false;
        this.modalError = err.details?.length ? err.details.join(', ') : err.message;
        this.cdr.markForCheck();
      }
    });
  }
}
