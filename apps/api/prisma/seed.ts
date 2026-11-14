import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
const db = new PrismaClient();
async function main() {
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12)
    throw new Error('Set ADMIN_PASSWORD with at least 12 characters');
  await db.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@example.com' },
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      name: 'Administrator',
      role: 'admin',
      passwordHash: await hash(process.env.ADMIN_PASSWORD, 12),
    },
    update: {},
  });
  for (const [id, name, color] of [
    ['e1', 'Anna Nowak', '#5863d9'],
    ['e2', 'Marek Lis', '#d08c44'],
    ['e3', 'Julia Wilk', '#329b87'],
  ])
    await db.employee.upsert({
      where: { id },
      create: { id, name, color },
      update: {},
    });
  for (const service of [
    { id: 's1', name: 'Konsultacja projektowa', duration: 60, price: 18000 },
    { id: 's2', name: 'Warsztat indywidualny', duration: 90, price: 28000 },
    { id: 's3', name: 'Szybka konsultacja', duration: 30, price: 10000 },
  ])
    await db.service.upsert({
      where: { id: service.id },
      create: service,
      update: {},
    });
  await db.customer.upsert({
    where: { email: 'alicja@example.com' },
    create: {
      id: 'c1',
      name: 'Alicja Demo',
      email: 'alicja@example.com',
      phone: '000 000 001',
    },
    update: {},
  });
  await db.invoice.upsert({
    where: { number: 'DEMO/001' },
    create: {
      number: 'DEMO/001',
      customerId: 'c1',
      amount: 18000,
      status: 'DRAFT',
    },
    update: {},
  });
  await db.lead.upsert({
    where: { id: 'l1' },
    create: {
      id: 'l1',
      name: 'Studio Przykład',
      email: 'studio@example.com',
      value: 240000,
      note: 'Dane demonstracyjne',
    },
    update: {},
  });
}
main().finally(() => db.$disconnect());
