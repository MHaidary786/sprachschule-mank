import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { CreateStudentComponent } from './create-student/create-student';

const adminRoutes: Routes = [
  { path: 'create-student', component: CreateStudentComponent },
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(adminRoutes),
  ]
})
export class AdminModule {}
