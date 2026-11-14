import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '../store';
@Component({
  standalone: true,
  imports: [FormsModule],
  template: `<section class="chat-widget">
    <header>
      <span class="brand-icon">f</span>
      <div>
        <h1>Jak możemy pomóc?</h1>
        <span>Asystent FAQ · FlowDesk DEMO</span>
      </div>
    </header>
    <div class="chat-body">
      <p class="bubble">Cześć! Wybierz pytanie lub zostaw kontakt.</p>
      @for (q of questions; track q.question) {
        <button class="faq-button" (click)="answer.set(q.answer)">
          {{ q.question }}
        </button>
      }
      <p class="bubble" role="status">{{ answer() }}</p>
      <form (ngSubmit)="send()">
        <label
          >Twoje imię<input
            name="name"
            [(ngModel)]="name"
            required
            minlength="2" /></label
        ><label
          >E-mail<input
            name="email"
            [(ngModel)]="email"
            type="email"
            required /></label
        ><button class="primary full">Zostaw kontakt</button>
      </form>
      <p role="status">{{ message() }}</p>
      <small
        >Fikcyjna marka.
        {{
          store.demo
            ? 'Kontakt pozostaje w pamięci demo.'
            : 'Dane zostaną zapisane w CRM.'
        }}</small
      >
    </div>
  </section>`,
})
export class Widget {
  store = inject(Store);
  answer = signal('');
  message = signal('');
  name = '';
  email = '';
  questions = [
    {
      question: 'Jak zarezerwować termin?',
      answer:
        'Otwórz stronę rezerwacji, wybierz usługę, specjalistę i wolną godzinę.',
    },
    {
      question: 'Ile trwa konsultacja?',
      answer:
        'Konsultacja trwa 60 minut, szybka konsultacja 30 minut, a warsztat 90 minut.',
    },
    {
      question: 'Czy to prawdziwa firma?',
      answer:
        'Nie — FlowDesk i Pracownia Forma to fikcyjne marki stworzone do portfolio.',
    },
  ];
  async send() {
    try {
      await this.store.addLead({
        name: this.name,
        email: this.email,
        value: 0,
        note: 'Kontakt z widgetu FAQ',
      });
      this.message.set(
        this.store.demo
          ? 'Kontakt dodany do demo CRM. Niczego nie wysłano.'
          : 'Kontakt zapisany.',
      );
      this.name = '';
      this.email = '';
    } catch {
      this.message.set('Nie udało się zapisać kontaktu.');
    }
  }
}
