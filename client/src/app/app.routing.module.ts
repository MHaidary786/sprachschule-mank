import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard'; // Adjust the path as necessary
import { AdminGuard } from './core/guards/admin-guard'; // Adjust the path as necessary
import { StudentGuard } from './core/guards/student-guard';
import { TeacherGuard } from './core/guards/teacher-guard';

const routes: Routes = [
  { path: '', loadChildren: () => import('./features/public/public-module').then(m => m.PublicModule) },
  { path: 'student', loadChildren: () => import('./features/student/student-module').then(m => m.StudentModule), canActivate: [AuthGuard, StudentGuard] },
  { path: 'teacher', loadChildren: () => import('./features/teacher/teacher-module').then(m => m.TeacherModule), canActivate: [AuthGuard, TeacherGuard] },
  { path: 'admin', loadChildren: () => import('./features/admin/admin-module').then(m => m.AdminModule), canActivate: [AuthGuard, AdminGuard] },
  { path: '**', redirectTo: '' }
];

