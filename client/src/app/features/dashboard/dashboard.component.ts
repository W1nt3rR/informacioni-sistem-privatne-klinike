import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  template: `
    <h2 class="text-2xl font-semibold text-slate-800 mb-6">Kontrolna tabla</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      @for (card of stats; track card.label) {
        <mat-card class="p-4">
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-lg" [style.background-color]="card.color + '20'">
              <mat-icon [style.color]="card.color">{{ card.icon }}</mat-icon>
            </div>
            <div>
              <p class="text-sm text-slate-500 m-0">{{ card.label }}</p>
              <p class="text-2xl font-bold text-slate-800 m-0">{{ card.value }}</p>
            </div>
          </div>
        </mat-card>
      }
    </div>
  `,
})
export class DashboardComponent {
  stats = [
    { label: 'Pacijenti', value: '—', icon: 'people', color: '#3b82f6' },
    { label: 'Današnji termini', value: '—', icon: 'calendar_today', color: '#10b981' },
    { label: 'Lekari', value: '—', icon: 'badge', color: '#8b5cf6' },
    { label: 'Neplaćeni računi', value: '—', icon: 'receipt_long', color: '#f59e0b' },
  ];
}
