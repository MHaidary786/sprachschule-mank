import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { Home } from './features/home/home';
import { About } from './features/admin/about/about';
import { Courses } from './features/admin/courses/courses';
import { NotFound } from './not-found/not-found';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        component: Home
      },
      {
        path: 'courses/:pageId',
        component: Courses,
      },
      {
        path: 'about',
        component: About
      },
    ]
  },
  {
    path: '**',
    component: NotFound
  },
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full',
  }
  // {
  //   path: '',
  //   component: MainLayout,
  //   children: [
  //     {
  //       path: '',
  //       redirectTo: 'admin/dashboard',
  //       pathMatch: 'full',
  //     },
  //     {
  //       path: 'admin',
  //       loadChildren: () => import('./features/admin/admin.routes').then((m) => m.AdminRoutes),
  //     },
  //   ],
  // },
];
