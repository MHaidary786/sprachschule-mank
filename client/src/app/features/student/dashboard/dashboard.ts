import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <main class="p-6">
      <h2 class="text-2xl font-bold mb-6">Willkommen, {{ profile?.name ?? '…' }} 👋</h2>

      @if (error) {
        <div class="mb-4 rounded-lg bg-red-100 border border-red-300 text-red-800 px-4 py-2 text-sm">{{ error }}</div>
      }

      <div class="grid gap-6 md:grid-cols-2">
        <!-- Profil -->
        <section class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold mb-4">Mein Profil</h3>
          @if (profile) {
            <dl class="space-y-3">
              <div>
                <dt class="text-sm text-gray-500">Name</dt>
                <dd class="font-medium">{{ profile.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">E-Mail</dt>
                <dd class="font-medium">{{ profile.email }}</dd>
              </div>
              <div>
                <dt class="text-sm text-gray-500">Rolle</dt>
                <dd class="font-medium capitalize">{{ profile.role }}</dd>
              </div>
              @if (profile.created_at) {
                <div>
                  <dt class="text-sm text-gray-500">Mitglied seit</dt>
                  <dd class="font-medium">{{ profile.created_at | date: 'mediumDate' }}</dd>
                </div>
              }
            </dl>
          } @else {
            <p class="text-gray-500">Profil wird geladen…</p>
          }
        </section>

        <!-- Meine Kurse -->
        <section class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold mb-4">Meine Kurse</h3>
          @if (courses.length) {
            <ul class="space-y-2">
              @for (course of courses; track $index) {
                <li class="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
                  <span class="font-medium">{{ course.title }}</span>
                  <span class="text-sm text-gray-500">{{ course.level }}</span>
                </li>
              }
            </ul>
          } @else {
            <div class="text-center py-8">
              <p class="text-gray-500 mb-4">Du bist noch keinem Kurs zugewiesen.</p>
              <a
                routerLink="/courses"
                class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Kursangebote ansehen
              </a>
            </div>
          }
        </section>
      </div>
    </main>
  `,
})
export class Dashboard implements OnInit {
  profile: User | null = null;
  courses: { title: string; level: string }[] = [];
  error = '';

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    // Use the token-backed endpoint so the profile always matches the session.
    this.auth.me().subscribe({
      next: (user) => (this.profile = user),
      error: () => {
        // Fall back to the cached user if the endpoint is unavailable.
        this.profile = this.auth.getUser();
        if (!this.profile) this.error = 'Profil konnte nicht geladen werden.';
      },
    });
  }
}
