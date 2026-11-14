import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { io, type Socket } from 'socket.io-client';
import { Auth } from './auth';
import { config } from './config';
import { demoData, today } from './demo';
import {
  available,
  warsawDateTime,
  csv,
  type Snapshot,
  type Lead,
  type Stage,
  type Booking,
} from '../../../../packages/domain';
@Injectable({ providedIn: 'root' })
export class Store {
  private http = inject(HttpClient);
  private auth = inject(Auth);
  data = signal<Snapshot>(
    config.demo
      ? demoData()
      : {
          employees: [],
          services: [],
          bookings: [],
          customers: [],
          leads: [],
          invoices: [],
        },
  );
  notice = signal('');
  loading = signal(false);
  private socket?: Socket;
  readonly demo = config.demo;
  stages: Stage[] = ['nowy', 'kontakt', 'oferta', 'umowa'];
  date = signal(today());
  revenue = computed(() =>
    this.data()
      .invoices.filter((i) => i.status === 'PAID')
      .reduce((s, i) => s + i.amount, 0),
  );
  async load() {
    if (config.demo) return;
    this.loading.set(true);
    try {
      this.data.set(
        await firstValueFrom(
          this.http.get<Snapshot>(`${config.apiUrl}/dashboard`),
        ),
      );
      if (!this.socket) {
        this.socket = io(config.apiUrl.replace(/\/api$/, ''), {
          auth: { token: this.auth.token() },
        });
        this.socket.on('booking.updated', () => {
          this.notice.set('Nowa zmiana w rezerwacjach.');
          void this.reloadData();
        });
      }
    } catch {
      this.notice.set('Nie udało się pobrać danych.');
    } finally {
      this.loading.set(false);
    }
  }
  private async reloadData() {
    this.data.set(
      await firstValueFrom(
        this.http.get<Snapshot>(`${config.apiUrl}/dashboard`),
      ),
    );
  }
  async publicData() {
    if (!config.demo) {
      const data = await firstValueFrom(
        this.http.get<Pick<Snapshot, 'employees' | 'services'>>(
          `${config.apiUrl}/public/catalog`,
        ),
      );
      this.data.update((s) => ({
        ...s,
        ...data,
        bookings: [],
        customers: [],
        leads: [],
        invoices: [],
      }));
    }
  }
  async slots(employeeId: string, serviceId: string, date: string) {
    if (!config.demo)
      return firstValueFrom(
        this.http.get<string[]>(`${config.apiUrl}/public/slots`, {
          params: { employeeId, serviceId, date },
        }),
      );
    const service = this.data().services.find((s) => s.id === serviceId);
    if (!service) return [];
    return Array.from({ length: 32 }, (_, i) => {
      const mins = 540 + i * 15;
      return warsawDateTime(
        date,
        `${Math.floor(mins / 60)
          .toString()
          .padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`,
      );
    }).filter(
      (start) =>
        new Date(start) > new Date() &&
        available(this.data(), employeeId, start, service.duration),
    );
  }
  async book(input: {
    employeeId: string;
    serviceId: string;
    startsAt: string;
    name: string;
    email: string;
    phone: string;
  }) {
    if (!config.demo) {
      await firstValueFrom(
        this.http.post(`${config.apiUrl}/public/bookings`, input),
      );
      return;
    }
    const service = this.data().services.find((s) => s.id === input.serviceId)!;
    if (
      !available(
        this.data(),
        input.employeeId,
        input.startsAt,
        service.duration,
      )
    )
      throw new Error('Ten termin jest już zajęty. Wybierz inny.');
    const customerId = crypto.randomUUID();
    const booking: Booking = {
      id: crypto.randomUUID(),
      employeeId: input.employeeId,
      serviceId: input.serviceId,
      customerId,
      startsAt: input.startsAt,
      endsAt: new Date(
        new Date(input.startsAt).getTime() + service.duration * 60000,
      ).toISOString(),
      status: 'CONFIRMED',
      price: service.price,
    };
    this.data.update((s) => ({
      ...s,
      customers: [
        ...s.customers,
        {
          id: customerId,
          name: input.name,
          email: input.email,
          phone: input.phone,
        },
      ],
      bookings: [...s.bookings, booking],
    }));
    this.notice.set('Dodano rezerwację demonstracyjną.');
  }
  async cancel(id: string) {
    if (!config.demo)
      await firstValueFrom(
        this.http.patch(`${config.apiUrl}/bookings/${id}`, {
          status: 'CANCELLED',
        }),
      );
    this.data.update((s) => ({
      ...s,
      bookings: s.bookings.map((b) =>
        b.id === id ? { ...b, status: 'CANCELLED' } : b,
      ),
    }));
    this.notice.set('Rezerwacja anulowana.');
  }
  async moveLead(id: string, stage: Stage) {
    if (!config.demo)
      await firstValueFrom(
        this.http.patch(`${config.apiUrl}/leads/${id}`, { stage }),
      );
    this.data.update((s) => ({
      ...s,
      leads: s.leads.map((l) => (l.id === id ? { ...l, stage } : l)),
    }));
  }
  async addLead(input: Omit<Lead, 'id' | 'stage'>) {
    if (!config.demo) {
      const lead = await firstValueFrom(
        this.http.post<Lead>(`${config.apiUrl}/public/leads`, input),
      );
      this.data.update((s) => ({ ...s, leads: [...s.leads, lead] }));
      return;
    }
    this.data.update((s) => ({
      ...s,
      leads: [...s.leads, { ...input, id: crypto.randomUUID(), stage: 'nowy' }],
    }));
  }
  exportCustomers() {
    const text = csv([
      ['Imię', 'E-mail', 'Telefon'],
      ...this.data().customers.map((c) => [c.name, c.email, c.phone]),
    ]);
    const url = URL.createObjectURL(
      new Blob([text], { type: 'text/csv;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowdesk-klienci-demo.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  async createInvoice(customerId: string, amount: number) {
    if (!customerId || !Number.isInteger(amount) || amount <= 0)
      throw new Error('Nieprawidłowa kwota');
    const invoice = config.demo
      ? {
          id: crypto.randomUUID(),
          number: `DEMO/${new Date().getFullYear()}/${this.data().invoices.length + 1}`,
          customerId,
          amount,
          status: 'DRAFT' as const,
          date: new Date().toISOString(),
        }
      : await firstValueFrom(
          this.http.post<Snapshot['invoices'][number]>(
            `${config.apiUrl}/invoices`,
            { customerId, amount },
          ),
        );
    this.data.update((s) => ({ ...s, invoices: [...s.invoices, invoice] }));
  }
  async pdf(id: string) {
    const invoice = this.data().invoices.find((i) => i.id === id)!;
    const customer = this.data().customers.find(
      (c) => c.id === invoice.customerId,
    )!;
    if (!config.demo) {
      const blob = await firstValueFrom(
        this.http.get(`${config.apiUrl}/invoices/${id}/pdf`, {
          responseType: 'blob',
        }),
      );
      this.download(blob, `${invoice.number.replaceAll('/', '-')}.pdf`);
      return;
    }
    const { jsPDF } = await import('jspdf');
    const font = await fetch('fonts/dejavu.txt').then((r) => {
      if (!r.ok) throw new Error('Font unavailable');
      return r.text();
    });
    const doc = new jsPDF();
    doc.addFileToVFS('DejaVu.ttf', font);
    doc.addFont('DejaVu.ttf', 'DejaVu', 'normal');
    doc.setFont('DejaVu');
    doc.setFontSize(24);
    doc.text('FlowDesk / DEMO', 20, 25);
    doc.setFontSize(12);
    doc.text(
      [
        `Dokument koncepcyjny ${invoice.number}`,
        `Klient: ${customer.name}`,
        `Data: ${invoice.date}`,
        `Kwota: ${(invoice.amount / 100).toFixed(2)} PLN`,
        'To nie jest dokument księgowy.',
        'Fikcyjna marka - portfolio Andrii Tsap.',
      ],
      20,
      45,
    );
    doc.save('flowdesk-oferta-demo.pdf');
  }
  private download(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
