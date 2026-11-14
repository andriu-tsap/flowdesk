import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { Auth } from '../auth';
import { config } from '../config';
@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule],
  template: `<div class="login-page">
    <section class="login-story">
      <a class="brand" routerLink="/"
        ><span class="brand-icon">f</span>flowdesk.</a
      >
      <p class="eyebrow">MNIEJ CHAOSU. WIĘCEJ PRZESTRZENI.</p>
      <h1>Twój biznes.<br />W dobrym<br /><em>rytmie.</em></h1>
      <p>
        Rezerwacje, relacje i codzienne zadania. Wszystko w jednym, spokojnym
        miejscu.
      </p>
      <div class="login-preview">
        <div><span class="status-dot"></span> Twój dzień, uporządkowany</div>
        <div class="mini-event">
          <span>09:00</span><strong>Konsultacja projektowa</strong
          ><small>Anna · 60 min</small>
        </div>
        <div class="mini-event">
          <span>10:30</span><strong>Warsztat indywidualny</strong
          ><small>Marek · 90 min</small>
        </div>
      </div>
      <small>Projekt koncepcyjny do portfolio – fikcyjna marka</small>
    </section>
    <section class="login-form">
      <div>
        <span class="demo-pill">INTERAKTYWNE DEMO</span>
        <h2>Dobrze Cię widzieć.</h2>
        <p class="muted">Zajrzyj do środka i sprawdź, jak działa FlowDesk.</p>
        <form [formGroup]="form" (ngSubmit)="login()">
          <label
            >Login<input
              formControlName="email"
              autocomplete="username"
              placeholder="demo" /></label
          ><label
            >Hasło<input
              formControlName="password"
              type="password"
              autocomplete="current-password"
              placeholder="demo123" /></label
          ><button
            mat-flat-button
            class="primary full"
            [disabled]="busy() || form.invalid"
          >
            {{ busy() ? 'Logowanie…' : 'Zaloguj się do panelu' }} →
          </button>
          <p role="alert" class="error">{{ error() }}</p>
        </form>
        <div class="demo-info">
          <strong>Konto demonstracyjne</strong>
          <p>
            Login: <code>demo</code> · Hasło: <code>demo123</code><br />Dane są
            przykładowe. Zmiany pozostają w tej sesji.
          </p>
        </div>
        <a class="standalone-link" routerLink="/rezerwacja"
          >Chcesz zarezerwować usługę? →</a
        >
        <p class="login-footer">Koncepcja i kod: Andrii Tsap · 2026</p>
      </div>
    </section>
  </div>`,
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);
  busy = signal(false);
  error = signal('');
  form = this.fb.nonNullable.group({
    email: [config.demo ? 'demo' : '', Validators.required],
    password: [config.demo ? 'demo123' : '', Validators.required],
  });
  async login() {
    if (this.form.invalid) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email, password);
      await this.router.navigateByUrl('/');
    } catch {
      this.error.set('Niepoprawny login lub hasło.');
    } finally {
      this.busy.set(false);
    }
  }
}
