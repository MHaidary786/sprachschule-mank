import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardNavbar } from './dashboard-navbar';

describe('DashboardNavbar', () => {
  let component: DashboardNavbar;
  let fixture: ComponentFixture<DashboardNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardNavbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardNavbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
