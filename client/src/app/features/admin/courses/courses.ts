import { Component, input, OnInit } from '@angular/core';
import { Course, CourseCard } from '../../../shared/components/course-card/course-card';
import { Router } from '@angular/router';
import { MatAnchor } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-courses',
  standalone: true,
  templateUrl: './courses.html',
  styleUrl: './courses.css',
  imports: [CourseCard, MatAnchor, MatIcon, FormsModule],
})
export class Courses implements OnInit {
  pageId = input.required<string>();
  limit = input.required<string>();

  newCourse: Course = {
  id: 0,
  title: '',
  description: '',
  duration: 0,
  days: '',
  level: 'Beginner',
  instructor: '',
  time: '',
  price: { extern: null, intern: null },
  imageUrl: '',
  isOpenForEnrollment: false
};

  editedCourse: Course = {
  id: 0,
  title: '',
  description: '',
  duration: 0,
  days: '',
  level: 'Beginner',
  instructor: '',
  time: '',
  price: { extern: null, intern: null },
  imageUrl: '',
  isOpenForEnrollment: false
};

  showAddCourseModal = false;
  showEditCourseModal = false;
  
  toggleAddCourseModal(): void {
    this.showAddCourseModal = !this.showAddCourseModal;
  }

  toggleEditCourseModal(): void {
    this.showEditCourseModal = !this.showEditCourseModal;
  }

  createCourse(): void {
    // Logic to create a new course
      alert('New course has been created.');

      this.courses.push({ ...this.newCourse, id: this.courses.length + 1 });

    this.toggleAddCourseModal();
  }

  editCourse(): void {
    // Logic to edit an existing course
    const index = this.courses.findIndex(course => course.id === this.editedCourse.id);
    if (index !== -1) {
      this.courses[index] = { ...this.editedCourse };
    }

      alert('Course has been updated.');
    this.toggleEditCourseModal();
  }

  courses: Course[] = [];

    constructor(private router: Router) {}

  
  ngOnInit(): void {
    this.initializeCourses();
  }

  onCourseCardClick($event: Course) {
    this.router.navigate(['/courses', $event.id]);
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
  confirmRemove(courseName: string): void {
    if (confirm(`Are you sure you want to remove ${courseName}?`)) {
      // Logic to remove the course
      alert(`${courseName} has been removed.`);
    }
  }
}
