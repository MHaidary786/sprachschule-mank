import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { CreateUser } from './create-user/create-user';
import { Dashboard } from './dashboard/dashboard';

const adminRoutes: Routes = [
  { path: 'create-user', component: CreateUser },
  { path: 'dashboard', component: Dashboard, title: 'Dashboard' },

];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(adminRoutes),
  ]
})
export class AdminModule {}
