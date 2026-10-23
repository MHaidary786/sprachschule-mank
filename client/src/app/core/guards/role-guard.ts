import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Collect the `roles` data from the route and every ancestor (the guard runs
// against the leaf route, whose `data` does not automatically inherit the
// parent's `roles` set on the `app.routes` entry).
function collectAllowedRoles(route: ActivatedRouteSnapshot): string[] {
  const roles: string[] = [];
  for (const r of route.pathFromRoot) {
    const data = r.data['roles'] as string[] | undefined;
    if (Array.isArray(data)) roles.push(...data);
  }
  return roles;
}

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = collectAllowedRoles(route);
  // No roles declared anywhere up the tree -> nothing to enforce.
  if (allowedRoles.length === 0) return true;

  const userRoles = auth.getUserRoles();
  const match = userRoles.some((role) => allowedRoles.includes(role));

  if (!match) {
    return router.parseUrl('/');
  }
  return true;
};
