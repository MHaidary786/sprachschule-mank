import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = (route.data['roles'] as string[]) || [];
  const userRoles = auth.getUserRoles();
  const match = userRoles.some((role) => allowedRoles.includes(role));

  if (!match) {
    return router.parseUrl('/');
  }
  return true;
};
