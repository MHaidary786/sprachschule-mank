import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { CourseCard } from '../../../shared/components/course-card/course-card';
import { CourseService, ApiCourse, CourseInput, CourseUpdate } from '../../../core/services/course.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/services/auth.service';

interface FormModel {
  id: number;
  teacher_id: number | '';
  title: string;
  description: string;
  language: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'active' | 'inactive';
  thumbnail: string;
  duration: number | '';
  days: string;
  time: string;
  price_extern: number | '';
  price_intern: number | '';
  is_open_for_enrollment: boolean;
}

const emptyForm = (): FormModel => ({
  id: 0,
  teacher_id: '',
  title: '',
  description: '',
  language: 'Deutsch',
  level: 'Beginner',
  status: 'active',
  thumbnail: '',
  duration: '',
  days: '',
  time: '',
  price_extern: '',
  price_intern: '',
  is_open_for_enrollment: true,
});

@Component({
  selector: 'app-courses',
  standalone: true,
  templateUrl: './courses.html',
  styleUrl: './courses.css',
  imports: [CourseCard, MatIcon, FormsModule],
})
export class Courses implements OnInit {
  courses: ApiCourse[] = [];
  teachers: User[] = [];
  loading = true;
  error = '';

  showAddCourseModal = false;
  showEditCourseModal = false;
  newCourse: FormModel = emptyForm();
  editedCourse: FormModel = emptyForm();
  saving = false;

  constructor(private router: Router, private courseService: CourseService, private userService: UserService) {}

  ngOnInit(): void {
    this.loadCourses();
    this.userService
      .getAll(200, 0)
      .subscribe((users) => (this.teachers = users.filter((u) => u.role !== 'student')));
  }

  get teacherOptions(): User[] {
    return this.teachers;
  }

  private loadCourses(): void {
    this.error = '';
    this.courseService.getAllCourses().subscribe({
      next: (data) => {
        this.courses = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Kurse konnten nicht geladen werden.';
        this.loading = false;
      },
    });
  }

  toggleAddCourseModal(): void {
    if (!this.showAddCourseModal) this.newCourse = emptyForm();
    this.showAddCourseModal = !this.showAddCourseModal;
  }

  startEdit(course: ApiCourse): void {
    this.editedCourse = {
      id: course.id,
      teacher_id: course.teacher_id,
      title: course.title,
      description: course.description,
      language: course.language,
      level: course.level as FormModel['level'],
      status: course.status as FormModel['status'],
      thumbnail: course.thumbnail || '',
      duration: course.duration ?? '',
      days: course.days || '',
      time: course.time || '',
      price_extern: course.price_extern === null || course.price_extern === undefined ? '' : Number(course.price_extern),
      price_intern: course.price_intern === null || course.price_intern === undefined ? '' : Number(course.price_intern),
      is_open_for_enrollment: !!course.is_open_for_enrollment,
    };
    this.showEditCourseModal = true;
  }

  toCard(course: ApiCourse) {
    return this.courseService.toCard(course);
  }

  toggleEditCourseModal(): void {
    this.showEditCourseModal = !this.showEditCourseModal;
  }

  onCourseCardClick($event: { id: number }): void {
    this.router.navigate(['/courses', $event.id]);
  }

  private toPayload(form: FormModel): CourseInput | CourseUpdate {
    const p: CourseUpdate = {
      title: form.title,
      description: form.description,
      language: form.language,
      level: form.level,
      status: form.status,
      thumbnail: form.thumbnail || null,
      duration: form.duration === '' ? null : Number(form.duration),
      days: form.days || null,
      time: form.time || null,
      price_extern: form.price_extern === '' ? null : Number(form.price_extern),
      price_intern: form.price_intern === '' ? null : Number(form.price_intern),
      is_open_for_enrollment: form.is_open_for_enrollment,
    };
    if (form.teacher_id !== '') p.teacher_id = Number(form.teacher_id);
    return p;
  }

  createCourse(): void {
    if (this.newCourse.teacher_id === '') {
      this.error = 'Bitte eine Lehrkraft auswählen.';
      return;
    }
    this.saving = true;
    this.courseService.createCourse(this.toPayload(this.newCourse) as CourseInput).subscribe({
      next: () => {
        this.saving = false;
        this.toggleAddCourseModal();
        this.loadCourses();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.details
          ? err.error.details.map((d: { field: string; message: string }) => `${d.field}: ${d.message}`).join(', ')
          : err?.error?.message || 'Kurs konnte nicht erstellt werden.';
      },
    });
  }

  editCourse(): void {
    this.saving = true;
    this.courseService.updateCourse(this.editedCourse.id, this.toPayload(this.editedCourse)).subscribe({
      next: () => {
        this.saving = false;
        this.toggleEditCourseModal();
        this.loadCourses();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.details
          ? err.error.details.map((d: { field: string; message: string }) => `${d.field}: ${d.message}`).join(', ')
          : err?.error?.message || 'Kurs konnte nicht aktualisiert werden.';
      },
    });
  }

  confirmRemove(course: ApiCourse): void {
    if (!confirm(`Kurs "${course.title}" wirklich löschen? Auch alle zugeordneten Eintragungen.`)) return;
    this.courseService.deleteCourse(course.id).subscribe({
      next: () => this.loadCourses(),
      error: (err) => (this.error = err?.error?.message || 'Löschen fehlgeschlagen'),
    });
  }
}
