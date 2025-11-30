import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

interface sideItem {
  label: string;
  route: string;
}

export interface SidebarItem {
  label: string;
  route: string;
  subMenu?: sideItem[];
  open?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
})
export class Sidebar implements OnInit {
  menuItems: SidebarItem[] = [];

  constructor(private router: Router) {}
  ngOnInit(): void {
    this.menuItems = this.getMenuForRole('admin');
  }

  toggle(menu: SidebarItem) {
  this.menuItems.forEach(m => {
    if (m !== menu) m.open = false;
  });
  menu.open = !menu.open;
}


  getMenuForRole(role: string): SidebarItem[] {
    const menus: { [key: string]: SidebarItem[] } = {
      admin: [
        { label: 'Dashboard', route: '/admin/dashboard' },
        {
          label: 'Verwaltung',
          route: '',
          subMenu: [
            { label: 'Benutzer', route: '/admin/users' },
            { label: 'Kurse', route: '/admin/courses' },
          ],
        },
      ],
      teacher: [
        { label: 'Dashboard', route: '/teacher/dashboard' },
        {
          label: 'Verwaltung',
          route: '',
          subMenu: [{ label: 'Schüler', route: '/teacher/my-students' }],
        },
      ],
      student: [{ label: 'Dashboard', route: '/student/dashboard' }],
    };

    // Add open=false to any item with a submenu
    return (menus[role] || []).map((item) => (item.subMenu ? { ...item, open: false } : item));
  }
}
