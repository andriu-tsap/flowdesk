import { Component, inject, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '../store';
import { price } from '../../../../../packages/domain';
@Component({
  standalone: true,
  imports: [RouterLink],
  template: `<div class="page-heading">
      <div>
        <p class="eyebrow">TWÓJ DZIEŃ W SKRÓCIE</p>
        <h1>Dzień dobry, Andrii <span class="wave">✳</span></h1>
        <p class="muted">Spokojny start. Wszystko, co ważne, jest tutaj.</p>
      </div>
      <a class="primary" routerLink="/rezerwacja">+ Nowa rezerwacja</a>
    </div>
    <div class="data-note">
      DEMO · Wszystkie osoby, wartości i zdarzenia są przykładowe.
    </div>
    <div class="stats">
      <article>
        <span>Przychód z dokumentów</span
        ><strong>{{ money(store.revenue()) }}</strong
        ><small>Opłacone dokumenty demo</small
        ><span class="stat-icon purple">↗</span>
      </article>
      <article>
        <span>Obłożenie dnia</span><strong>{{ occupancy() }}%</strong
        ><small>{{ active().length }} aktywne rezerwacje</small
        ><span class="stat-icon blue">▦</span>
      </article>
      <article>
        <span>Otwarte szanse</span><strong>{{ openLeads().length }}</strong
        ><small>{{ money(pipeline()) }} w lejku demo</small
        ><span class="stat-icon orange">⊞</span>
      </article>
      <article>
        <span>Konwersja leadów</span
        ><strong>{{ conversion() }}<em>%</em></strong
        ><small>Umowy / wszystkie leady demo</small
        ><span class="stat-icon green">◎</span>
      </article>
    </div>
    <div class="dashboard-grid">
      <section class="panel">
        <div class="panel-title">
          <div>
            <h2>Wartość usług</h2>
            <p>Aktywne rezerwacje według rodzaju usługi</p>
          </div>
          <span class="tag">PLN</span>
        </div>
        <div
          class="bar-chart"
          role="img"
          aria-label="Wykres wartości rezerwacji według usług"
        >
          @for (service of store.data().services; track service.id) {
            <div class="bar-column">
              <span>{{ money(serviceValue(service.id)) }}</span>
              <div class="bar-track">
                <div
                  [style.height.%]="
                    Math.max(3, (serviceValue(service.id) / maxService()) * 100)
                  "
                ></div>
              </div>
              <small>{{ service.name }}</small>
            </div>
          }
        </div>
      </section>
      <section class="panel">
        <div class="panel-title">
          <div>
            <h2>Lejek sprzedaży</h2>
            <p>Od pierwszego kontaktu do umowy</p>
          </div>
          <a routerLink="/crm" aria-label="Otwórz CRM">↗</a>
        </div>
        <div class="funnel">
          @for (stage of store.stages; track stage; let i = $index) {
            <div>
              <span class="stage-dot" [class]="'stage-dot stage-' + i"></span
              ><span>{{ stage }}</span
              ><strong>{{ countStage(stage) }}</strong>
              <div class="funnel-track">
                <i
                  [style.width.%]="
                    (countStage(stage) / store.data().leads.length) * 100
                  "
                ></i>
              </div>
            </div>
          }
        </div>
        <div class="insight">
          ✦ <span>Przesuń lead w CRM, aby zobaczyć zmianę wskaźników.</span>
        </div>
      </section>
    </div>
    <section class="panel schedule">
      <div class="panel-title">
        <div>
          <h2>Plan dnia</h2>
          <p>{{ store.date() }} · Europe/Warsaw</p>
        </div>
        <a routerLink="/kalendarz">Otwórz kalendarz ↗</a>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Godzina</th>
              <th>Klient</th>
              <th>Usługa</th>
              <th>Pracownik</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @for (b of active(); track b.id) {
              <tr>
                <td class="time">{{ time(b.startsAt) }}</td>
                <td>{{ customer(b.customerId) }}</td>
                <td>{{ service(b.serviceId) }}</td>
                <td>
                  <span class="avatar tiny">{{
                    employee(b.employeeId).slice(0, 1)
                  }}</span>{{ employee(b.employeeId) }}
                </td>
                <td><span class="badge">Potwierdzona</span></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>`,
})
export class Dashboard implements OnInit {
  store = inject(Store);
  occupancy = computed(() =>
    Math.round(
      (this.active()
        .filter((b) => b.startsAt.slice(0, 10) === this.store.date())
        .reduce(
          (sum, b) =>
            sum +
            (new Date(b.endsAt).getTime() - new Date(b.startsAt).getTime()) /
              60000,
          0,
        ) /
        (Math.max(1, this.store.data().employees.length) * 420)) *
        100,
    ),
  );
  money = price;
  Math = Math;
  active = computed(() =>
    this.store.data().bookings.filter((b) => b.status === 'CONFIRMED'),
  );
  openLeads = computed(() =>
    this.store.data().leads.filter((l) => l.stage !== 'umowa'),
  );
  pipeline = computed(() =>
    this.openLeads().reduce((sum, l) => sum + l.value, 0),
  );
  conversion = computed(() =>
    Math.round(
      (this.countStage('umowa') / Math.max(1, this.store.data().leads.length)) *
        100,
    ),
  );
  time(s: string) {
    return new Intl.DateTimeFormat('pl-PL', {
      timeZone: 'Europe/Warsaw',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(s));
  }
  ngOnInit() {
    void this.store.load();
  }
  countStage(stage: string) {
    return this.store.data().leads.filter((l) => l.stage === stage).length;
  }
  serviceValue(id: string) {
    return this.active()
      .filter((b) => b.serviceId === id)
      .reduce((s, b) => s + b.price, 0);
  }
  maxService() {
    return Math.max(
      1,
      ...this.store.data().services.map((s) => this.serviceValue(s.id)),
    );
  }
  customer(id: string) {
    return (
      this.store.data().customers.find((c) => c.id === id)?.name || 'Klient'
    );
  }
  service(id: string) {
    return this.store.data().services.find((c) => c.id === id)?.name || '';
  }
  employee(id: string) {
    return this.store.data().employees.find((c) => c.id === id)?.name || '';
  }
}
