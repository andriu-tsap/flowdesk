import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Database } from './prisma';
import { BookingDto } from './dto';
import { Notifications, Mailer } from './notifications';
import { validSlot, warsawDateTime } from '../../../packages/domain';
@Injectable()
export class Bookings {
  constructor(
    private db: Database,
    private events: Notifications,
    private mail: Mailer,
  ) {}
  async slots(employeeId: string, serviceId: string, date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new BadRequestException('Invalid date');
    const service = await this.db.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) throw new NotFoundException();
    const bookings = await this.db.booking.findMany({
      where: {
        employeeId,
        status: 'CONFIRMED',
        startsAt: {
          gte: new Date(date),
          lt: new Date(new Date(date).getTime() + 86400000),
        },
      },
    });
    return Array.from({ length: 32 }, (_, i) => {
      const mins = 540 + i * 15;
      return warsawDateTime(
        date,
        `${Math.floor(mins / 60)
          .toString()
          .padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`,
      );
    }).filter((start) => {
      const a = new Date(start);
      const end = new Date(a.getTime() + service.duration * 60000);
      return (
        a > new Date() &&
        validSlot(start, service.duration) &&
        !bookings.some((b) => a < b.endsAt && b.startsAt < end)
      );
    });
  }
  async create(dto: BookingDto) {
    const startsAt = new Date(dto.startsAt);
    if (
      startsAt < new Date() ||
      startsAt > new Date(Date.now() + 180 * 86400000)
    )
      throw new BadRequestException(
        'Termin musi być w ciągu najbliższych 180 dni',
      );
    const service = await this.db.service.findUnique({
      where: { id: dto.serviceId },
    });
    const employee = await this.db.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!service || !employee) throw new NotFoundException();
    if (!validSlot(dto.startsAt, service.duration))
      throw new BadRequestException('Poza godzinami pracy lub podczas przerwy');
    const endsAt = new Date(startsAt.getTime() + service.duration * 60000);
    try {
      const booking = await this.db.$transaction(
        async (tx) => {
          const conflict = await tx.booking.findFirst({
            where: {
              employeeId: dto.employeeId,
              status: 'CONFIRMED',
              startsAt: { lt: endsAt },
              endsAt: { gt: startsAt },
            },
          });
          if (conflict) throw new ConflictException('Termin zajęty');
          const customer = await tx.customer.upsert({
            where: { email: dto.email.toLowerCase() },
            create: {
              email: dto.email.toLowerCase(),
              name: dto.name,
              phone: dto.phone || '',
            },
            update: {},
          });
          return tx.booking.create({
            data: {
              employeeId: dto.employeeId,
              serviceId: dto.serviceId,
              customerId: customer.id,
              startsAt,
              endsAt,
              price: service.price,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      this.events.changed();
      const emailSent = await this.mail.confirmation(dto.email, startsAt);
      return { id: booking.id, status: booking.status, emailSent };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2004', 'P2010', 'P2034', 'P2002'].includes(error.code)
      )
        throw new ConflictException('Termin został zajęty. Wybierz inny.');
      throw error;
    }
  }
}
