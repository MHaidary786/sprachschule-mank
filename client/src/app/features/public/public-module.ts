import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicRoutingModule } from './public-routing-module';
import { Home } from './home/home';
import { Contact } from './contact/contact';
import { Courses } from './courses/courses';
import { Login } from './login/login';

@NgModule({
  declarations: [
    Home,
    Contact,
    Courses,
    Login
  ],
  imports: [
    CommonModule,
    PublicRoutingModule
  ]
})
export class PublicModule { }
