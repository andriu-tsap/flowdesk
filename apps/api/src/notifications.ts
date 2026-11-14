import { Injectable, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import nodemailer from 'nodemailer';
import type { Identity } from './auth';
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  },
})
export class Notifications implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  constructor(private jwt: JwtService) {}
  async handleConnection(socket: Socket) {
    try {
      const user = await this.jwt.verifyAsync<Identity>(
        String(socket.handshake.auth.token || ''),
      );
      if (!['admin', 'pracownik'].includes(user.role)) {
        socket.disconnect();
        return;
      }
      socket.join('staff');
      const expiry =
        (user as Identity & { exp: number }).exp * 1000 - Date.now();
      const timer = setTimeout(() => socket.disconnect(), Math.max(0, expiry));
      socket.on('disconnect', () => clearTimeout(timer));
    } catch {
      socket.disconnect();
    }
  }
  changed() {
    this.server
      ?.to('staff')
      .emit('booking.updated', { at: new Date().toISOString() });
  }
}
@Injectable()
export class Mailer {
  private logger = new Logger(Mailer.name);
  async confirmation(email: string, start: Date) {
    if (!process.env.SMTP_HOST) {
      this.logger.warn('SMTP is not configured; confirmation not sent');
      return false;
    }
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === '465',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
    try {
      await transport.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'FlowDesk — potwierdzenie rezerwacji',
        text: `Rezerwacja potwierdzona: ${new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', dateStyle: 'long', timeStyle: 'short' }).format(start)}. Projekt koncepcyjny — fikcyjna marka.`,
      });
      return true;
    } catch {
      this.logger.error('Email delivery failed');
      return false;
    }
  }
}
