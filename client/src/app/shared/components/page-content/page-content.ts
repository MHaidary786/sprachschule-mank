import { Component, OnInit, Input, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { PageService } from '../../../core/services/page.service';

/**
 * Renders the admin-managed content for a page (by slug) using [innerHTML].
 * Used by the public pages (home, about, media, impressum, contact) so that
 * everything an admin edits in the admin panel is reflected on the live site.
 */
@Component({
  selector: 'app-page-content',
  template: `
    @if (loading) {
      <div class="py-24 text-center text-gray-400">Seite wird geladen…</div>
    } @else if (error) {
      <div class="py-24 text-center text-gray-500">{{ error }}</div>
    } @else if (content !== null) {
      <div [innerHTML]="content"></div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class PageContent implements OnInit {
  @Input({ required: true }) slug = '';

  loading = true;
  error = '';
  content: string | null = null;

  constructor(private pageService: PageService, private router: Router) {}

  ngOnInit(): void {
    this.pageService.getPublicPage(this.slug).subscribe({
      next: (page) => {
        this.content = page.content;
        this.loading = false;
      },
      error: (err) => {
        this.error =
          err?.status === 404
            ? 'Diese Seite wurde nicht gefunden.'
            : 'Seite konnte nicht geladen werden.';
        this.loading = false;
      },
    });
  }

  // [innerHTML] content is not compiled by Angular, so a routerLink / href
  // anchor inside admin-authored HTML is inert. Intercept clicks and route them
  // so the admin can drop working links into the page content.
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const target = (event.target as HTMLElement | null)?.closest('a[href], a[routerLink]');
    if (!target) return;
    const routerLink = target.getAttribute('routerLink');
    const href = target.getAttribute('href');
    const path = routerLink || href;
    if (!path || path === '#' || path.startsWith('http')) return;
    event.preventDefault();
    this.router.navigateByUrl(path);
  }
}
