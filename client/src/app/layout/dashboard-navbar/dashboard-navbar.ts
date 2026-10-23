import { Component, EventEmitter, Output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-navbar',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <header class="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 shadow-sm sm:px-6">
      <div class="flex min-w-0 items-center gap-3">
        <button
          type="button"
          class="btn-ghost p-2 lg:hidden"
          (click)="openSidebar.emit()"
          aria-label="Menü öffnen"
        >
          <mat-icon class="text-2xl">menu</mat-icon>
        </button>
        <a routerLink="/" class="flex min-w-0 items-center gap-2">
          <img src="assets/logo.png" alt="Logo" class="h-9" />
          <span class="hidden truncate text-base font-bold text-gray-800 sm:block md:text-lg">
            Sprachschule Mank
          </span>
        </a>
      </div>

      @if (user) {
        <div class="flex shrink-0 items-center gap-3">
          <span class="hidden text-sm text-gray-600 sm:block">
            <span class="font-medium text-gray-800">{{ user.name }}</span>
            <span class="ml-1.5 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold uppercase text-brand-700">
              {{ user.role }}
            </span>
          </span>
          <button (click)="logout()" class="btn-ghost btn-sm">
            <mat-icon class="text-lg">logout</mat-icon>
            <span class="hidden sm:inline">Abmelden</span>
          </button>
        </div>
      }
    </header>
  `,
  styleUrl: './dashboard-navbar.css',
})
export class DashboardNavbar {
  @Output() openSidebar = new EventEmitter<void>();

  constructor(private auth: AuthService, private router: Router) {}

  get user() {
    return this.auth.getUser();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
