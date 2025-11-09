import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterModule],
  // templateUrl: './app.html',
  template : `
    <main>
      <section>
        <h1>Hello</h1>
      </section>
      <router-outlet></router-outlet>
    </main>
  `,
  //
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('client');
}
