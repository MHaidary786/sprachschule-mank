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
  imports: [RouterModule, CommonModule],
  // templateUrl: './dashboard.html',
  template : `
    <main>
  <h2>Admin Dashboard</h2>
  <p>Welcome to the admin dashboard!</p>
  <a routerLink="/admin/create-user">Create Student</a>
  
  <h3>Students List</h3>
  <ul>
    <li *ngFor="let student of students; trackBy: trackByIndex">
      <strong>Name:</strong> {{ student.name }} <br>
      <strong>Email:</strong> {{ student.email }} <br>
      <strong>Courses:</strong> {{ student.courses?.join(', ') || 'None' }}
    </li>
  </ul>
</main>

      `,
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
    students: Student[] = [];

    constructor(private studentApiService: StudentApiService){}


  ngOnInit(): void {
    this.loadStudents();
  }
  loadStudents(): void {
      this.studentApiService.getAll().subscribe({
          next: (data) => this.students = data,
          error: (err) => console.error('Failed to load students:', err)
      });
  }

    trackByIndex(index: number, item: Student): number | string {
        return item?.id ?? index;
    }
}