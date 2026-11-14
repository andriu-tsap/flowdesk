import { describe, it, expect } from 'vitest';
import {
  overlaps,
  validSlot,
  warsawDateTime,
  csv,
  available,
  type Snapshot,
} from '../../packages/domain';
describe('Booking rules', () => {
  it('allows adjacent bookings but rejects overlaps', () => {
    expect(
      overlaps(
        '2026-11-16T09:00Z',
        '2026-11-16T10:00Z',
        '2026-11-16T10:00Z',
        '2026-11-16T11:00Z',
      ),
    ).toBe(false);
    expect(
      overlaps(
        '2026-11-16T09:00Z',
        '2026-11-16T10:00Z',
        '2026-11-16T09:30Z',
        '2026-11-16T11:00Z',
      ),
    ).toBe(true);
  });
  it('rejects Sunday, break and outside working hours', () => {
    expect(validSlot(warsawDateTime('2026-11-15', '10:00'), 60)).toBe(false);
    expect(validSlot(warsawDateTime('2026-11-16', '11:30'), 60)).toBe(false);
    expect(validSlot(warsawDateTime('2026-11-16', '16:30'), 60)).toBe(false);
    expect(validSlot(warsawDateTime('2026-11-16', '13:00'), 60)).toBe(true);
  });
  it('handles Warsaw daylight saving', () => {
    expect(warsawDateTime('2026-07-01', '09:00')).toContain('07:00');
    expect(warsawDateTime('2026-12-01', '09:00')).toContain('08:00');
  });
  it('blocks CSV formula injection and escapes quotes', () => {
    const output = csv([['=SUM(1)', 'a"b']]);
    expect(output).toContain("'=SUM(1)");
    expect(output).toContain('a""b');
  });
  it('does not treat cancelled appointments as occupied', () => {
    const s = {
      bookings: [
        {
          status: 'CANCELLED',
          employeeId: 'e1',
          startsAt: '2026-11-16T08:00Z',
          endsAt: '2026-11-16T09:00Z',
        },
      ],
    } as Snapshot;
    expect(available(s, 'e1', '2026-11-16T08:00Z', 60)).toBe(true);
  });
});
