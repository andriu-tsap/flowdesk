import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '../store';
import { today } from '../demo';
import { price } from '../../../../../packages/domain';
@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `<div class="public-page">
    <header>
      <a class="brand" routerLink="/"
        ><span class="brand-icon">f</span>flowdesk.</a
      ><a routerLink="/login">Panel firmy ↗</a>
    </header>
    <div class="booking-layout">
      <section>
        <span class="demo-pill">PRACOWNIA FORMA · FIKCYJNA MARKA</span>
        <h1>Zrób miejsce<br />na dobry pomysł.</h1>
        <p>Wybierz usługę i wygodny termin. Resztę uporządkujemy za Ciebie.</p>
        <div class="booking-info">
          <h2>Jak to działa?</h2>
          <p>01 · Wybierz usługę i specjalistę</p>
          <p>02 · Zarezerwuj wolny termin</p>
          <p>03 · Zobacz potwierdzenie</p>
        </div>
        <p class="muted">
          {{
            store.demo
              ? 'DEMO: rezerwacja zostaje w pamięci przeglądarki. Nie wysyłamy e-maili.'
              : 'Potwierdzenie otrzymasz na podany adres e-mail.'
          }}
        </p>
      </section>
      <section class="panel booking-form">
        <h2>Umów spotkanie</h2>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label
            >Usługa<select formControlName="serviceId" (change)="refresh()">
              @for (s of store.data().services; track s.id) {
                <option [value]="s.id">
                  {{ s.name }} · {{ s.duration }} min · {{ money(s.price) }}
                </option>
              }
            </select></label
          >
          <div class="form-grid">
            <label
              >Specjalista<select
                formControlName="employeeId"
                (change)="refresh()"
              >
                @for (e of store.data().employees; track e.id) {
                  <option [value]="e.id">{{ e.name }}</option>
                }
              </select></label
            ><label
              >Data<input
                type="date"
                formControlName="date"
                [min]="minDate"
                (change)="refresh()"
            /></label>
          </div>
          <fieldset>
            <legend>Dostępne godziny</legend>
            <div class="slots">
              @for (slot of slots(); track slot) {
                <button
                  type="button"
                  [class.selected]="selected() === slot"
                  [attr.aria-pressed]="selected() === slot"
                  (click)="selected.set(slot)"
                >
                  {{ time(slot) }}
                </button>
              } @empty {
                <p>Brak wolnych terminów. Wybierz inny dzień.</p>
              }
            </div>
          </fieldset>
          <label
            >Imię i nazwisko<input formControlName="name" autocomplete="name"
          /></label>
          <div class="form-grid">
            <label
              >E-mail<input
                formControlName="email"
                type="email"
                autocomplete="email" /></label
            ><label
              >Telefon (opcjonalnie)<input
                formControlName="phone"
                type="tel"
                autocomplete="tel"
            /></label>
          </div>
          <label class="check"
            ><input type="checkbox" formControlName="consent" />Zgadzam się na
            obsługę tego zapytania.</label
          ><button
            class="primary full"
            [disabled]="form.invalid || !selected() || busy()"
          >
            {{ busy() ? 'Zapisywanie…' : 'Potwierdź rezerwację' }} →
          </button>
          <p role="status" [class.error]="!done()">{{ message() }}</p>
        </form>
      </section>
    </div>
    <footer>
      Projekt koncepcyjny do portfolio – fikcyjna marka · Andrii Tsap
    </footer>
  </div>`,
})
export class BookingPage implements OnInit {
  store = inject(Store);
  fb = inject(FormBuilder);
  money = price;
  minDate = today();
  slots = signal<string[]>([]);
  selected = signal('');
  message = signal('');
  busy = signal(false);
  done = signal(false);
  form = this.fb.nonNullable.group({
    serviceId: ['s1', Validators.required],
    employeeId: ['e1', Validators.required],
    date: [today(), Validators.required],
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    consent: [false, Validators.requiredTrue],
  });
  async ngOnInit() {
    await this.store.publicData();
    this.form.patchValue({
      serviceId: this.store.data().services[0]?.id || '',
      employeeId: this.store.data().employees[0]?.id || '',
    });
    await this.refresh();
  }
  async refresh() {
    this.selected.set('');
    const v = this.form.getRawValue();
    try {
      this.slots.set(await this.store.slots(v.employeeId, v.serviceId, v.date));
    } catch {
      this.message.set('Nie można pobrać terminów.');
    }
  }
  time(s: string) {
    return new Intl.DateTimeFormat('pl-PL', {
      timeZone: 'Europe/Warsaw',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(s));
  }
  async submit() {
    if (this.form.invalid || !this.selected()) return;
    this.busy.set(true);
    try {
      await this.store.book({
        ...this.form.getRawValue(),
        startsAt: this.selected(),
      });
      this.done.set(true);
      this.message.set(
        this.store.demo
          ? 'Rezerwacja demonstracyjna potwierdzona. E-mail nie został wysłany.'
          : 'Rezerwacja potwierdzona.',
      );
      await this.refresh();
    } catch (e) {
      this.done.set(false);
      this.message.set(
        e instanceof Error ? e.message : 'Nie udało się zapisać rezerwacji.',
      );
      await this.refresh();
    } finally {
      this.busy.set(false);
    }
  }
}
