import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app-module';
import { HttpClient } from '@angular/common/http';

platformBrowser().bootstrapModule(AppModule, {
  
  ngZoneEventCoalescing: true,
})
  .catch(err => console.error(err));
