import { Component, inject, signal } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { Auth } from './auth';
import { Store } from './store';
import { config } from './config';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `<a class="skip" href="#main">Przejdź do treści</a>
    @if (
      auth.user() &&
      !router.url.includes('rezerwacja') &&
      !router.url.includes('widget')
    ) {
      <div class="app-shell" [class.dark]="dark()">
        <aside class="sidebar">
          <a class="brand" routerLink="/"
            ><span class="brand-icon">f</span>flowdesk<span class="brand-dot"
              >.</span
            ></a
          >
          <div class="workspace">
            <span class="avatar">P</span>
            <div>Pracownia Forma<small>Fikcyjna firma usługowa</small></div>
          </div>
          <p class="nav-label">TWOJE MIEJSCE PRACY</p>
          <nav aria-label="Panel firmy">
            @for (item of links; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: true }"
                ><span aria-hidden="true">{{ item.icon }}</span
                >{{ item.label }}</a
              >
            }
          </nav>
          <a class="public-link" routerLink="/rezerwacja"
            >Strona rezerwacji ↗</a
          >
          <div class="sidebar-bottom">
            <span class="demo-pill">TRYB DEMO</span>
            <p>Dane przykładowe.<br />Projekt portfolio Andrii Tsap.</p>
          </div>
        </aside>
        <div class="workspace-main">
          <header class="topbar">
            <span
              >Pracownia Forma <span class="muted">/ Panel firmy</span></span
            >
            <div>
              <button
                class="icon-button"
                (click)="dark.set(!dark())"
                [attr.aria-label]="
                  dark() ? 'Włącz tryb jasny' : 'Włącz tryb ciemny'
                "
              >
                {{ dark() ? '☀' : '☾' }}</button><span class="avatar small"
                >AT</span
              ><button class="text-button" (click)="logout()">Wyloguj</button>
            </div>
          </header>
          <main id="main"><router-outlet /></main>
          <div class="toast" role="status" [class.visible]="store.notice()">
            {{ store.notice()
            }}<button
              (click)="store.notice.set('')"
              aria-label="Zamknij powiadomienie"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    } @else {
      <main id="main"><router-outlet /></main>
    }`,
})
export class App {
  auth = inject(Auth);
  store = inject(Store);
  router = inject(Router);
  dark = signal(false);
  demo = config.demo;
  links = [
    { path: '/', label: 'Pulpit', icon: '◫' },
    { path: '/kalendarz', label: 'Kalendarz', icon: '▦' },
    { path: '/crm', label: 'Leady i sprzedaż', icon: '⊞' },
    { path: '/klienci', label: 'Klienci', icon: '♧' },
    { path: '/dokumenty', label: 'Dokumenty', icon: '▤' },
  ];
  async logout() {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
