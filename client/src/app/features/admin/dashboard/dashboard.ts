import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { UserService, UserStats } from '../../../core/services/user.service';
import { AuthService, User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, CommonModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  stats: UserStats | null = null;
  recentUsers: User[] = [];
  error = '';
  loading = true;

  constructor(private userService: UserService, private auth: AuthService) {}

  get user(): User | null {
    return this.auth.getUser();
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.error = '';
    this.userService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Die Dashboard-Daten konnten nicht geladen werden.';
      },
    });

    this.userService.getAll(5, 0).subscribe({
      next: (users) => {
        users.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        this.recentUsers = users;
      },
      error: () => {
        this.recentUsers = [];
      },
    });
  }

  roleBadge(role: string): string {
    switch (role) {
      case 'student':
        return 'bg-blue-100 text-blue-800';
      case 'teacher':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  roleLabel(role: string): string {
    switch (role) {
      case 'student':
        return 'Student';
      case 'teacher':
        return 'Lehrkraft';
      case 'admin':
        return 'Admin';
      default:
        return role;
    }
  }
}
