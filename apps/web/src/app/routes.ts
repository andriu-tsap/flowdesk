import type { Routes } from '@angular/router';
import { authGuard } from './auth';
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login').then((m) => m.Login),
  },
  {
    path: 'rezerwacja',
    loadComponent: () => import('./pages/booking').then((m) => m.BookingPage),
  },
  {
    path: 'widget',
    loadComponent: () => import('./pages/widget').then((m) => m.Widget),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'kalendarz',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/calendar').then((m) => m.Calendar),
  },
  {
    path: 'crm',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/crm').then((m) => m.Crm),
  },
  {
    path: 'klienci',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/customers').then((m) => m.Customers),
  },
  {
    path: 'dokumenty',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/invoices').then((m) => m.Invoices),
  },
  { path: '**', redirectTo: '' },
];
