import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterModule, CommonModule, FormsModule],
  standalone: true,
  template: `
    <main>
      <h2>Admin Dashboard</h2>
      <p>Welcome to the admin dashboard!</p>
      <a routerLink="/admin/create-user">Create User</a>

      <section>
        <h3>Users</h3>
        @if (error) {
          <div class="error-message">{{ error }}</div>
        }
        <ul>
          @for (user of users; track user.id) {
            <li>
              <strong>Name:</strong> {{ user.name }} <br />
              <strong>Email:</strong> {{ user.email }} <br />
              <strong>Role:</strong> {{ user.role }}
            </li>
          }
        </ul>
      </section>
    </main>
  `,
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  users: User[] = [];
  error: string = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (data) => (this.users = data),
      error: (err) => {
        console.error('Failed to load users:', err);
        this.error = 'Failed to load users. Please try again.';
      },
    });
  }
}
