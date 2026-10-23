import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PageService, Page, PageInput } from '../../../core/services/page.service';

@Component({
  selector: 'app-admin-pages',
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <main class="p-4 sm:p-6">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="page-title text-gray-900">Seiten &amp; Inhalte</h2>
          <p class="mt-1 text-sm text-gray-500">Steuert die Inhalte der öffentlichen Website (Startseite, Über mich, Medien, Impressum, …).</p>
        </div>
        <button (click)="startCreate()" class="btn-primary btn-md shrink-0">
          <mat-icon class="text-lg">add</mat-icon>
          <span>Seite erstellen</span>
        </button>
      </div>

      @if (error) {
        <div class="alert-error mb-4">{{ error }}</div>
      }
      @if (success) {
        <div class="alert-success mb-4">{{ success }}</div>
      }

      <div class="card overflow-hidden">
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th class="w-24">Reihenfolge</th>
                <th>Titel</th>
                <th>Slug</th>
                <th>In Nav?</th>
                <th class="text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              @for (page of pages; track page.id) {
                <tr>
                  <td class="text-gray-500">{{ page.order }}</td>
                  <td class="font-medium text-gray-800">{{ page.title }}</td>
                  <td class="text-gray-500 font-mono text-xs">/{{ page.slug }}</td>
                  <td>
                    @if (page.show_in_nav) { <span class="text-green-600">✓</span> } @else { <span class="text-gray-400">–</span> }
                  </td>
                  <td class="text-right whitespace-nowrap">
                    <button (click)="startEdit(page)" class="text-sm font-medium text-brand-600 hover:underline mr-3">Bearbeiten</button>
                    <button (click)="remove(page)" class="text-sm font-medium text-red-600 hover:underline">Löschen</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="p-4 text-center text-gray-500">Noch keine Seiten vorhanden.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Editor modal (create + edit) -->
      @if (editing) {
        <div class="fixed inset-0 z-50 overflow-x-hidden overflow-y-auto bg-black/40">
          <div class="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
            <div class="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl bg-white shadow-xl sm:rounded-xl">
              <div class="flex items-start justify-between gap-4 border-b border-gray-200 p-4 sm:p-5">
                <h3 class="text-lg font-bold text-gray-900 sm:text-xl">
                  {{ isNew ? 'Neue Seite erstellen' : 'Seite bearbeiten: ' + (editing.title || '') }}
                </h3>
                <button type="button" class="btn-ghost p-1.5" (click)="cancel()" aria-label="Schließen">
                  <mat-icon class="w-5 h-5">close</mat-icon>
                </button>
              </div>
              <form (ngSubmit)="save(form)" #pageForm="ngForm" class="flex flex-col overflow-hidden">
                <div class="space-y-4 overflow-y-auto p-4 sm:p-6">
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label class="label">Titel</label>
                      <input name="title" [(ngModel)]="form.title" required class="input" />
                    </div>
                    <div>
                      <label class="label">Slug (URL)</label>
                      <input name="slug" [(ngModel)]="form.slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*"
                        class="input font-mono text-sm" placeholder="z.B. home" />
                      <p class="mt-1 text-xs text-gray-500">Nur Kleinbuchstaben, Zahlen und Bindestriche.</p>
                    </div>
                  </div>
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label class="label">Reihenfolge</label>
                      <input name="order" type="number" min="0" [(ngModel)]="form.order" class="input" />
                    </div>
                    <div class="flex items-end pb-1">
                      <label class="flex cursor-pointer items-center gap-2.5">
                        <input type="checkbox" name="showInNav" [(ngModel)]="form.showInNav" class="checkbox" />
                        <span class="text-sm text-gray-700">In Navigation anzeigen</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label class="label">Inhalt (HTML)</label>
                    <textarea name="content" [(ngModel)]="form.content" required rows="14"
                      class="input font-mono text-sm"
                      placeholder="HTML-Inhalt der Seite…"></textarea>
                    <p class="mt-1 text-xs text-gray-500">Wird als HTML ausgegeben (Tailwind-Klassen). routerLink-/href-Links funktionieren automatisch.</p>
                  </div>
                  @if (editError) {
                    <div class="alert-error">{{ editError }}</div>
                  }
                </div>
                <div class="flex flex-col-reverse gap-3 border-t border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                  <button type="button" (click)="cancel()" class="btn-secondary btn-md w-full sm:w-auto">Abbrechen</button>
                  <button type="submit" [disabled]="!pageForm.valid" class="btn-primary btn-md w-full sm:w-auto">
                    Speichern
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
    </main>
  `,
})
export class AdminPages implements OnInit {
  pages: Page[] = [];
  error = '';
  success = '';

  editing: Page | null = null;
  isNew = false;
  editError = '';
  form: { title: string; slug: string; content: string; showInNav: boolean; order: number } = {
    title: '',
    slug: '',
    content: '',
    showInNav: true,
    order: 0,
  };

  constructor(private pageService: PageService) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.error = '';
    this.success = '';
    this.pageService.listPages().subscribe({
      next: (data) => {
        this.pages = [...data].sort((a, b) => a.order - b.order || a.id - b.id);
      },
      error: () => (this.error = 'Seiten konnten nicht geladen werden.'),
    });
  }

  startCreate(): void {
    this.isNew = true;
    this.editing = { id: 0, title: '', slug: '', content: '', show_in_nav: true, order: this.pages.length + 1 };
    this.form = { title: '', slug: '', content: '', showInNav: true, order: this.pages.length + 1 };
    this.editError = '';
  }

  startEdit(page: Page): void {
    this.isNew = false;
    this.editing = page;
    this.form = {
      title: page.title,
      slug: page.slug,
      content: page.content,
      showInNav: page.show_in_nav,
      order: page.order,
    };
    this.editError = '';
  }

  cancel(): void {
    this.editing = null;
    this.editError = '';
  }

  save(input: { title: string; slug: string; content: string; showInNav: boolean; order: number }): void {
    if (!this.editing) return;
    const payload: PageInput = {
      title: input.title,
      slug: input.slug,
      content: input.content,
      show_in_nav: input.showInNav,
      order: input.order ?? 0,
    };
    const sub = this.isNew
      ? this.pageService.createPage(payload)
      : this.pageService.updatePage(this.editing.id, payload);

    sub.subscribe({
      next: () => {
        this.success = this.isNew ? 'Seite erstellt.' : 'Seite aktualisiert.';
        this.cancel();
        this.load();
      },
      error: (err) => {
        this.editError =
          err?.error?.details
            ? err.error.details.map((d: { field: string; message: string }) => `${d.field}: ${d.message}`).join(', ')
            : err?.error?.message || 'Speichern fehlgeschlagen';
      },
    });
  }

  remove(page: Page): void {
    if (!confirm(`Seite "${page.title}" wirklich löschen?`)) return;
    this.pageService.deletePage(page.id).subscribe({
      next: () => this.load(),
      error: (err) => (this.error = err?.error?.message || 'Löschen fehlgeschlagen'),
    });
  }
}
