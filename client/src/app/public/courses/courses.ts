import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CourseService, ApiCourse } from '../../core/services/course.service';

export interface CourseListItem {
  id: number;
  title: string;
  description: string;
  language: string;
  level: string;
  thumbnail: string;
  price: number | null;
  isOpen: boolean;
}

@Component({
  selector: 'app-courses',
  imports: [RouterLink, MatIconModule],
  templateUrl: './courses.html',
  styleUrl: './courses.css',
})
export class Courses implements OnInit {
  courses: CourseListItem[] = [];
  loading = true;
  error = '';

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.courseService.getPublicCourses().subscribe({
      next: (all: ApiCourse[]) => {
        this.courses = all.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          language: c.language,
          level: c.level,
          thumbnail: c.thumbnail || 'https://picsum.photos/800/600',
          price:
            c.price_extern === null || c.price_extern === undefined
              ? null
              : Number(c.price_extern),
          isOpen: !!c.is_open_for_enrollment,
        }));
        this.loading = false;
      },
      error: () => {
        this.error = 'Kurse konnten nicht geladen werden.';
        this.loading = false;
      },
    });
  }
}
