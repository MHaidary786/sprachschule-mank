import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private user: { role: string } | null = null;

  login(user: { role: string }) {
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  }

  logout() {
    this.user = null;
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    return !!this.user || !!localStorage.getItem('user');
  }

  getRole(): string | null {
    return this.user?.role || JSON.parse(localStorage.getItem('user') || 'null')?.role;
  }
}
