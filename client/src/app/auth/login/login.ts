import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  standalone: true,
  imports: [FormsModule, RouterLink],
})
export class Login implements OnInit {
  credentials = {
    email: '',
    password: '',
    remember: false
  };
  role: string[] = [];

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.role = this.authService.getUserRoles();
  }

  login() {
    console.log(this.credentials); /// Debugging line
    this.authService.login(this.credentials).subscribe({
      next: () => this.router.navigate(['/admin/dashboard']),
      error: (err) => console.error(err),
    });
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
