import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const allowedRoles = route.data['roles'] as string[];
    const userRoles = this.auth.getUserRoles();
    const match = userRoles.some((role) => allowedRoles.includes(role));

    if (!match) {
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}
