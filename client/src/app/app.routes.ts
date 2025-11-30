import { Routes } from '@angular/router';
import { NotFound } from './public/not-found/not-found';
import { RoleGuard } from './core/guards/role-guard';
import { AuthGuard } from './core/guards/auth-guard';
import { PublicLayout } from './layout/public-layout/public-layout';
import { DashboardLayout } from './layout/dashboard-layout/dashboard-layout';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./public/public.routes').then((m) => m.routes),
    component: PublicLayout,
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((m) => m.routes),
  },
  {
    path: 'admin',
    // canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.routes),
    component: DashboardLayout,
  },
  {
    path: 'teacher',
    // canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['teacher'] },
    loadChildren: () => import('./features/teacher/teacher.routes').then((m) => m.routes),
    component: DashboardLayout,
  },
  {
    path: 'student',
    // canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['student'] },
    loadChildren: () => import('./features/student/student.routes').then((m) => m.routes),
    component: DashboardLayout,
  },
  {
    path: '**',
    component: NotFound,
  },
];
