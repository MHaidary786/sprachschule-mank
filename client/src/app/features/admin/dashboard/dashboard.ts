import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StudentApiService } from '../../student/student-api';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Student {
  id?: number | string;
  name: string;
  email: string;
  courses?: string[];
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterModule, CommonModule, FormsModule],
  standalone: true,
  // templateUrl: './dashboard.html',
  template: `
    <main>
      <h2>Admin Dashboard</h2>
      <p>Welcome to the admin dashboard!</p>
      <a routerLink="/admin/create-user">Create Student</a>

      <section>
        <h3>Get Student By Name</h3>
        <form #getStudentForm="ngForm" (ngSubmit)="loadStudentByName()">
          <label for="studentName">Student Name:</label>
          <input id="studentName" name="studentName" type="text" required [(ngModel)]="studentName" />
        </form>
        <button (click)="loadStudentByName()" [disabled]="!studentName">Get Student</button>

        @if (fetchedStudent) {
          <div>
          <p><strong>Name:</strong> {{ fetchedStudent.name }}</p>
          <p><strong>Email:</strong> {{ fetchedStudent.email }}</p>
          <p><strong>Courses:</strong> {{ fetchedStudent.courses?.join(', ') || 'None' }}</p>
        </div>
        }
        @if (error) {
          <div class="error-message">{{ error }}</div>
        }
      </section>

      <h3>Students List</h3>
      <ul>
        @for (student of students; track student.name) 
        {
          <li>
          <strong>Name:</strong> {{ student.name }} <br />
          <strong>Email:</strong> {{ student.email }} <br />
          <strong>Courses:</strong> {{ student.courses?.join(', ') || 'None' }}
        </li>
        }
      </ul>
    </main>
  `,
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  
  students: Student[] = [];
  studentName: string = '';
  fetchedStudent: Student | null = null;
  error: string = '';

  constructor(private studentApiService: StudentApiService) {}

  ngOnInit(): void {
    this.loadStudents();
  }
  loadStudents(): void {
    this.studentApiService.getAll().subscribe({
      next: (data) => (this.students = data),
      error: (err) => console.error('Failed to load students:', err),
    });
  }

  loadStudentByName() {
    if (!this.studentName) return;
    this.studentApiService.getStudentByName(this.studentName).subscribe({
      next: (data: Student | null) => (this.fetchedStudent = data),
      error: (err: any) => {
        console.error('Failed to load student:', err);
        this.fetchedStudent = null;
        this.error = 'Failed to load student. Please try again.';
      },
    });
  }

  // trackByIndex(index: number, item: Student): number | string {
  //   return item?.id ?? index;
  // }
}
