import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string | null;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'auth_token';
  private readonly userKey = 'auth_user';

  constructor(private http: HttpClient) {}

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      this.clearSession();
      return null;
    }
  }

  getUserRoles(): string[] {
    const role = this.getUser()?.role;
    return role ? [role] : [];
  }

  login(credentials: { email: string; password: string }): Observable<User> {
    return this.http.post<{ token: string; user: User }>(
      `${environment.apiBaseUrl}/auth/login`,
      { email: credentials.email, password: credentials.password }
    ).pipe(
      map((res) => {
        localStorage.setItem(this.tokenKey, res.token);
        // Trust the server-provided user object, not a client-decoded token.
        const user: User = res.user;
        localStorage.setItem(this.userKey, JSON.stringify(user));
        return user;
      })
    );
  }

  logout(): void {
    this.clearSession();
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  me(): Observable<User> {
    return this.http.get<User>(`${environment.apiBaseUrl}/auth/me`);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiBaseUrl}/auth/change-password`,
      { currentPassword, newPassword }
    );
  }
}
