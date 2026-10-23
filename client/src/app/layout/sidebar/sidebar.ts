import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, User } from '../../core/services/auth.service';

interface SideItem {
  label: string;
  route: string;
  icon: string;
}

export interface SidebarItem {
  label: string;
  route: string;
  icon: string;
  subMenu?: SideItem[];
  open?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
})
export class Sidebar implements OnInit {
  @Output() closeRequested = new EventEmitter<void>();

  menuItems: SidebarItem[] = [];

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    this.menuItems = this.getMenuForRole(this.auth.getUser()?.role || 'student');
    // Close the drawer (mobile) whenever navigation is triggered from the sidebar.
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.closeRequested.emit();
      }
    });
  }

  get user(): User | null {
    return this.auth.getUser();
  }

  get panelTitle(): string {
    switch (this.user?.role) {
      case 'admin':
        return 'Admin Panel';
      case 'teacher':
        return 'Lehrer Bereich';
      default:
        return 'Schüler Bereich';
    }
  }

  toggle(menu: SidebarItem) {
    this.menuItems.forEach((m) => {
      if (m !== menu) m.open = false;
    });
    menu.open = !menu.open;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  getMenuForRole(role: string): SidebarItem[] {
    const teaching: SidebarItem[] = [
      { label: 'Lehrer-Dashboard', route: '/teacher/dashboard', icon: 'dashboard' },
      { label: 'Meine Schüler', route: '/teacher/students', icon: 'school' },
    ];

    const menus: { [key: string]: SidebarItem[] } = {
      admin: [
        { label: 'Dashboard', route: '/admin/dashboard', icon: 'space_dashboard' },
        { label: 'Buchungen', route: '/admin/bookings', icon: 'request_quote' },
        {
          label: 'Verwaltung',
          route: '',
          icon: 'manage_accounts',
          subMenu: [
            { label: 'Benutzer', route: '/admin/users', icon: 'person' },
            { label: 'Benutzer anlegen', route: '/admin/create-user', icon: 'person_add' },
            { label: 'Kurse', route: '/admin/courses', icon: 'menu_book' },
            { label: 'Seiten & Inhalte', route: '/admin/pages', icon: 'description' },
          ],
        },
        {
          label: 'Lehre',
          route: '',
          icon: 'how_to_reg',
          subMenu: teaching,
        },
      ],
      teacher: [
        { label: 'Dashboard', route: '/teacher/dashboard', icon: 'space_dashboard' },
        {
          label: 'Verwaltung',
          route: '',
          icon: 'manage_accounts',
          subMenu: [{ label: 'Schüler', route: '/teacher/students', icon: 'school' }],
        },
      ],
      student: [{ label: 'Dashboard', route: '/student/dashboard', icon: 'space_dashboard' }],
    };

    return (menus[role] || []).map((item) => (item.subMenu ? { ...item, open: false } : item));
  }
}
