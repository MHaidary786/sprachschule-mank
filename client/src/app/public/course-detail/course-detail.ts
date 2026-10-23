import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { CourseService, ApiCourse } from '../../core/services/course.service';
import { BookingService } from '../../core/services/booking.service';

@Component({
  selector: 'app-course-detail',
  imports: [RouterLink, FormsModule, MatIconModule],
  templateUrl: './course-detail.html',
  styleUrl: './course-detail.css',
})
export class CourseDetail implements OnInit, OnDestroy {
  course: ApiCourse | null = null;
  loading = true;
  notFound = false;

  // Booking form state.
  submitting = false;
  success = false;
  submitError = '';

  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private bookingService: BookingService,
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.route.paramMap.subscribe((params) => {
        const idParam = params.get('id');
        const id = idParam ? Number(idParam) : NaN;
        this.loading = true;
        this.notFound = false;
        this.success = false;
        this.submitError = '';

        this.courseService.getPublicCourse(id).subscribe({
          next: (course: ApiCourse) => {
            this.course = course;
            this.loading = false;
          },
          error: () => {
            this.course = null;
            this.loading = false;
            this.notFound = true;
          },
        });
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ---- Display helpers ----------------------------------------------------
  /** Turn a raw price (number | string | null) into a clean number or null. */
  private toNum(v: number | string | null | undefined): number | null {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  priceExtern(): number | null {
    return this.course ? this.toNum(this.course.price_extern) : null;
  }

  priceIntern(): number | null {
    return this.course ? this.toNum(this.course.price_intern) : null;
  }

  durationLabel(): string {
    const d = this.course?.duration;
    if (d === null || d === undefined) return '—';
    return `${d} ${d === 1 ? 'Monat' : 'Monate'}`;
  }

  // ---- Booking -----------------------------------------------------------
  onSubmit(form: NgForm): void {
    if (form.invalid || !this.course) {
      return;
    }
    this.submitting = true;
    this.success = false;
    this.submitError = '';

    const { name, email, phone, message } = form.value;

    this.subs.add(
      this.bookingService
        .submitBooking({
          course_id: this.course.id,
          name,
          email,
          phone: phone || undefined,
          message: message || undefined,
        })
        .subscribe({
          next: () => {
            this.submitting = false;
            this.success = true;
            form.resetForm();
          },
          error: (err) => {
            this.submitting = false;
            this.success = false;
            this.submitError =
              err?.error?.message ||
              err?.error?.error ||
              'Ihre Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.';
          },
        }),
    );
  }
}
