import { Routes } from '@angular/router';
import { Home } from './home/home';
import { About } from './about/about';
import { Courses } from './courses/courses';
import { CourseDetail } from './course-detail/course-detail';
import { Login } from '../auth/login/login';
import { Contact } from './contact/contact';
import { Impressum } from './impressum/impressum';
import { Media } from './media/media';
import { EventDetail } from './event-detail/event-detail';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'about', component: About },
  { path: 'courses', component: Courses },
  { path: 'courses/:id', component: CourseDetail },
  { path: 'media', component: Media },
  { path: 'media/events/:slug', component: EventDetail },
  { path: 'impressum', component: Impressum },
  { path: 'contact', component: Contact },
  { path: 'login', component: Login },
];
