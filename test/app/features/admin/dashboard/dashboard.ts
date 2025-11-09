import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule],
  template : `
    <main>
      <h2>Admin Dashboard</h2>
      <p>Welcome to the admin dashboard!</p>
      <a routerLink="/">Create Student</a>
      </main>
      `,
  styleUrl: './dashboard.css',
})
export class Dashboard {

}
