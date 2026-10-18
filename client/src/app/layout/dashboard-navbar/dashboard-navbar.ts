import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-navbar',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <header class="flex items-center justify-between px-6 h-16 bg-white shadow-sm border-b border-gray-100">
      <a routerLink="/" class="flex items-center gap-2">
        <img src="assets/logo.png" alt="Logo" class="h-9" />
        <span class="font-bold text-lg text-gray-800">Sprachschule Mank</span>
      </a>

      @if (user) {
        <div class="flex items-center gap-4">
          <span class="text-gray-600 text-sm hidden sm:block">
            {{ user.name }}
            <span class="uppercase text-xs text-gray-400 ml-1">{{ user.role }}</span>
          </span>
          <button
            (click)="logout()"
            class="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            <mat-icon fontIcon="logout" class="text-lg">logout</mat-icon>
            Abmelden
          </button>
        </div>
      }
    </header>
  `,
  styleUrl: './dashboard-navbar.css',
})
export class DashboardNavbar {
  constructor(private auth: AuthService, private router: Router) {}

  get user() {
    return this.auth.getUser();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
