import { FormsModule } from '@angular/forms';
import { Component, inject, signal, OnInit } from '@angular/core';
import { Store } from '../store';
import { price } from '../../../../../packages/domain';
@Component({
  standalone: true,
  imports: [FormsModule],
  template: `<div class="page-heading">
      <div>
        <p class="eyebrow">PORZĄDEK W DOKUMENTACH</p>
        <h1>Dokumenty</h1>
        <p class="muted">
          Przykładowe oferty i dokumenty rozliczeniowe. Nie są dokumentami
          księgowymi.
        </p>
      </div>
    </div>
    <form class="panel lead-form" (ngSubmit)="create()">
      <label
        >Klient<select name="customer" [(ngModel)]="customerId" required>
          <option value="">Wybierz klienta</option>
          @for (c of store.data().customers; track c.id) {
            <option [value]="c.id">{{ c.name }}</option>
          }
        </select></label
      ><label
        >Kwota oferty (PLN)<input
          name="amount"
          type="number"
          min="1"
          [(ngModel)]="amount"
          required /></label
      ><button class="primary" [disabled]="!customerId || amount < 1">
        Utwórz ofertę
      </button>
    </form>
    <section class="panel">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Numer</th>
              <th>Klient</th>
              <th>Data</th>
              <th>Kwota</th>
              <th>Status</th>
              <th>PDF</th>
            </tr>
          </thead>
          <tbody>
            @for (i of store.data().invoices; track i.id) {
              <tr>
                <td>
                  <strong>{{ i.number }}</strong>
                </td>
                <td>{{ customer(i.customerId) }}</td>
                <td>{{ i.date.slice(0, 10) }}</td>
                <td>{{ money(i.amount) }}</td>
                <td>
                  <span class="badge" [class.draft]="i.status === 'DRAFT'">{{
                    i.status === 'PAID' ? 'Opłacony — demo' : 'Szkic'
                  }}</span>
                </td>
                <td>
                  <button
                    class="secondary"
                    [disabled]="busy() === i.id"
                    (click)="download(i.id)"
                  >
                    ↓ Pobierz PDF
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
    <p role="status">{{ message() }}</p>`,
})
export class Invoices implements OnInit {
  customerId = '';
  amount = 180;
  async create() {
    try {
      await this.store.createInvoice(
        this.customerId,
        Math.round(this.amount * 100),
      );
      this.message.set('Oferta utworzona.');
    } catch {
      this.message.set('Nie udało się utworzyć oferty.');
    }
  }
  store = inject(Store);
  money = price;
  message = signal('');
  busy = signal('');
  ngOnInit() {
    void this.store.load();
  }
  customer(id: string) {
    return this.store.data().customers.find((c) => c.id === id)?.name;
  }
  async download(id: string) {
    this.busy.set(id);
    try {
      await this.store.pdf(id);
      this.message.set('PDF gotowy.');
    } catch {
      this.message.set('Nie udało się wygenerować PDF.');
    } finally {
      this.busy.set('');
    }
  }
}
