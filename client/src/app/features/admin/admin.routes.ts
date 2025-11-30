import { Routes } from '@angular/router';
import { CreateUser } from './create-user/create-user';
import { Dashboard } from './dashboard/dashboard';
import { ManageUsers } from './manage-users/manage-users';
import { Courses } from './courses/courses';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  
  { path: 'dashboard', component: Dashboard },
  { path: 'create', component: CreateUser },
  { path: 'users', component: ManageUsers},
  { path: 'courses', component: Courses }
];

