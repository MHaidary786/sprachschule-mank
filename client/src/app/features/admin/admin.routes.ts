import { Routes } from '@angular/router';
import { CreateUser } from './create-user/create-user';
import { Dashboard } from './dashboard/dashboard';
import { ManageUsers } from './manage-users/manage-users';
import { Courses } from './courses/courses';
import { AdminPages } from './pages/pages';
import { BookingRequests } from './bookings/bookings';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  { path: 'dashboard', component: Dashboard },
  // Sidebar + "Benutzer anlegen" link point here; keep "create" as an alias.
  { path: 'create', component: CreateUser },
  { path: 'create-user', component: CreateUser },
  { path: 'users', component: ManageUsers },
  { path: 'courses', component: Courses },
  { path: 'pages', component: AdminPages },
  { path: 'bookings', component: BookingRequests },
];
