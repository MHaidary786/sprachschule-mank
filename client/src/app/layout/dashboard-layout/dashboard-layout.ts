import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Navbar } from "../navbar/navbar";
import { DashboardNavbar } from "../dashboard-navbar/dashboard-navbar";

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, Sidebar, Navbar, DashboardNavbar],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css',
})
export class DashboardLayout {

}
