import type { Snapshot } from '../../../../packages/domain';
import { warsawDateTime } from '../../../../packages/domain';
export const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
export function demoData(): Snapshot {
  const date = today();
  return {
    employees: [
      { id: 'e1', name: 'Anna Nowak', color: '#5863d9' },
      { id: 'e2', name: 'Marek Lis', color: '#d08c44' },
      { id: 'e3', name: 'Julia Wilk', color: '#329b87' },
    ],
    services: [
      { id: 's1', name: 'Konsultacja projektowa', duration: 60, price: 18000 },
      { id: 's2', name: 'Warsztat indywidualny', duration: 90, price: 28000 },
      { id: 's3', name: 'Szybka konsultacja', duration: 30, price: 10000 },
    ],
    customers: [
      {
        id: 'c1',
        name: 'Alicja Demo',
        email: 'alicja@example.com',
        phone: '000 000 001',
      },
      {
        id: 'c2',
        name: 'Tomasz Przykładowy',
        email: 'tomasz@example.com',
        phone: '000 000 002',
      },
      {
        id: 'c3',
        name: 'Klara Testowa',
        email: 'klara@example.com',
        phone: '000 000 003',
      },
    ],
    bookings: [
      {
        id: 'b1',
        employeeId: 'e1',
        serviceId: 's1',
        customerId: 'c1',
        startsAt: warsawDateTime(date, '09:00'),
        endsAt: warsawDateTime(date, '10:00'),
        status: 'CONFIRMED',
        price: 18000,
      },
      {
        id: 'b2',
        employeeId: 'e2',
        serviceId: 's2',
        customerId: 'c2',
        startsAt: warsawDateTime(date, '10:00'),
        endsAt: warsawDateTime(date, '11:30'),
        status: 'CONFIRMED',
        price: 28000,
      },
      {
        id: 'b3',
        employeeId: 'e3',
        serviceId: 's3',
        customerId: 'c3',
        startsAt: warsawDateTime(date, '14:00'),
        endsAt: warsawDateTime(date, '14:30'),
        status: 'CONFIRMED',
        price: 10000,
      },
    ],
    leads: [
      {
        id: 'l1',
        name: 'Studio Przykład',
        email: 'studio@example.com',
        value: 240000,
        stage: 'nowy',
        note: 'Konsultacja przestrzeni biurowej',
      },
      {
        id: 'l2',
        name: 'Ogród Demo',
        email: 'ogrod@example.com',
        value: 180000,
        stage: 'nowy',
        note: 'Warsztaty dla zespołu',
      },
      {
        id: 'l3',
        name: 'Pracownia Koncept',
        email: 'pracownia@example.com',
        value: 420000,
        stage: 'kontakt',
        note: 'Zapytanie o pakiet usług',
      },
      {
        id: 'l4',
        name: 'Biuro Fikcyjne',
        email: 'biuro@example.com',
        value: 320000,
        stage: 'oferta',
        note: 'Oferta wysłana — dane demonstracyjne',
      },
      {
        id: 'l5',
        name: 'Atelier Test',
        email: 'atelier@example.com',
        value: 560000,
        stage: 'umowa',
        note: 'Przykładowy etap umowy',
      },
    ],
    invoices: [
      {
        id: 'i1',
        number: 'DEMO/2026/001',
        customerId: 'c1',
        amount: 18000,
        status: 'PAID',
        date: date,
      },
      {
        id: 'i2',
        number: 'DEMO/2026/002',
        customerId: 'c2',
        amount: 28000,
        status: 'DRAFT',
        date: date,
      },
    ],
  };
}
