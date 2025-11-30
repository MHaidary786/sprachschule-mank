import { Routes } from '@angular/router';
import { Home } from './home/home';
import { About } from './about/about';
import { Courses } from './courses/courses';
import { Login } from '../auth/login/login';
import { Contact } from './contact/contact';
import { Impressum } from './impressum/impressum';
import { Media } from './media/media';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'about', component: About },
  { path: 'courses', component: Courses },
  { path: 'courses/:id', component: Courses },
  { path: 'media', component: Media },
  { path: 'impressum', component: Impressum },
  { path: 'contact', component: Contact },
  { path: 'login', component: Login },
];
