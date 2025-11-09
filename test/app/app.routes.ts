import { Routes } from '@angular/router';
import { CreateStudentComponent } from './features/admin/create-student/create-student';
import { Dashboard } from './features/admin/dashboard/dashboard';

const routeConfig: Routes = [
  { path: '', component: CreateStudentComponent, title: 'Create Student' },
  { path: 'dashboard', component: Dashboard, title: 'Dashboard' }
];

export default routeConfig;