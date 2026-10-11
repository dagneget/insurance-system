import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="app-header">
      <div class="header-container">
        <div class="brand">
          <a routerLink="/" class="brand-link">
            <span class="brand-icon">🚗</span>
            <span class="brand-title">SafeMotor Insurance</span>
          </a>
          <span class="badge badge-simulated">Demo MVP</span>
        </div>

        <nav class="nav-links">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">Dashboard</a>
          <a routerLink="/policies" routerLinkActive="active" class="nav-item">Policies</a>
          <a routerLink="/customers" routerLinkActive="active" class="nav-item">Customers</a>
          <a routerLink="/vehicles" routerLinkActive="active" class="nav-item">Vehicles</a>
          <a routerLink="/claims" routerLinkActive="active" class="nav-item">Claims</a>
        </nav>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      background-color: #ffffff;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: var(--shadow-sm);
    }
    .header-container {
      max-width: 1240px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .brand-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: var(--text-main);
      font-weight: 700;
      font-size: 1.125rem;
    }
    .brand-icon {
      font-size: 1.5rem;
    }
    .nav-links {
      display: flex;
      gap: 0.5rem;
    }
    .nav-item {
      padding: 0.5rem 0.875rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-muted);
      border-radius: var(--radius);
      text-decoration: none;
      transition: all 0.15s ease-in-out;
    }
    .nav-item:hover {
      color: var(--text-main);
      background-color: #f1f5f9;
      text-decoration: none;
    }
    .nav-item.active {
      color: var(--primary);
      background-color: var(--primary-light);
      font-weight: 600;
    }
  `]
})
export class NavbarComponent {}
