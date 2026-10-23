import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AdminBookingService, BookingRequest } from '../../../core/services/admin-booking.service';

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

@Component({
  selector: 'app-admin-bookings',
  imports: [CommonModule, MatIconModule],
  templateUrl: './bookings.html',
})
export class BookingRequests implements OnInit {
  tabs: { value: Filter; label: string }[] = [
    { value: 'pending', label: 'Offen' },
    { value: 'approved', label: 'Bestätigt' },
    { value: 'rejected', label: 'Abgelehnt' },
    { value: 'all', label: 'Alle' },
  ];

  status: Filter = 'pending';
  bookings: BookingRequest[] = [];
  pendingCount = 0;
  loading = true;
  error = '';
  success = '';
  busy: number | null = null;

  constructor(private bookingsService: AdminBookingService) {}

  ngOnInit(): void {
    this.load();
  }

  setFilter(filter: Filter): void {
    if (filter === this.status) return;
    this.status = filter;
    this.error = '';
    this.success = '';
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.error = '';
    const status = this.status === 'all' ? undefined : this.status;
    this.bookingsService.list(status).subscribe({
      next: (data) => {
        this.bookings = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Buchungsanfragen konnten nicht geladen werden.';
      },
    });

    // Keep the "Offen" count fresh regardless of the active tab.
    this.bookingsService.list('pending').subscribe({
      next: (data) => (this.pendingCount = data.length),
      error: () => {},
    });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'approved':
        return 'Bestätigt';
      case 'rejected':
        return 'Abgelehnt';
      default:
        return 'Offen';
    }
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'badge bg-green-100 text-green-800';
      case 'rejected':
        return 'badge bg-red-100 text-red-800';
      default:
        return 'badge bg-amber-100 text-amber-800';
    }
  }

  approve(booking: BookingRequest): void {
    const msg = `Anfrage von ${booking.name} wirklich bestätigen?\n\nDabei wird ein Student-Konto angelegt und die Person zum Kurs "${booking.course_title}" zugewiesen.`;
    if (!confirm(msg)) return;
    this.busy = booking.id;
    this.bookingsService.approve(booking.id).subscribe({
      next: () => {
        this.busy = null;
        this.success = `Anfrage von ${booking.name} wurde bestätigt.`;
        this.load();
      },
      error: (err) => {
        this.busy = null;
        this.error =
          err?.status === 409
            ? 'Diese Anfrage wurde bereits bestätigt.'
            : err?.error?.message || 'Bestätigen fehlgeschlagen.';
      },
    });
  }

  reject(booking: BookingRequest): void {
    const note = prompt(
      `Anfrage von ${booking.name} ablehnen.\n\nOptionale kurze Begründung (wird gespeichert):`,
    );
    if (note === null) return; // user cancelled
    this.busy = booking.id;
    this.bookingsService.reject(booking.id, note.trim() || undefined).subscribe({
      next: () => {
        this.busy = null;
        this.success = `Anfrage von ${booking.name} wurde abgelehnt.`;
        this.load();
      },
      error: (err) => {
        this.busy = null;
        this.error =
          err?.status === 409
            ? 'Diese Anfrage wurde bereits bestätigt und kann nicht mehr abgelehnt werden.'
            : err?.error?.message || 'Ablehnen fehlgeschlagen.';
      },
    });
  }
}
