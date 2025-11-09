import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { StudentApiService, Student } from '../../student/student-api';

@Component({
  selector: 'app-create-user',
  imports: [RouterModule],
  // templateUrl: './create-user.html',
  template : `
    <main>
      <h2>Create User</h2>
      <form #studentForm="ngForm" (ngSubmit)="onSubmit(studentForm)">
        <label for="username">Username:</label>
        <input id="username" name="username" type="text" required />
        <br />
        <label for="email">Email:</label>
        <input id="email" name="email" type="email" required />
        <br />
        <label for="password">Password:</label>
        <input id="password" name="password" type="password" required />
        <br />
        <button type="submit" [disabled]="!studentForm.valid">Create User</button>
        <a routerLink="/dashboard">Back to Dashboard</a>
      </form>
    </main>
  `,
  styleUrl: './create-user.css',
})
export class CreateUser {
  constructor(private studentApiService: StudentApiService, private router: Router) { }
  onSubmit(StudentData: Student) {
    if (!StudentData) return;
     
    this.studentApiService.createStudent(StudentData).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => console.error('Error creating user:', err),
    });
    
  }
}
