import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.model';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/actors']);
    return false;
  }

  const allowedRoles = (route.data['roles'] || []) as UserRole[];
  if (allowedRoles.length === 0) {
    return true;
  }

  const currentUser = authService.currentUser;
  const currentRole = currentUser?.activeRole;

  if (currentRole && allowedRoles.includes(currentRole)) {
    return true;
  }

  // If user has one of the allowed roles in their assigned roles, switch active role
  if (currentUser) {
    const matchingRole = currentUser.roles.find(r => allowedRoles.includes(r));
    if (matchingRole) {
      authService.switchRole(matchingRole).subscribe();
      return true;
    }
  }

  // Redirect to user's authorized role dashboard
  const fallback = authService.getDashboardRouteForRole();
  router.navigateByUrl(fallback);
  return false;
};
