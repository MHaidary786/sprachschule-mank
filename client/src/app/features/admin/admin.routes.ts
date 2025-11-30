import { Routes } from '@angular/router';
import { CreateUser } from './create-user/create-user';
import { Dashboard } from './dashboard/dashboard';
import { ManageUsers } from './manage-users/manage-users';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'create', component: CreateUser },
  { path: 'manageusers', component: ManageUsers}
];

