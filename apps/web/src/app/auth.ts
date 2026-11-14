import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, type HttpInterceptorFn } from '@angular/common/http';
import { Router, type CanActivateFn } from '@angular/router';
import { firstValueFrom, catchError, switchMap, throwError, from } from 'rxjs';
import { config } from './config';
import type { Role } from '../../../../packages/domain';
@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  token = signal('');
  user = signal<{ name: string; role: Role } | null>(null);
  private refreshing: Promise<string> | null = null;
  async login(email: string, password: string) {
    if (config.demo) {
      if (email !== 'demo' || password !== 'demo123')
        throw new Error('Niepoprawny login lub hasło.');
      this.user.set({ name: 'Andrii — konto demo', role: 'admin' });
      this.token.set('local-demo');
      return;
    }
    const result = await firstValueFrom(
      this.http.post<{
        accessToken: string;
        user: { name: string; role: Role };
      }>(
        `${config.apiUrl}/auth/login`,
        { email, password },
        { withCredentials: true },
      ),
    );
    this.token.set(result.accessToken);
    this.user.set(result.user);
  }
  async refresh() {
    if (!this.refreshing)
      this.refreshing = firstValueFrom(
        this.http.post<{
          accessToken: string;
          user: { name: string; role: Role };
        }>(`${config.apiUrl}/auth/refresh`, {}, { withCredentials: true }),
      )
        .then((r) => {
          this.token.set(r.accessToken);
          this.user.set(r.user);
          return r.accessToken;
        })
        .finally(() => (this.refreshing = null));
    return this.refreshing;
  }
  async logout() {
    if (!config.demo)
      await firstValueFrom(
        this.http.post(
          `${config.apiUrl}/auth/logout`,
          {},
          { withCredentials: true },
        ),
      ).catch(() => undefined);
    this.token.set('');
    this.user.set(null);
  }
}
export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  return auth.user() ? true : router.createUrlTree(['/login']);
};
export const adminGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  return auth.user()?.role === 'admin' ? true : router.createUrlTree(['/']);
};
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(Auth);
  if (!request.url.startsWith(config.apiUrl) || config.demo)
    return next(request);
  const authorized = auth.token()
    ? request.clone({ setHeaders: { Authorization: `Bearer ${auth.token()}` } })
    : request;
  return next(authorized).pipe(
    catchError((error) => {
      if (error.status !== 401 || request.url.includes('/auth/'))
        return throwError(() => error);
      return from(auth.refresh()).pipe(
        switchMap((token) =>
          next(
            request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }),
          ),
        ),
      );
    }),
  );
};
