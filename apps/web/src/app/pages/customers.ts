import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '../store';
import { price } from '../../../../../packages/domain';
@Component({
  standalone: true,
  imports: [FormsModule],
  template: `<div class="page-heading">
      <div>
        <p class="eyebrow">TWOJE RELACJE</p>
        <h1>Klienci</h1>
        <p class="muted">Kontekst każdej rozmowy w jednym miejscu.</p>
      </div>
      <button class="secondary" (click)="store.exportCustomers()">
        ↓ Eksport CSV
      </button>
    </div>
    <label class="search-field"
      >Szukaj klienta<input
        type="search"
        [ngModel]="query()"
        (ngModelChange)="query.set($event)"
        placeholder="Imię lub e-mail"
    /></label>
    <section class="panel">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Klient</th>
              <th>E-mail</th>
              <th>Telefon</th>
              <th>Wizyty</th>
              <th>Historia</th>
            </tr>
          </thead>
          <tbody>
            @for (c of filtered(); track c.id) {
              <tr>
                <td>
                  <span class="avatar tiny">{{ c.name.slice(0, 1) }}</span>{{
                    c.name
                  }}
                </td>
                <td>{{ c.email }}</td>
                <td>{{ c.phone || '—' }}</td>
                <td>{{ history(c.id).length }}</td>
                <td>
                  <button class="text-button" (click)="selected.set(c.id)">
                    Zobacz historię
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5">Nie znaleziono klientów.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
    @if (selected()) {
      <section class="panel history">
        <div class="panel-title">
          <h2>Historia klienta</h2>
          <button class="text-button" (click)="selected.set('')">
            Zamknij
          </button>
        </div>
        @for (b of history(selected()); track b.id) {
          <div class="history-item">
            <span>{{ date(b.startsAt) }}</span><strong>{{
              service(b.serviceId)
            }}</strong
            ><span>{{ money(b.price) }}</span
            ><span>{{
              b.status === 'CONFIRMED' ? 'Potwierdzona' : 'Anulowana'
            }}</span>
          </div>
        } @empty {
          <p>Brak rezerwacji.</p>
        }
      </section>
    }`,
})
export class Customers implements OnInit {
  store = inject(Store);
  query = signal('');
  selected = signal('');
  money = price;
  ngOnInit() {
    void this.store.load();
  }
  filtered() {
    const q = this.query().toLowerCase();
    return this.store
      .data()
      .customers.filter((c) =>
        (c.name + ' ' + c.email).toLowerCase().includes(q),
      );
  }
  history(id: string) {
    return this.store.data().bookings.filter((b) => b.customerId === id);
  }
  service(id: string) {
    return this.store.data().services.find((s) => s.id === id)?.name;
  }
  date(s: string) {
    return new Intl.DateTimeFormat('pl-PL', {
      timeZone: 'Europe/Warsaw',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(s));
  }
}
