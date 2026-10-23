import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventService, PublicEvent } from '../../core/services/event.service';

@Component({
  selector: 'app-event-detail',
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.css',
})
export class EventDetail {
  event: PublicEvent | null = null;
  loading = true;
  notFound = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug') ?? '';
      this.loading = true;
      this.notFound = false;
      this.event = null;

      this.eventService.getEventBySlug(slug).subscribe({
        next: (event) => {
          this.event = event;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.notFound = err?.status === 404;
          this.error = 'Das Event konnte nicht geladen werden.';
        },
      });
    });
  }
}
