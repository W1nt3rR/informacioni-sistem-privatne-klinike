import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';

interface LogItem {
  activityLogId: number;
  userId: string;
  userName: string;
  akcija: string;
  tabela: string;
  entitetId: string | null;
  stareVrednosti: string | null;
  noveVrednosti: string | null;
  datumVreme: string;
  ipAdresa: string | null;
}

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
      <h2 class="text-2xl font-semibold mb-6">Evidencija aktivnosti</h2>

      <div class="flex gap-4 mb-4 flex-wrap">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Akcija</legend>
          <select class="select w-40" [(ngModel)]="akcijaFilter" (ngModelChange)="load()">
            <option value="">Sve</option>
            <option value="kreiranje">Kreiranje</option>
            <option value="izmena">Izmena</option>
            <option value="brisanje">Brisanje</option>
            <option value="prijava">Prijava</option>
            <option value="odjava">Odjava</option>
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Tabela</legend>
          <input class="input w-40" [(ngModel)]="tabelaFilter" />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Od</legend>
          <input type="date" class="input w-44" [(ngModel)]="fromDate" />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Do</legend>
          <input type="date" class="input w-44" [(ngModel)]="toDate" />
        </fieldset>
        <button class="btn btn-primary self-end" (click)="load()">
          <span class="material-icons">search</span> Pretraži
        </button>
      </div>

      <div class="card bg-base-100 shadow-sm overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Datum/vreme</th>
              <th>Korisnik</th>
              <th>Akcija</th>
              <th>Tabela</th>
              <th>ID entiteta</th>
              <th>IP adresa</th>
            </tr>
          </thead>
          <tbody>
            @for (l of logs(); track l.activityLogId) {
              <tr>
                <td>{{ l.datumVreme | date:'dd.MM.yyyy. HH:mm:ss' }}</td>
                <td>{{ l.userName }}</td>
                <td>
                  <span class="badge" [class]="actionBadge(l.akcija)">
                    {{ l.akcija }}
                  </span>
                </td>
                <td>{{ l.tabela }}</td>
                <td>{{ l.entitetId || '—' }}</td>
                <td>{{ l.ipAdresa || '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
  `
})
export class ActivityLogComponent implements OnInit {
  private api = inject(ApiService);

  logs = signal<LogItem[]>([]);

  akcijaFilter = '';
  tabelaFilter = '';
  fromDate = '';
  toDate = '';

  ngOnInit() { this.load(); }

  load() {
    const params = new URLSearchParams();
    if (this.akcijaFilter) params.set('akcija', this.akcijaFilter);
    if (this.tabelaFilter) params.set('tabela', this.tabelaFilter);
    if (this.fromDate) params.set('from', this.fromDate);
    if (this.toDate) params.set('to', this.toDate);
    const qs = params.toString();
    this.api.get<LogItem[]>(`activity-log${qs ? '?' + qs : ''}`).subscribe(r => this.logs.set(r));
  }

  actionBadge(a: string): string {
    switch (a) {
      case 'kreiranje': return 'badge-success';
      case 'izmena': return 'badge-info';
      case 'brisanje': return 'badge-error';
      default: return 'badge-ghost';
    }
  }
}
