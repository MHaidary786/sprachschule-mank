import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, User } from '../../../core/services/auth.service';
import { CourseService, ApiCourse } from '../../../core/services/course.service';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [RouterLink, CommonModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  studentCount: number | null = null;
  courseCount: number | null = null;
  courses: ApiCourse[] = [];

  constructor(private auth: AuthService, private courseService: CourseService) {}

  get user(): User | null {
    return this.auth.getUser();
  }

  ngOnInit(): void {
    this.courseService.getTeacherCourses().subscribe({
      next: (data) => {
        this.courses = data;
        this.courseCount = data.length;
      },
      error: () => (this.courseCount = null),
    });
    // Student count = distinct students across the teacher's classes.
    this.courseService.getTeacherStudents().subscribe({
      next: (data) => (this.studentCount = data.length),
      error: () => (this.studentCount = null),
    });
  }
}
