import { Routes } from '@angular/router';
import { NotFound } from './public/not-found/not-found';
import { roleGuard } from './core/guards/role-guard';
import { authGuard } from './core/guards/auth-guard';
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
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.routes),
    component: DashboardLayout,
  },
  {
    path: 'teacher',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['teacher', 'admin'] },
    loadChildren: () => import('./features/teacher/teacher.routes').then((m) => m.routes),
    component: DashboardLayout,
  },
  {
    path: 'student',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
    loadChildren: () => import('./features/student/student.routes').then((m) => m.routes),
    component: DashboardLayout,
  },
  {
    path: '**',
    component: NotFound,
  },
];
