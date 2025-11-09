import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TeacherGuard } from './teacher-guard';
import { AuthService } from '../services/auth.service';

describe('TeacherGuard', () => {
  let guard: TeacherGuard;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TeacherGuard,
        { provide: AuthService, useValue: { getRole: () => 'teacher' } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    });
    guard = TestBed.inject(TeacherGuard);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow teacher user', () => {
    expect(guard.canActivate()).toBeTrue();
  });

  it('should redirect non-teacher user', () => {
    spyOn(authService, 'getRole').and.returnValue('student');
    expect(guard.canActivate()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
