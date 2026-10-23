import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PageService, Page } from '../../core/services/page.service';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  path: string;
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatButtonModule],
})
export class Navbar implements OnInit {
  navItems: NavItem[] = [];
  mobileOpen = false;

  constructor(private pageService: PageService, private auth: AuthService, private router: Router) {}

  toggleMobileMenu(): void {
    this.mobileOpen = !this.mobileOpen;
  }

  closeMobileMenu(): void {
    this.mobileOpen = false;
  }

  get user() {
    return this.auth.getUser();
  }

  ngOnInit(): void {
    // Build the nav from admin-managed pages (show_in_nav) + a Courses link.
    this.pageService.getPublicPages().subscribe({
      next: (pages: Page[]) => {
        const navPages = pages
          .filter((p) => p.show_in_nav)
          .sort((a, b) => a.order - b.order)
          .map((p) => ({ label: p.title, path: `/${p.slug}` }));
        this.navItems = [
          { label: 'Home', path: '/' },
          { label: 'Courses', path: '/courses' },
          ...navPages.filter((n) => n.path !== '/courses'),
        ];
      },
      // If the API is down, fall back to a sensible static nav.
      error: () => {
        this.navItems = [
          { label: 'Home', path: '/' },
          { label: 'Courses', path: '/courses' },
          { label: 'Media', path: '/media' },
          { label: 'About Me', path: '/about' },
          { label: 'Contact', path: '/contact' },
        ];
      },
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  roleHome(role: string): string {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      default:
        return '/student/dashboard';
    }
  }
}
