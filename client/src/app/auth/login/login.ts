import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  standalone: true,
  imports: [FormsModule, RouterLink, MatIconModule],
})
export class Login implements OnInit {
  credentials = {
    email: '',
    password: '',
    remember: false
  };
  role: string[] = [];
  error: string | null = null;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    // Already logged in -> go straight to the role home
    const user = this.authService.getUser();
    if (user) {
      this.router.navigate(this.homePathFor(user.role));
      return;
    }
    this.role = this.authService.getUserRoles();
  }

  login() {
    this.authService.login(this.credentials).subscribe({
      next: (user) => this.router.navigate(this.homePathFor(user.role)),
      error: (err) => this.error = err?.error?.message || 'Login failed',
    });
  }

  private homePathFor(role: string): string[] {
    switch (role) {
      case 'admin':
        return ['/admin', 'dashboard'];
      case 'teacher':
        return ['/teacher', 'dashboard'];
      default:
        return ['/student', 'dashboard'];
    }
  }

  // Carousel
  carouselImages: string[] = [
    '/assets/carousel/carousel1.jpg',
    '/assets/carousel/carousel2.jpg',
    '/assets/carousel/carousel3.jpg',
  ];
  currentImage = 0;
  i: any;
}
