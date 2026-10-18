import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, CreateUserInput } from '../../../core/services/user.service';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <main>
      <h2>Create User</h2>
      <form (ngSubmit)="onSubmit(userForm.value)" #userForm="ngForm">
        <label for="name">Name:</label>
        <input id="name" name="name" type="text" required minlength="1" maxlength="100" [(ngModel)]="user.name" />
        <br />
        <label for="email">Email:</label>
        <input id="email" name="email" type="email" required [(ngModel)]="user.email" />
        <br />
        <label for="password">Password (min. 8 chars):</label>
        <input id="password" name="password" type="password" required minlength="8" [(ngModel)]="user.password" />
        <br />
        <label for="role">Role:</label>
        <select id="role" name="role" [(ngModel)]="user.role">
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
        <br />
        <button type="submit" [disabled]="!userForm.valid">Create User</button>
        @if (error) {
          <p class="error-message">{{ error }}</p>
        }
        <a routerLink="/admin/dashboard">Back to Dashboard</a>
      </form>
    </main>
  `,
  styleUrls: ['./create-user.css'],
})
export class CreateUser {
  user: CreateUserInput = { name: '', email: '', password: '', role: 'student' };
  error: string | null = null;

  constructor(private userService: UserService, private router: Router) {}

  onSubmit(input: CreateUserInput): void {
    if (!input) return;
    this.error = null;
    this.userService.create(input).subscribe({
      next: () => this.router.navigate(['/admin/dashboard']),
      error: (err) => {
        console.error('Error creating user:', err);
        this.error = err?.error?.message || 'Failed to create user';
      },
    });
  }
}
