import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { App } from './app';
import { CreateUser } from './features/admin/create-user/create-user';

@NgModule({
  declarations: [App, CreateUser],
  imports: [BrowserModule, FormsModule, HttpClient],
  bootstrap: [App]
})
export class AppModule {}
