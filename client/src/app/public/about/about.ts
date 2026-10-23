import { Component } from '@angular/core';
import { PageContent } from '../../shared/components/page-content/page-content';

@Component({
  selector: 'app-about',
  imports: [PageContent],
  template: `<app-page-content slug="about"></app-page-content>`,
})
export class About {}
