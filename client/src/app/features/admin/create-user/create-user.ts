import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, CreateUserInput } from '../../../core/services/user.service';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <main class="p-6">
      <div class="mb-6">
        <a routerLink="/admin/dashboard" class="text-sm text-blue-600 hover:underline">
          ← Zurück zum Dashboard
        </a>
      </div>

      <div class="max-w-lg bg-white rounded-lg shadow p-6">
        <h2 class="text-2xl font-bold mb-1">Benutzer anlegen</h2>
        <p class="text-gray-500 text-sm mb-6">Erstellen Sie einen neuen Benutzer für die Sprachschule.</p>

        @if (error) {
          <div class="mb-4 rounded-lg bg-red-100 border border-red-300 text-red-800 px-4 py-2 text-sm">{{ error }}</div>
        }

        <form (ngSubmit)="onSubmit(userForm.value)" #userForm="ngForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minlength="1"
              maxlength="100"
              [(ngModel)]="user.name"
              class="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Vor- und Nachname"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">E-Mail</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              [(ngModel)]="user.email"
              class="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="name@beispiel.at"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Passwort (min. 8 Zeichen)</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minlength="8"
              [(ngModel)]="user.password"
              class="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Rolle</label>
            <select id="role" name="role" [(ngModel)]="user.role" class="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="student">Student</option>
              <option value="teacher">Lehrkraft</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              routerLink="/admin/dashboard"
              class="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              [disabled]="!userForm.valid"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg"
            >
              Benutzer anlegen
            </button>
          </div>
        </form>
      </div>
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
      next: () => this.router.navigate(['/admin/users']),
      error: (err) => {
        console.error('Error creating user:', err);
        this.error = err?.error?.message || 'Benutzer konnte nicht erstellt werden.';
      },
    });
  }
}
