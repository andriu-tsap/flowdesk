import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '../store';
import { today } from '../demo';
@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `<div class="page-heading">
      <div>
        <p class="eyebrow">REZERWACJE</p>
        <h1>Kalendarz</h1>
        <p class="muted">Każda usługa ma swoje miejsce.</p>
      </div>
      <a class="primary" routerLink="/rezerwacja">+ Nowa rezerwacja</a>
    </div>
    <div class="calendar-toolbar">
      <label
        >Dzień<input
          type="date"
          [ngModel]="date()"
          (ngModelChange)="date.set($event)" /></label
      ><span class="muted"
        >Godziny 09:00–17:00 · przerwa 12:00–13:00 · niedziele wolne</span
      >
    </div>
    <div class="calendar-scroll">
      <section class="calendar">
        <div class="calendar-head">
          <span>Godzina</span>
          @for (e of store.data().employees; track e.id) {
            <strong><i [style.background]="e.color"></i>{{ e.name }}</strong>
          }
        </div>
        @for (hour of hours; track hour) {
          <div class="calendar-row">
            <span>{{ hour }}:00</span>
            @for (e of store.data().employees; track e.id) {
              <div [class.break-cell]="hour === 12">
                @if (hour === 12) {
                  <small>Przerwa</small>
                }
                @for (b of bookings(e.id, hour); track b.id) {
                  <article
                    class="appointment"
                    [style.border-left-color]="e.color"
                  >
                    <strong>{{ service(b.serviceId) }}</strong><span>{{
                      customer(b.customerId)
                    }}</span
                    ><small>{{ time(b.startsAt) }} – {{ time(b.endsAt) }}</small
                    ><button class="text-button" (click)="cancel(b.id)">
                      Anuluj
                    </button>
                  </article>
                }
              </div>
            }
          </div>
        }
      </section>
    </div>
    <p role="status">{{ message() }}</p>`,
})
export class Calendar implements OnInit {
  store = inject(Store);
  date = signal(today());
  message = signal('');
  hours = [9, 10, 11, 12, 13, 14, 15, 16];
  ngOnInit() {
    void this.store.load();
  }
  bookings(id: string, hour: number) {
    return this.store.data().bookings.filter(
      (b) =>
        b.status === 'CONFIRMED' &&
        b.employeeId === id &&
        new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Europe/Warsaw',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(b.startsAt)) === this.date() &&
        Number(this.time(b.startsAt).split(':')[0]) === hour,
    );
  }
  time(s: string) {
    return new Intl.DateTimeFormat('pl-PL', {
      timeZone: 'Europe/Warsaw',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(s));
  }
  service(id: string) {
    return this.store.data().services.find((s) => s.id === id)?.name;
  }
  customer(id: string) {
    return this.store.data().customers.find((c) => c.id === id)?.name;
  }
  async cancel(id: string) {
    try {
      await this.store.cancel(id);
      this.message.set('Rezerwacja anulowana.');
    } catch {
      this.message.set('Nie udało się anulować rezerwacji.');
    }
  }
}
