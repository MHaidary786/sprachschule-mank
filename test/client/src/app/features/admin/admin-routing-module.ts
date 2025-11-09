import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateUser } from './create-user/create-user';

const routes: Routes = [
  { path: 'create', component: CreateUser },
  // add other admin routes here
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
