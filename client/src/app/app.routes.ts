import { Routes } from '@angular/router';
import { App } from './app';

export const routes: Routes = [
  // {
  //   path: 'users',
  //   loadChildren: () =>
  //     import('./users/users.routes').then(m => m.routes)
  // }
  {
    path: '',
    component: App,
  },
];
