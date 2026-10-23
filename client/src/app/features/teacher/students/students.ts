import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseService, ApiCourse } from '../../../core/services/course.service';
import { UserService } from '../../../core/services/user.service';

interface Student { id: number; name: string; email: string }

@Component({
  selector: 'app-students',
  imports: [CommonModule, FormsModule],
  template: `
    <main class="p-6">
      <h2 class="text-2xl font-bold mb-2">Meine Kurse &amp; Schüler</h2>
      <p class="text-gray-500 mb-6">Weisen Sie Studenten Ihren Kursen zu und entfernen Sie sie wieder.</p>

      @if (error) {
        <div class="mb-4 rounded-lg bg-red-100 border border-red-300 text-red-800 px-4 py-2 text-sm">{{ error }}</div>
      }

      @if (classes.length === 0) {
        <p class="text-gray-500">Sie sind noch keinem Kurs zugeteilt.</p>
      } @else {
        @for (course of classes; track course.id) {
          <section class="bg-white rounded-lg shadow p-5 mb-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-semibold">{{ course.title }}</h3>
              <span class="text-sm text-gray-500">{{ (courseStudents[course.id] || []).length }} Schüler</span>
            </div>

            @if ((courseStudents[course.id] || []).length === 0) {
              <p class="text-sm text-gray-400 mb-3">Noch keine Schüler in diesem Kurs.</p>
            } @else {
              <ul class="mb-4">
                @for (s of courseStudents[course.id]; track s.id) {
                  <li class="flex items-center justify-between border-b border-gray-100 py-2">
                    <div>
                      <span class="font-medium">{{ s.name }}</span>
                      <span class="text-gray-500 text-sm ml-2">{{ s.email }}</span>
                    </div>
                    <button (click)="removeFrom(course.id, s)" class="text-red-600 hover:underline text-sm">Entfernen</button>
                  </li>
                }
              </ul>
            }

            <form (ngSubmit)="enroll(course.id)" class="flex gap-2 items-end">
              <div class="flex-1">
                <label class="block text-sm text-gray-500 mb-1">Student in diesen Kurs aufnehmen</label>
                <select name="student" [(ngModel)]="courseStudentPicks[course.id]" class="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Student wählen…</option>
                  @for (cand of allStudents; track cand.id) {
                    <option [value]="cand.id">{{ cand.name }} ({{ cand.email }})</option>
                  }
                </select>
              </div>
              <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">Hinzufügen</button>
            </form>
          </section>
        }
      }
    </main>
  `,
})
export class Students implements OnInit {
  classes: ApiCourse[] = [];
  allStudents: Student[] = [];
  courseStudents: Record<number, Student[]> = {};
  courseStudentPicks: Record<number, number | ''> = {};
  error = '';

  constructor(private courseService: CourseService, private userService: UserService) {}

  ngOnInit(): void {
    this.courseService.getTeacherCourses().subscribe({
      next: (courses) => {
        this.classes = courses;
        for (const c of courses) {
          this.courseStudentPicks[c.id] = '';
          this.loadCourseStudents(c.id);
        }
      },
      error: (err) => (this.error = err?.error?.message || 'Kurse konnten nicht geladen werden.'),
    });

    // All students (admin list) to pick from for enrollment.
    this.userService.getAll(200, 0).subscribe({
      next: (users) => (this.allStudents = users.filter((u) => u.role === 'student')),
      error: () => (this.error = 'Studentenliste konnte nicht geladen werden.'),
    });
  }

  private loadCourseStudents(courseId: number): void {
    this.courseService.getTeacherCourseStudents(courseId).subscribe({
      next: (data) => (this.courseStudents[courseId] = data),
      error: () => (this.courseStudents[courseId] = []),
    });
  }

  enroll(courseId: number): void {
    const pick = this.courseStudentPicks[courseId];
    if (!pick) return;
    this.courseService.enrollToTeacherCourse(courseId, Number(pick)).subscribe({
      next: () => {
        this.courseStudentPicks[courseId] = '';
        this.loadCourseStudents(courseId);
      },
      error: (err) => (this.error = err?.error?.message || 'Aufnahme fehlgeschlagen'),
    });
  }

  removeFrom(courseId: number, student: Student): void {
    this.courseService.removeFromTeacherCourse(courseId, student.id).subscribe({
      next: () => this.loadCourseStudents(courseId),
      error: (err) => (this.error = err?.error?.message || 'Entfernen fehlgeschlagen'),
    });
  }
}
