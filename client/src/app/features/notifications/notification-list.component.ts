import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { ToastService } from '../../shared/services/toast.service';

interface NotificationItem {
  notificationId: number;
  tip: string;
  primalacTip: string;
  primalacId: number;
  primalacIme: string;
  sadrzaj: string;
  datumSlanja: string;
  status: string;
  appointmentId: number | null;
}

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-semibold">Obaveštenja</h2>
        <button class="btn btn-secondary btn-sm" (click)="generateReminders()">
          <span class="material-icons text-sm">notification_add</span> Generiši podsetnike
        </button>
      </div>

      <!-- Filters -->
      <div class="flex gap-4 mb-4">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Tip</legend>
          <select class="select w-48" [(ngModel)]="tipFilter" (ngModelChange)="load()">
            <option value="">Svi</option>
            <option value="podsetnik">Podsetnik</option>
            <option value="raspored">Raspored</option>
            <option value="kontrola">Kontrola</option>
            <option value="poruka">Poruka</option>
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Status</legend>
          <select class="select w-48" [(ngModel)]="statusFilter" (ngModelChange)="load()">
            <option value="">Svi</option>
            <option value="ceka">Čeka</option>
            <option value="poslato">Poslato</option>
            <option value="isporuceno">Isporučeno</option>
            <option value="greska">Greška</option>
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Primalac</legend>
          <select class="select w-48" [(ngModel)]="primalacFilter" (ngModelChange)="load()">
            <option value="">Svi</option>
            <option value="pacijent">Pacijent</option>
            <option value="lekar">Lekar</option>
          </select>
        </fieldset>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <span class="loading loading-spinner loading-md"></span>
        </div>
      } @else {
      <div class="card bg-base-100 shadow-sm overflow-x-auto">
        <table class="table">
        <thead>
          <tr>
            <th>Tip</th>
            <th>Primalac</th>
            <th>Sadržaj</th>
            <th>Datum</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (n of notifications(); track n.notificationId) {
            <tr>
              <td>{{ formatTip(n.tip) }}</td>
              <td>
                <span class="text-xs text-base-content/60">{{ n.primalacTip === 'pacijent' ? 'Pacijent' : 'Lekar' }}</span><br>
                {{ n.primalacIme }}
              </td>
              <td class="max-w-sm truncate">{{ n.sadrzaj }}</td>
              <td>{{ n.datumSlanja | date:'dd.MM.yyyy. HH:mm' }}</td>
              <td>
                <span class="badge" [class]="statusBadge(n.status)">
                  {{ formatStatus(n.status) }}
                </span>
              </td>
              <td>
                @if (n.status === 'ceka') {
                  <div class="tooltip" data-tip="Pošalji">
                    <button class="btn btn-ghost btn-xs btn-square text-primary" (click)="send(n)">
                      <span class="material-icons text-sm">send</span>
                    </button>
                  </div>
                }
              </td>
            </tr>
          }
        </tbody>
        </table>
      </div>
      }
  `
})
export class NotificationListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  notifications = signal<NotificationItem[]>([]);
  loading = signal(true);

  tipFilter = '';
  statusFilter = '';
  primalacFilter = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params = new URLSearchParams();
    if (this.tipFilter) params.set('tip', this.tipFilter);
    if (this.statusFilter) params.set('status', this.statusFilter);
    if (this.primalacFilter) params.set('primalacTip', this.primalacFilter);
    const qs = params.toString();
    this.api.get<NotificationItem[]>(`notifications${qs ? '?' + qs : ''}`).subscribe(r => {
      this.notifications.set(r);
      this.loading.set(false);
    });
  }

  send(n: NotificationItem) {
    this.api.patch(`notifications/${n.notificationId}/send`, {}).subscribe(() => {
      this.toast.success('Obaveštenje poslato');
      this.load();
    });
  }

  generateReminders() {
    this.api.post<{ generated: number }>('notifications/generate-reminders', {}).subscribe(r => {
      this.toast.success(`Generisano ${r.generated} obaveštenja`);
      this.load();
    });
  }

  formatTip(t: string): string {
    switch (t) {
      case 'podsetnik': return 'Podsetnik';
      case 'raspored': return 'Raspored';
      case 'kontrola': return 'Kontrola';
      case 'poruka': return 'Poruka';
      default: return t;
    }
  }

  formatStatus(s: string): string {
    switch (s) {
      case 'ceka': return 'Čeka';
      case 'poslato': return 'Poslato';
      case 'isporuceno': return 'Isporučeno';
      case 'greska': return 'Greška';
      default: return s;
    }
  }

  statusBadge(s: string): string {
    switch (s) {
      case 'ceka': return 'badge-warning';
      case 'poslato': case 'isporuceno': return 'badge-success';
      case 'greska': return 'badge-error';
      default: return '';
    }
  }
}
