import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard } from './features/admin/dashboard/dashboard';
import { CreateUser } from './features/admin/create-user/create-user';
import { App } from './app';
import { Home } from './features/home/home';

const routes: Routes = [
    // { path: '', redirectTo: 'admin/dashboard', pathMatch: 'full' },

    { path: '', component: Home, title: 'Home' },  // Default route to Home component
    { path: 'admin', loadChildren: () => import('./features/admin/admin-module').then(m => m.AdminModule), title: 'Admin' // Admin routes
        // , canActivate: [AuthGuard, AdminGuard]
    },
    { path: 'create', loadComponent: () => import('./features/admin/create-user/create-user').then(m => m.CreateUser), title: 'Create User' }, // Create User route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
