import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { Store } from '../store';
import { price, type Stage, type Lead } from '../../../../../packages/domain';
@Component({
  standalone: true,
  imports: [FormsModule, CdkDrag, CdkDropList, CdkDropListGroup],
  template: `<div class="page-heading">
      <div>
        <p class="eyebrow">RELACJE, KTÓRE ROSNĄ</p>
        <h1>Leady i sprzedaż</h1>
        <p class="muted">Przeciągnij kartę albo zmień etap z klawiatury.</p>
      </div>
      <button class="primary" (click)="showForm.set(!showForm())">
        + Dodaj lead
      </button>
    </div>
    @if (showForm()) {
      <form class="panel lead-form" (ngSubmit)="add()">
        <label
          >Nazwa<input
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
        ><label
          >Wartość (PLN)<input
            name="value"
            [(ngModel)]="value"
            type="number"
            min="0"
            required /></label
        ><button class="primary">Zapisz lead</button>
      </form>
    }
    <div class="kanban" cdkDropListGroup>
      @for (stage of store.stages; track stage; let i = $index) {
        <section
          class="kanban-column"
          cdkDropList
          [cdkDropListData]="stage"
          (cdkDropListDropped)="drop($event)"
        >
          <h2>
            <span [class]="'stage-dot stage-' + i"></span>{{ stage }}
            <small>{{ leads(stage).length }}</small>
          </h2>
          <p class="column-total">{{ money(total(stage)) }}</p>
          @for (lead of leads(stage); track lead.id) {
            <article class="lead-card" cdkDrag [cdkDragData]="lead">
              <span class="lead-label">DANE DEMO</span>
              <h3>{{ lead.name }}</h3>
              <p>{{ lead.note }}</p>
              <strong>{{ money(lead.value) }}</strong>
              <div class="lead-footer">
                <span>{{ lead.email }}</span><label
                  class="sr-only"
                  [for]="'stage-' + lead.id"
                  >Etap {{ lead.name }}</label
                ><select
                  [id]="'stage-' + lead.id"
                  [ngModel]="lead.stage"
                  (ngModelChange)="move(lead.id, $event)"
                >
                  @for (option of store.stages; track option) {
                    <option [value]="option">{{ option }}</option>
                  }
                </select>
              </div>
            </article>
          } @empty {
            <div class="drop-hint">Przeciągnij lead tutaj</div>
          }
        </section>
      }
    </div>
    <p role="status">{{ message() }}</p>`,
})
export class Crm implements OnInit {
  store = inject(Store);
  money = price;
  showForm = signal(false);
  message = signal('');
  name = '';
  email = '';
  value = 1000;
  ngOnInit() {
    void this.store.load();
  }
  leads(stage: Stage) {
    return this.store.data().leads.filter((l) => l.stage === stage);
  }
  total(stage: Stage) {
    return this.leads(stage).reduce((sum, l) => sum + l.value, 0);
  }
  drop(event: CdkDragDrop<Stage, Stage, Lead>) {
    void this.move(event.item.data.id, event.container.data);
  }
  async move(id: string, stage: Stage) {
    try {
      await this.store.moveLead(id, stage);
      this.message.set('Etap leada zaktualizowany.');
    } catch {
      this.message.set('Nie udało się zmienić etapu.');
    }
  }
  async add() {
    if (!this.name || !this.email || this.value < 0) return;
    try {
      await this.store.addLead({
        name: this.name,
        email: this.email,
        value: Math.round(this.value * 100),
        note: 'Dodany w panelu',
      });
      this.showForm.set(false);
      this.name = '';
      this.email = '';
      this.message.set('Lead dodany.');
    } catch {
      this.message.set('Nie udało się dodać leada.');
    }
  }
}
