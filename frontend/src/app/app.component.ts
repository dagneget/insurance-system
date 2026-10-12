import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  template: `
    <div class="app-canvas">
      <div class="app-window">
        <!-- Render Sidebar ONLY when authenticated and NOT on actor/login pages -->
        <app-navbar *ngIf="showSidebar" class="app-sidebar-host"></app-navbar>
        <main class="app-main-viewport">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'SafeMotor Insurance';
  showSidebar = false;
  private routerSub?: Subscription;
  private authSub?: Subscription;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.updateSidebarVisibility();

    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateSidebarVisibility();
      });

    this.authSub = this.authService.currentUser$.subscribe(() => {
      this.updateSidebarVisibility();
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.authSub?.unsubscribe();
  }

  private updateSidebarVisibility(): void {
    const rawUrl = this.router.url || '';
    const path = rawUrl.split('?')[0];
    const isPublic = path === '/actors' || path === '/login' || path === '/' || path === '';
    this.showSidebar = this.authService.isAuthenticated() && !isPublic;
  }
}

