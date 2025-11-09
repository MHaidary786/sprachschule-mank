import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  // templateUrl: './app.html',
  template : `
    <main>
      <router-outlet></router-outlet>
    </main>
    `,
  standalone: false,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('client');
}
