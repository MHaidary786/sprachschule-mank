import { Routes } from '@angular/router';
import { Dashboard } from './features/admin/dashboard/dashboard';
import { CreateUser } from './features/admin/create-user/create-user';
import { AuthGuard } from './core/guards/auth-guard';
import { AdminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
    { path: 'dashboard', component: Dashboard, title: 'Dashboard' },
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'admin', loadChildren: () => import('./features/admin/admin-module').then(m => m.AdminModule), title: 'Admin'
        // , canActivate: [AuthGuard, AdminGuard]
    },
];
