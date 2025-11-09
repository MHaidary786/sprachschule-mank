import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { StudentApiService } from '../../student/student-api';
import { FormsModule } from '@angular/forms';

interface Student {
  name: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-create-user',
  imports: [RouterModule, FormsModule],
  template: `
    <main>
      <h2>Create User</h2>
      <form #studentForm="ngForm" (ngSubmit)="onSubmit(student)">
        <label for="name">Name:</label>
        <input id="name" name="name" type="text" required [(ngModel)]="student.name" />
        <br />
        <label for="email">Email:</label>
        <input id="email" name="email" type="email" required [(ngModel)]="student.email" />
        <br />
        <label for="password">Password:</label>
        <input id="password" name="password" type="password" required [(ngModel)]="student.password" />
        <br />
        <button type="submit" [disabled]="!studentForm.valid">Create User</button>
        <a routerLink="/admin/dashboard">Back to Dashboard</a>
      </form>
    </main>
  `,
  styleUrls: ['./create-user.css'],
})
export class CreateUser {
  student: Student = { name: '', email: '', password: '' };

  constructor(private studentApiService: StudentApiService, private router: Router) {}

  onSubmit(studentData: Student) {
    if (!studentData) return;
    console.log('Submitting student data:', studentData);
    this.studentApiService.createStudent(studentData).subscribe({
      next: () => this.router.navigate(['/admin/dashboard']),
      error: (err) => console.error('Error creating user:', err),
    });
  }
}


