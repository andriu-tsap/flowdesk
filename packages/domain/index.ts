export type Stage = 'nowy' | 'kontakt' | 'oferta' | 'umowa';
export type Role = 'admin' | 'pracownik' | 'klient';
export type Employee = { id: string; name: string; color: string };
export type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
};
export type Booking = {
  id: string;
  employeeId: string;
  serviceId: string;
  customerId: string;
  startsAt: string;
  endsAt: string;
  status: 'CONFIRMED' | 'CANCELLED';
  price: number;
};
export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
};
export type Lead = {
  id: string;
  name: string;
  email: string;
  value: number;
  stage: Stage;
  note: string;
};
export type Invoice = {
  id: string;
  number: string;
  customerId: string;
  amount: number;
  status: 'PAID' | 'DRAFT';
  date: string;
};
export type Snapshot = {
  employees: Employee[];
  services: Service[];
  bookings: Booking[];
  customers: Customer[];
  leads: Lead[];
  invoices: Invoice[];
};
export function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
) {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}
export function validSlot(start: string, duration: number) {
  const date = new Date(start);
  if (!Number.isFinite(date.getTime()) || duration <= 0 || duration > 240)
    return false;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value);
  const day = parts.find((p) => p.type === 'weekday')?.value;
  const from = hour * 60 + minute;
  const to = from + duration;
  return (
    day !== 'Sun' &&
    from >= 540 &&
    to <= 1020 &&
    minute % 15 === 0 &&
    !(from < 780 && to > 720)
  );
}
export function available(
  snapshot: Snapshot,
  employeeId: string,
  start: string,
  duration: number,
) {
  const end = new Date(
    new Date(start).getTime() + duration * 60000,
  ).toISOString();
  return (
    validSlot(start, duration) &&
    !snapshot.bookings.some(
      (b) =>
        b.status === 'CONFIRMED' &&
        b.employeeId === employeeId &&
        overlaps(start, end, b.startsAt, b.endsAt),
    )
  );
}
export function csv(rows: string[][]) {
  return (
    '\uFEFF' +
    rows
      .map((row) =>
        row
          .map(
            (value) =>
              '"' +
              String(value)
                .replace(/^[=+@-]/, "'$&")
                .replaceAll('"', '""') +
              '"',
          )
          .join(';'),
      )
      .join('\r\n')
  );
}
export const price = (grosz: number) =>
  new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(grosz / 100);
// Date-only input -> Warsaw instant, including DST. No server-local timezone assumptions.
export function warsawDateTime(date: string, time: string) {
  const probe = new Date(`${date}T${time}:00Z`);
  const values = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw',
    timeZoneName: 'shortOffset',
  }).formatToParts(probe);
  const offset = Number(
    (values.find((v) => v.type === 'timeZoneName')?.value || 'GMT+1').replace(
      'GMT',
      '',
    ),
  );
  return new Date(probe.getTime() - offset * 3600000).toISOString();
}
