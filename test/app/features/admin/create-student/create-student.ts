import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StudentApiService } from '../../student/student-api'; // adjust path
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-create-student',
  template : `
    <main>
      <form (ngSubmit)="onSubmit()">
  <div>
    <label for="name">Name</label>
    <input id="name" formControlName="name" />
  </div>

  <div>
    <label for="email">Email</label>
    <input id="email" formControlName="email" type="email" />
  </div>

  <div>
    <label for="password">Password</label>
    <input id="password" formControlName="password" type="password" />
  </div>

  <button type="submit" [disabled]="studentForm.invalid">Create Student</button>
</form>
    </main>
  `,
  imports: [RouterModule]
})
export class CreateStudentComponent implements OnInit {
  studentForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private studentService: StudentApiService
  ) {}

  ngOnInit(): void {
    this.studentForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['student'],
    });
  }

  onSubmit() {
    if (this.studentForm.valid) {
      this.studentService.createStudent(this.studentForm.value).subscribe({
        next: (res) => console.log('Student created:', res),
        error: (err) => console.error('Error creating student:', err),
      });
    }
  }
}
