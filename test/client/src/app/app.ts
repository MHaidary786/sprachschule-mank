import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  // templateUrl: './app.html',
  template : `
    <main>
      <router-outlet></router-outlet>
    </main>
    `,
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('client');
}
