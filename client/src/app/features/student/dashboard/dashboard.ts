import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, User } from '../../../core/services/auth.service';
import { CourseService, EnrolledCourse } from '../../../core/services/course.service';

@Component({
  selector: 'app-student-dashboard',
  imports: [CommonModule, RouterLink, FormsModule, MatIconModule],
  template: `
    <main class="p-4 sm:p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Willkommen, {{ profile?.name ?? '…' }} 👋</h2>

      @if (error) {
        <div class="alert-error mb-4">{{ error }}</div>
      }

      <div class="grid gap-6 md:grid-cols-2">
        <!-- Profil -->
        <section class="card p-5 sm:p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Mein Profil</h3>
          @if (profile) {
            <dl class="space-y-3">
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-gray-400">Name</dt>
                <dd class="font-medium text-gray-800">{{ profile.name }}</dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-gray-400">E-Mail</dt>
                <dd class="font-medium text-gray-800">{{ profile.email }}</dd>
              </div>
              <div>
                <dt class="text-xs font-medium uppercase tracking-wide text-gray-400">Rolle</dt>
                <dd class="font-medium capitalize text-gray-800">{{ profile.role }}</dd>
              </div>
              @if (profile.created_at) {
                <div>
                  <dt class="text-xs font-medium uppercase tracking-wide text-gray-400">Mitglied seit</dt>
                  <dd class="font-medium text-gray-800">{{ profile.created_at | date: 'mediumDate' }}</dd>
                </div>
              }
            </dl>
          } @else {
            <p class="text-gray-500">Profil wird geladen…</p>
          }

          <hr class="my-5 border-gray-100" />
          <h4 class="text-base font-semibold text-gray-900 mb-3">Passwort ändern</h4>
          @if (pwSuccess) {
            <div class="alert-success mb-3">{{ pwSuccess }}</div>
          }
          @if (pwError) {
            <div class="alert-error mb-3">{{ pwError }}</div>
          }
          <form (ngSubmit)="changePassword()" class="space-y-3">
            <div>
              <label class="label">Aktuelles Passwort</label>
              <input type="password" name="current" [(ngModel)]="pw.current" autocomplete="current-password" class="input" />
            </div>
            <div>
              <label class="label">Neues Passwort (min. 8 Zeichen)</label>
              <input type="password" name="new" [(ngModel)]="pw.new" minlength="8" autocomplete="new-password" class="input" />
            </div>
            <button type="submit" [disabled]="!pw.current || pw.new.length < 8"
              class="btn-primary btn-md">
              Passwort aktualisieren
            </button>
          </form>
        </section>

        <!-- Meine Kurse -->
        <section class="card p-5 sm:p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Meine Kurse</h3>
          @if (coursesLoading) {
            <p class="text-gray-500">Wird geladen…</p>
          } @else if (courses.length) {
            <ul class="space-y-3">
              @for (course of courses; track course.course_id) {
                <li class="rounded-lg border border-gray-200 px-4 py-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="font-medium text-gray-800">{{ course.course_title }}</span>
                    <span class="badge bg-brand-50 text-brand-700">{{ course.course_level }}</span>
                  </div>
                  <p class="mt-1 text-sm text-gray-500">
                    <span class="font-semibold text-gray-600">Lehrkraft:</span> {{ course.teacher_name }}
                  </p>
                </li>
              }
            </ul>
          } @else {
            <div class="flex flex-col items-center gap-3 py-8 text-center">
              <mat-icon class="text-4xl text-gray-300">menu_book</mat-icon>
              <p class="text-gray-500">Du bist noch keinem Kurs zugewiesen.</p>
              <a routerLink="/courses" class="btn-primary btn-md">
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
  courses: EnrolledCourse[] = [];
  coursesLoading = true;
  error = '';

  pw = { current: '', new: '' };
  pwError = '';
  pwSuccess = '';

  constructor(private auth: AuthService, private courseService: CourseService) {}

  ngOnInit(): void {
    this.auth.me().subscribe({
      next: (user) => (this.profile = user),
      error: () => {
        this.profile = this.auth.getUser();
        if (!this.profile) this.error = 'Profil konnte nicht geladen werden.';
      },
    });
    this.courseService.getStudentCourses().subscribe({
      next: (data) => {
        this.courses = data;
        this.coursesLoading = false;
      },
      error: () => (this.coursesLoading = false),
    });
  }

  changePassword(): void {
    this.pwError = '';
    this.pwSuccess = '';
    this.auth.changePassword(this.pw.current, this.pw.new).subscribe({
      next: () => {
        this.pwSuccess = 'Passwort wurde aktualisiert.';
        this.pw.current = '';
        this.pw.new = '';
      },
      error: (err) => (this.pwError = err?.error?.message || 'Passwort konnte nicht geändert werden.'),
    });
  }
}
