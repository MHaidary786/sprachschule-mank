import { Component, input } from '@angular/core';

@Component({
  selector: 'app-courses',
  standalone: false,
  templateUrl: './courses.html',
  styleUrl: './courses.css',
})
export class Courses {
  pageId = input.required<string>();
  limit = input.required<string>();
}
