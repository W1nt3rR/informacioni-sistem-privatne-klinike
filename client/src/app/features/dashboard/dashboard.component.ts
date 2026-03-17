import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <h2 class="text-2xl font-semibold mb-6">Kontrolna tabla</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      @for (card of stats; track card.label) {
        <div class="card bg-base-100 shadow">
          <div class="card-body flex-row items-center gap-4 p-4">
            <div class="p-3 rounded-lg" [class]="card.bg">
              <span class="material-icons" [class]="card.text">{{ card.icon }}</span>
            </div>
            <div>
              <p class="text-sm text-base-content/60 m-0">{{ card.label }}</p>
              <p class="text-2xl font-bold m-0">{{ card.value }}</p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent {
  stats = [
    { label: 'Pacijenti', value: '—', icon: 'people', text: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Današnji termini', value: '—', icon: 'calendar_today', text: 'text-success', bg: 'bg-success/10' },
    { label: 'Lekari', value: '—', icon: 'badge', text: 'text-secondary', bg: 'bg-secondary/10' },
    { label: 'Neplaćeni računi', value: '—', icon: 'receipt_long', text: 'text-warning', bg: 'bg-warning/10' },
  ];
}
