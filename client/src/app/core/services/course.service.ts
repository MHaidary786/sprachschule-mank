import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Course } from '../../shared/components/course-card/course-card';

// Server-side course row (courses table).
export interface ApiCourse {
  id: number;
  teacher_id: number;
  title: string;
  description: string;
  language: string;
  level: string;
  thumbnail: string | null;
  status: string;
  duration: number | null;
  days: string | null;
  time: string | null;
  price_extern: number | string | null;
  price_intern: number | string | null;
  is_open_for_enrollment: boolean;
  teacher_name?: string;
  student_count?: number;
}

export interface CourseInput {
  teacher_id: number;
  title: string;
  description: string;
  language: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  status?: 'active' | 'inactive';
  thumbnail?: string | null;
  duration?: number | null;
  days?: string | null;
  time?: string | null;
  price_extern?: number | null;
  price_intern?: number | null;
  is_open_for_enrollment?: boolean;
}

export interface CourseUpdate extends Partial<CourseInput> {}

// A student's enrolled course (from /student/me/courses or /teacher/...).
export interface EnrolledCourse {
  course_id: number;
  course_title: string;
  course_level: string;
  course_language: string;
  teacher_id: number;
  teacher_name: string;
  progress: number;
}

@Injectable({ providedIn: 'root' })
export class CourseService {
  private base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // Convert an API course row into the display shape used by <app-course-card>.
  toCard(c: ApiCourse): Course {
    const num = (v: number | string | null | undefined) => (v === null || v === undefined ? null : Number(v));
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      duration: c.duration ?? 0,
      days: c.days ?? '',
      level: (c.level as Course['level']) || 'Beginner',
      instructor: c.teacher_name || '—',
      time: c.time ?? '',
      price: { extern: num(c.price_extern), intern: num(c.price_intern) },
      imageUrl: c.thumbnail || 'https://picsum.photos/800/600',
      isOpenForEnrollment: !!c.is_open_for_enrollment,
    };
  }

  // --- Public -------------------------------------------------------------
  getPublicCourses(): Observable<ApiCourse[]> {
    return this.http.get<ApiCourse[]>(`${this.base}/public/courses`);
  }

  getPublicCourse(id: number): Observable<ApiCourse> {
    return this.http.get<ApiCourse>(`${this.base}/public/courses/${id}`);
  }

  // --- Admin --------------------------------------------------------------
  getAllCourses(): Observable<ApiCourse[]> {
    return this.http.get<ApiCourse[]>(`${this.base}/admin/courses`);
  }

  createCourse(input: CourseInput): Observable<{ message: string; course: ApiCourse }> {
    return this.http.post<{ message: string; course: ApiCourse }>(`${this.base}/admin/courses`, input);
  }

  updateCourse(id: number, input: CourseUpdate): Observable<{ message: string; course: ApiCourse }> {
    return this.http.patch<{ message: string; course: ApiCourse }>(`${this.base}/admin/courses/${id}`, input);
  }

  deleteCourse(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/admin/courses/${id}`);
  }

  // Admin: manage a class's roster.
  getCourseStudents(courseId: number): Observable<{ id: number; name: string; email: string }[]> {
    return this.http.get<{ id: number; name: string; email: string }[]>(`${this.base}/admin/courses/${courseId}/students`);
  }

  enrollStudent(courseId: number, studentId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/admin/courses/${courseId}/students`, { student_id: studentId });
  }

  removeStudent(courseId: number, studentId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/admin/courses/${courseId}/students/${studentId}`);
  }

  // --- Teacher -----------------------------------------------------------
  getTeacherCourses(): Observable<ApiCourse[]> {
    return this.http.get<ApiCourse[]>(`${this.base}/teacher/courses`);
  }

  getTeacherStudents(): Observable<{ id: number; name: string; email: string }[]> {
    return this.http.get<{ id: number; name: string; email: string }[]>(`${this.base}/teacher/students`);
  }

  getTeacherCourseStudents(courseId: number): Observable<{ id: number; name: string; email: string }[]> {
    return this.http.get<{ id: number; name: string; email: string }[]>(`${this.base}/teacher/courses/${courseId}/students`);
  }

  enrollToTeacherCourse(courseId: number, studentId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/teacher/courses/${courseId}/students`, { student_id: studentId });
  }

  removeFromTeacherCourse(courseId: number, studentId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/teacher/courses/${courseId}/students/${studentId}`);
  }

  // --- Student -----------------------------------------------------------
  getStudentCourses(): Observable<EnrolledCourse[]> {
    return this.http.get<EnrolledCourse[]>(`${this.base}/student/me/courses`);
  }
}
