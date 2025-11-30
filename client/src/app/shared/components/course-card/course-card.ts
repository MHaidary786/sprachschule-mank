import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface Course {
  id: number;
  title: string;
  description: string;
  duration: number; // in Months
  days: string; // e.g., "Tuesday & Thursday"
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  instructor: string; // usually Fulya Mank
  time: string; // e.g., "10:00 AM - 12:00 PM"
  price: { extern: number | null; intern: number | null }; // Price for extern and intern students
  imageUrl: string; // URL to the course image
  isOpenForEnrollment: boolean;
}


@Component({
  selector: 'app-course-card',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './course-card.html',
  styleUrl: './course-card.css',
})
export class CourseCard {
 @Input() course!: Course;
  @Output() cardClick = new EventEmitter<Course>();

  onCardClick(): void {
    if (this.course.isOpenForEnrollment) {
      this.cardClick.emit(this.course);
    }
  }
}
