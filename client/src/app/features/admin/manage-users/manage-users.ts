import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService, UpdateUserInput } from '../../../core/services/user.service';
import { AuthService, User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <main class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold">Benutzer verwalten</h2>
        <a
          routerLink="/admin/create-user"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
        >
          + Benutzer anlegen
        </a>
      </div>

      @if (error) {
        <div class="mb-4 rounded-lg bg-red-100 border border-red-300 text-red-800 px-4 py-2 text-sm">{{ error }}</div>
      }

      <div class="mb-4 flex gap-2">
        <input
          [(ngModel)]="search"
          (ngModelChange)="onSearch()"
          placeholder="Nach Name oder E-Mail suchen…"
          class="border border-gray-300 rounded-lg px-3 py-2 w-72"
        />
        <select [(ngModel)]="roleFilter" (ngModelChange)="onSearch()" class="border border-gray-300 rounded-lg px-3 py-2">
          <option value="">Alle Rollen</option>
          <option value="student">Studenten</option>
          <option value="teacher">Lehrkräfte</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <table class="w-full bg-white rounded-lg shadow overflow-hidden">
        <thead class="bg-gray-100 text-left">
          <tr>
            <th class="p-3">Name</th>
            <th class="p-3">E-Mail</th>
            <th class="p-3">Rolle</th>
            <th class="p-3">Erstellt</th>
            <th class="p-3 text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          @for (user of users; track user.id) {
            <tr class="border-t border-gray-200">
              <td class="p-3">{{ user.name }}</td>
              <td class="p-3">{{ user.email }}</td>
              <td class="p-3">
                <span class="px-2 py-1 rounded text-xs font-semibold" [ngClass]="roleBadge(user.role)">
                  {{ roleLabel(user.role) }}</span>
              </td>
              <td class="p-3 text-gray-500">
                @if (user.created_at) { {{ user.created_at | date: 'dd.MM.yyyy' }} } @else { – }
              </td>
              <td class="p-3 text-right whitespace-nowrap">
                <button (click)="startEdit(user)" class="text-blue-600 hover:underline mr-3">Bearbeiten</button>
                @if (user.id !== myId) {
                  <button (click)="remove(user)" class="text-red-600 hover:underline">Löschen</button>
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="p-4 text-center text-gray-500">Keine Benutzer gefunden.</td></tr>
          }
        </tbody>
      </table>

      <div class="mt-4 flex items-center gap-3">
        <button [disabled]="offset === 0" (click)="prevPage()" class="px-3 py-1 border rounded disabled:opacity-40">
          Zurück
        </button>
        <span class="text-gray-600">Seite {{ page + 1 }}</span>
        <button [disabled]="users.length < pageSize" (click)="nextPage()" class="px-3 py-1 border rounded disabled:opacity-40">
          Weiter
        </button>
      </div>

      @if (editing) {
        <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 class="text-xl font-bold mb-4">Benutzer bearbeiten: {{ editing.name }}</h3>
            <form (ngSubmit)="saveEdit(editForm.value)" #editForm="ngForm" class="space-y-3">
              <div>
                <label class="block text-sm font-medium mb-1">Name</label>
                <input name="name" [(ngModel)]="form.name" class="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">E-Mail</label>
                <input name="email" type="email" [(ngModel)]="form.email" class="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Rolle</label>
                <select name="role" [(ngModel)]="form.role" class="w-full border rounded-lg px-3 py-2">
                  <option value="student">Student</option>
                  <option value="teacher">Lehrkraft</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Neues Passwort (optional)</label>
                <input
                  name="password"
                  type="password"
                  [(ngModel)]="form.password"
                  placeholder="Leer lassen = unverändert"
                  class="w-full border rounded-lg px-3 py-2"
                />
              </div>
              @if (editError) {
                <p class="text-red-600 text-sm">{{ editError }}</p>
              }
              <div class="flex justify-end gap-2 pt-2">
                <button type="button" (click)="cancelEdit()" class="px-4 py-2 border rounded-lg">Abbrechen</button>
                <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Speichern</button>
              </div>
            </form>
          </div>
        </div>
      }
    </main>
  `,
  styles: `
    .badge-student { background: #dbeafe; color: #1e40af; }
    .badge-teacher { background: #dcfce7; color: #166534; }
    .badge-admin { background: #fee2e2; color: #991b1b; }
  `,
})
export class ManageUsers implements OnInit {
  users: User[] = [];
  error = '';
  search = '';
  roleFilter = '';
  page = 0;
  pageSize = 20;

  editing: User | null = null;
  form: { name: string; email: string; role: 'student' | 'teacher' | 'admin'; password: string } = {
    name: '',
    email: '',
    role: 'student',
    password: '',
  };
  editError = '';

  get myId(): number | undefined {
    return this.auth.getUser()?.id;
  }

  constructor(private userService: UserService, private auth: AuthService) {}

  ngOnInit(): void {
    this.load();
  }

  roleBadge(role: string): string {
    return `badge-${role}`;
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

  get offset(): number {
    return this.page * this.pageSize;
  }

  private load(): void {
    this.error = '';
    this.userService.getAll(this.pageSize, this.offset).subscribe({
      next: (data) => {
        const term = this.search.trim().toLowerCase();
        this.users = data.filter((u) => {
          const matchesRole = !this.roleFilter || u.role === this.roleFilter;
          const matchesSearch =
            !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
          return matchesRole && matchesSearch;
        });
      },
      error: () => (this.error = 'Benutzer konnten nicht geladen werden.'),
    });
  }

  onSearch(): void {
    this.page = 0;
    this.load();
  }

  prevPage(): void {
    if (this.page > 0) {
      this.page--;
      this.load();
    }
  }

  nextPage(): void {
    this.page++;
    this.load();
  }

  startEdit(user: User): void {
    this.editing = user;
    this.form = { name: user.name, email: user.email, role: user.role, password: '' };
    this.editError = '';
  }

  cancelEdit(): void {
    this.editing = null;
  }

  saveEdit(input: { name: string; email: string; role: string; password: string }): void {
    if (!this.editing) return;
    const payload: UpdateUserInput = {
      name: input.name,
      email: input.email,
      role: input.role as UpdateUserInput['role'],
    };
    if (input.password) payload.password = input.password;

    this.userService.update(this.editing.id, payload).subscribe({
      next: () => {
        this.cancelEdit();
        this.load();
      },
      error: (err) => (this.editError = err?.error?.message || 'Speichern fehlgeschlagen'),
    });
  }

  remove(user: User): void {
    if (!confirm(`Benutzer "${user.name}" wirklich löschen?`)) return;
    this.userService.remove(user.id).subscribe({
      next: () => this.load(),
      error: (err) => (this.error = err?.error?.message || 'Löschen fehlgeschlagen'),
    });
  }
}
