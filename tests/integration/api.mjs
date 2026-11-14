import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
const base = 'http://localhost:3001/api';
const origin = process.env.FRONTEND_URL;
const db = new PrismaClient();
const request = (path, body, token, cookie) =>
  fetch(base + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
for (let i = 0; i < 30; i++) {
  try {
    if ((await request('/health')).ok) break;
  } catch {
    /* API may still be starting. */
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
const response = await request('/auth/login', {
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
});
assert.equal(response.status, 201);
const admin = await response.json();
const cookie = response.headers.get('set-cookie').split(';')[0];
assert.equal(
  (await request('/dashboard', null, admin.accessToken)).status,
  200,
);
assert.equal((await request('/dashboard')).status, 401);
for (const role of ['pracownik', 'klient'])
  await db.user.create({
    data: {
      email: `${role}@example.com`,
      name: role,
      role,
      employeeId: role === 'pracownik' ? 'e2' : null,
      passwordHash: await hash(process.env.ADMIN_PASSWORD, 10),
    },
  });
const client = await (
  await request('/auth/login', {
    email: 'klient@example.com',
    password: process.env.ADMIN_PASSWORD,
  })
).json();
assert.equal(
  (await request('/dashboard', null, client.accessToken)).status,
  403,
);
const date = new Date();
date.setDate(date.getDate() + 7);
if (date.getDay() === 0) date.setDate(date.getDate() + 1);
date.setUTCHours(9, 0, 0, 0);
const input = {
  employeeId: 'e1',
  serviceId: 's1',
  startsAt: date.toISOString(),
  name: 'Test rezerwacji',
  email: 'booking@example.com',
  phone: '',
};
const concurrent = await Promise.all([
  request('/public/bookings', input),
  request('/public/bookings', input),
]);
assert.deepEqual(concurrent.map((r) => r.status).sort(), [201, 409]);
const booking = await concurrent.find((r) => r.status === 201).json();
const worker = await (
  await request('/auth/login', {
    email: 'pracownik@example.com',
    password: process.env.ADMIN_PASSWORD,
  })
).json();
const unauthorizedCancel = await fetch(base + `/bookings/${booking.id}`, {
  method: 'PATCH',
  headers: {
    Origin: origin,
    'Content-Type': 'application/json',
    Authorization: `Bearer ${worker.accessToken}`,
  },
  body: JSON.stringify({ status: 'CANCELLED' }),
});
assert.equal(unauthorizedCancel.status, 403);
const rotation = await request('/auth/refresh', {}, null, cookie);
assert.equal(rotation.status, 201);
const nextCookie = rotation.headers.get('set-cookie').split(';')[0];
assert.equal((await request('/auth/refresh', {}, null, cookie)).status, 401);
assert.equal(
  (await request('/auth/refresh', {}, null, nextCookie)).status,
  401,
);
await db.$disconnect();
console.log(
  'API integration passed: authentication, role isolation, concurrent booking, refresh rotation and reuse rejection.',
);
