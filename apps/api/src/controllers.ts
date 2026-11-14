import { readFileSync } from 'node:fs';
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import { Database } from './prisma';
import { AuthGuard, Roles, type AuthRequest } from './auth';
import { Bookings } from './booking';
import { BookingDto, LeadDto, MoveLeadDto, CancelDto, InvoiceDto } from './dto';
import { Notifications } from './notifications';
@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(
    private db: Database,
    private bookings: Bookings,
  ) {}
  @Get('catalog') async catalog() {
    return {
      employees: await this.db.employee.findMany(),
      services: await this.db.service.findMany(),
    };
  }
  @Get('slots') slots(
    @Query('employeeId') employee: string,
    @Query('serviceId') service: string,
    @Query('date') date: string,
  ) {
    return this.bookings.slots(employee, service, date);
  }
  @Post('bookings') book(@Body() dto: BookingDto) {
    return this.bookings.create(dto);
  }
  @Post('leads') lead(@Body() dto: LeadDto) {
    return this.db.lead.create({ data: dto });
  }
}
@ApiTags('staff')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Roles('admin', 'pracownik')
@Controller()
export class StaffController {
  constructor(
    private db: Database,
    private events: Notifications,
  ) {}
  @Get('dashboard') async dashboard(@Req() req: AuthRequest) {
    const bookings = await this.db.booking.findMany({
      where:
        req.user.role === 'pracownik'
          ? { employeeId: req.user.employeeId || 'unassigned' }
          : {},
      orderBy: { startsAt: 'asc' },
    });
    const ids = [...new Set(bookings.map((b) => b.customerId))];
    return {
      employees: await this.db.employee.findMany(),
      services: await this.db.service.findMany(),
      bookings,
      customers: await this.db.customer.findMany({
        where: req.user.role === 'pracownik' ? { id: { in: ids } } : {},
      }),
      leads: await this.db.lead.findMany({ orderBy: { createdAt: 'desc' } }),
      invoices: await this.db.invoice.findMany({
        where: req.user.role === 'pracownik' ? { customerId: { in: ids } } : {},
      }),
    };
  }
  @Patch('bookings/:id') async cancel(
    @Param('id') id: string,
    @Body() dto: CancelDto,
    @Req() req: AuthRequest,
  ) {
    const booking = await this.db.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException();
    if (
      req.user.role === 'pracownik' &&
      booking.employeeId !== req.user.employeeId
    )
      throw new ForbiddenException();
    const result = await this.db.booking.update({
      where: { id },
      data: { status: dto.status },
    });
    this.events.changed();
    return result;
  }
  @Patch('leads/:id') move(@Param('id') id: string, @Body() dto: MoveLeadDto) {
    return this.db.lead.update({ where: { id }, data: dto });
  }
  @Roles('admin') @Post('invoices') async invoice(@Body() dto: InvoiceDto) {
    return this.db.invoice.create({
      data: {
        ...dto,
        number: `DEMO/${new Date().getFullYear()}/${crypto.randomUUID().slice(0, 8)}`,
      },
    });
  }
  @Get('invoices/:id/pdf') async pdf(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    const invoice = await this.db.invoice.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!invoice) throw new NotFoundException();
    if (
      req.user.role === 'pracownik' &&
      !(await this.db.booking.findFirst({
        where: {
          customerId: invoice.customerId,
          employeeId: req.user.employeeId || 'unassigned',
        },
      }))
    )
      throw new ForbiddenException();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="flowdesk-${invoice.id}.pdf"`,
    );
    const doc = new PDFDocument({ margin: 50 });
    doc.font(
      Buffer.from(
        readFileSync('apps/web/public/fonts/dejavu.txt', 'utf8'),
        'base64',
      ),
    );
    doc.pipe(res);
    doc.fontSize(25).text('FlowDesk / DEMO');
    doc
      .moveDown()
      .fontSize(12)
      .text(`Dokument ${invoice.number}`)
      .text(`Klient: ${invoice.customer.name}`)
      .text(`Kwota: ${(invoice.amount / 100).toFixed(2)} PLN`)
      .moveDown()
      .text('Projekt koncepcyjny - nie jest dokumentem ksiegowym.');
    doc.end();
  }
}
@ApiTags('client')
@UseGuards(AuthGuard)
@Roles('klient')
@Controller('me')
export class ClientController {
  constructor(private db: Database) {}
  @Get('bookings') bookings(@Req() req: AuthRequest) {
    return this.db.booking.findMany({
      where: { customerId: req.user.customerId || 'unassigned' },
    });
  }
}
@Controller('health')
export class HealthController {
  constructor(private db: Database) {}
  @Get() async health() {
    await this.db.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }
}
