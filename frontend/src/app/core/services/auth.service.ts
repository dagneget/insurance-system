import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthUser, LoginRequest, RoleSwitchRequest, UserRole } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly storageKey = 'safemotor_auth_user';
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.loadUserFromStorage());

  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  public get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  public get activeRole(): UserRole | null {
    return this.currentUser ? this.currentUser.activeRole : null;
  }

  public isAuthenticated(): boolean {
    return !!this.currentUser && !!this.currentUser.authToken;
  }

  public hasRole(required: UserRole | UserRole[]): boolean {
    if (!this.currentUser) return false;
    const rolesToCheck = Array.isArray(required) ? required : [required];
    return rolesToCheck.includes(this.currentUser.activeRole) ||
           rolesToCheck.some(r => this.currentUser!.roles.includes(r));
  }

  public login(credentials: LoginRequest): Observable<AuthUser> {
    return this.api.post<AuthUser>('/auth/login', credentials).pipe(
      tap((user) => {
        this.saveUserToStorage(user);
        this.currentUserSubject.next(user);
      })
    );
  }

  public switchRole(role: UserRole): Observable<AuthUser> {
    const req: RoleSwitchRequest = { role };
    return this.api.post<AuthUser>('/auth/switch-role', req).pipe(
      tap((updated) => {
        this.saveUserToStorage(updated);
        this.currentUserSubject.next(updated);
      })
    );
  }

  public logout(redirectToActors = true): void {
    if (this.currentUser?.authToken) {
      this.api.post('/auth/logout', {}).subscribe({
        error: () => {} // ignore logout errors on backend
      });
    }
    sessionStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.storageKey);
    this.currentUserSubject.next(null);
    if (redirectToActors) {
      this.router.navigate(['/actors']);
    }
  }

  public getDashboardRouteForRole(role?: UserRole): string {
    const targetRole = role || this.currentUser?.activeRole;
    switch (targetRole) {
      case 'ROLE_CUSTOMER':
        return this.currentUser?.customerId
          ? `/dashboards/customer`
          : '/dashboards/customer';
      case 'ROLE_UNDERWRITER':
        return '/dashboards/underwriter';
      case 'ROLE_CLAIMS_OFFICER':
        return '/dashboards/claims';
      case 'ROLE_FINANCE_OFFICER':
        return '/dashboards/finance';
      case 'ROLE_AGENT':
        return '/dashboards/agent';
      case 'ROLE_ADMIN':
        return '/dashboards/admin';
      default:
        return '/dashboards/underwriter';
    }
  }

  public getRoleDisplayName(role: UserRole): string {
    switch (role) {
      case 'ROLE_CUSTOMER': return 'Policyholder';
      case 'ROLE_UNDERWRITER': return 'Underwriter';
      case 'ROLE_CLAIMS_OFFICER': return 'Claims Officer';
      case 'ROLE_FINANCE_OFFICER': return 'Finance Officer';
      case 'ROLE_AGENT': return 'Agent / Broker';
      case 'ROLE_ADMIN': return 'Administrator';
      default: return role;
    }
  }

  private loadUserFromStorage(): AuthUser | null {
    try {
      const raw = sessionStorage.getItem(this.storageKey) || localStorage.getItem(this.storageKey);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore JSON parse error
    }
    return null;
  }

  private saveUserToStorage(user: AuthUser): void {
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(user));
    } catch {
      // ignore storage error
    }
  }
}
