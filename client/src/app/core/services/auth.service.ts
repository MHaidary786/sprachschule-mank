import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'auth_token';

  constructor(private http: HttpClient) {}

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getUserRoles(): string[] {
    const token = this.decodeToken();
    return token?.roles || [];
  }

  getUserType(): string {
    const token = this.decodeToken();
    return token?.type || '';
  }

  private decodeToken() {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[1]));
  }

  login(credentials: any) {
    if (credentials.remember) {
      // Implement remember me functionality if needed
    }
    return this.http.post('/api/auth/login', {username: credentials.username, password: credentials.password}).pipe(
      tap((res: any) => localStorage.setItem(this.tokenKey, res.token))
    );
  }
}
