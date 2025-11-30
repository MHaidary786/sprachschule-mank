import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Course, CourseCard } from '../../shared/components/course-card/course-card';

@Component({
  selector: 'app-courses',
  imports: [CourseCard],
  templateUrl: './courses.html',
  styleUrl: './courses.css',
})
export class Courses implements OnInit {
  onCourseCardClick($event: Course) {
    this.router.navigate(['/courses', $event.id]);
  }
  courses: Course[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.initializeCourses();
  }

  private initializeCourses(): void {
    this.courses = [
      {
        id: 1,
        title: 'German Basics',
        description: 'Learn fundamental German grammar and vocabulary',
        duration: 3,
        days: 'Tuesday & Thursday',
        level: 'Beginner',
        instructor: 'Fulya Mank',
        time: '10:00 AM - 12:00 PM',
        price: { extern: 150, intern: 100 },
        imageUrl: 'https://picsum.photos/800/600',
        isOpenForEnrollment: true,
      },
      {
        id: 2,
        title: 'German Conversation',
        description: 'Improve your speaking and listening skills',
        duration: 2,
        days: 'Monday & Wednesday',
        level: 'Intermediate',
        instructor: 'Fulya Mank',
        time: '2:00 PM - 4:00 PM',
        price: { extern: 200, intern: 150 },
        imageUrl: 'https://picsum.photos/800/600',
        isOpenForEnrollment: false,
      },
      {
        id: 3,
        title: 'German Basics',
        description: 'Improve your speaking and listening skills',
        duration: 2,
        days: 'Monday & Wednesday',
        level: 'Intermediate',
        instructor: 'Fulya Mank',
        time: '2:00 PM - 4:00 PM',
        price: { extern: 200, intern: null },
        imageUrl: 'https://picsum.photos/800/600',
        isOpenForEnrollment: true,
      },
      {
        id: 4,
        title: 'German Conversation',
        description: 'Improve your speaking and listening skills',
        duration: 2,
        days: 'Monday & Wednesday',
        level: 'Intermediate',
        instructor: 'Fulya Mank',
        time: '2:00 PM - 4:00 PM',
        price: { extern: 200, intern: 150 },
        imageUrl: 'https://picsum.photos/800/600',
        isOpenForEnrollment: true,
      },
    ];
  }
}
