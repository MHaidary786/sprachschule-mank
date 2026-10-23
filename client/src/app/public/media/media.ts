import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventService, PublicEvent } from '../../core/services/event.service';

@Component({
  selector: 'app-media',
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './media.html',
  styleUrl: './media.css',
})
export class Media implements OnInit {
  events: PublicEvent[] = [];
  loading = true;
  error = '';

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.eventService.getEvents().subscribe({
      next: (events) => {
        this.events = events;
        this.loading = false;
      },
      error: () => {
        this.error = 'Die Events konnten nicht geladen werden.';
        this.loading = false;
      },
    });
  }

  // Cover shown on the card: explicit cover, else first photo, else null (placeholder).
  coverImage(event: PublicEvent): string | null {
    return event.cover_image || event.photos[0]?.url || null;
  }
}
