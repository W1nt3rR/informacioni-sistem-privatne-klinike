import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';

interface PortalAppointment {
  appointmentId: number;
  serviceName: string;
  doctorName: string;
  datumVreme: string;
  trajanjeMinuta: number;
  status: string;
}

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [
    DatePipe, MatCardModule, MatTableModule, MatChipsModule,
    MatButtonModule, MatIconModule, MatTabsModule, RouterLink,
  ],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-slate-800 m-0">Moji termini</h2>
      <a mat-flat-button color="primary" routerLink="/portal/request-appointment">
        <mat-icon>add</mat-icon> Zakaži termin
      </a>
    </div>

    <mat-card>
      <mat-card-content>
        <mat-tab-group>
          <mat-tab label="Predstojeći">
            <div class="mt-4">
              @if (upcoming().length === 0) {
                <p class="text-slate-500 text-center py-8">Nemate zakazane termine.</p>
              } @else {
                <table mat-table [dataSource]="upcoming()" class="w-full">
                  <ng-container matColumnDef="datumVreme">
                    <th mat-header-cell *matHeaderCellDef>Datum i vreme</th>
                    <td mat-cell *matCellDef="let a">{{ a.datumVreme | date:'dd.MM.yyyy HH:mm' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="serviceName">
                    <th mat-header-cell *matHeaderCellDef>Usluga</th>
                    <td mat-cell *matCellDef="let a">{{ a.serviceName }}</td>
                  </ng-container>
                  <ng-container matColumnDef="doctorName">
                    <th mat-header-cell *matHeaderCellDef>Lekar</th>
                    <td mat-cell *matCellDef="let a">{{ a.doctorName }}</td>
                  </ng-container>
                  <ng-container matColumnDef="trajanjeMinuta">
                    <th mat-header-cell *matHeaderCellDef>Trajanje</th>
                    <td mat-cell *matCellDef="let a">{{ a.trajanjeMinuta }} min</td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let a">
                      <mat-chip [class]="statusClass(a.status)">{{ statusLabel(a.status) }}</mat-chip>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="columns"></tr>
                  <tr mat-row *matRowDef="let row; columns: columns"></tr>
                </table>
              }
            </div>
          </mat-tab>
          <mat-tab label="Prošli">
            <div class="mt-4">
              @if (past().length === 0) {
                <p class="text-slate-500 text-center py-8">Nema prošlih termina.</p>
              } @else {
                <table mat-table [dataSource]="past()" class="w-full">
                  <ng-container matColumnDef="datumVreme">
                    <th mat-header-cell *matHeaderCellDef>Datum i vreme</th>
                    <td mat-cell *matCellDef="let a">{{ a.datumVreme | date:'dd.MM.yyyy HH:mm' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="serviceName">
                    <th mat-header-cell *matHeaderCellDef>Usluga</th>
                    <td mat-cell *matCellDef="let a">{{ a.serviceName }}</td>
                  </ng-container>
                  <ng-container matColumnDef="doctorName">
                    <th mat-header-cell *matHeaderCellDef>Lekar</th>
                    <td mat-cell *matCellDef="let a">{{ a.doctorName }}</td>
                  </ng-container>
                  <ng-container matColumnDef="trajanjeMinuta">
                    <th mat-header-cell *matHeaderCellDef>Trajanje</th>
                    <td mat-cell *matCellDef="let a">{{ a.trajanjeMinuta }} min</td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let a">
                      <mat-chip [class]="statusClass(a.status)">{{ statusLabel(a.status) }}</mat-chip>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="columns"></tr>
                  <tr mat-row *matRowDef="let row; columns: columns"></tr>
                </table>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card-content>
    </mat-card>
  `,
})
export class MyAppointmentsComponent implements OnInit {
  private api = inject(ApiService);

  upcoming = signal<PortalAppointment[]>([]);
  past = signal<PortalAppointment[]>([]);
  columns = ['datumVreme', 'serviceName', 'doctorName', 'trajanjeMinuta', 'status'];

  ngOnInit() {
    this.api.get<PortalAppointment[]>('portal/appointments').subscribe(data => {
      const now = new Date();
      this.upcoming.set(data.filter(a => new Date(a.datumVreme) >= now));
      this.past.set(data.filter(a => new Date(a.datumVreme) < now));
    });
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      zakazan: 'Zakazan', realizovan: 'Realizovan',
      otkazao_pacijent: 'Otkazao pacijent', otkazala_klinika: 'Otkazala klinika',
      nije_se_pojavio: 'Nije se pojavio',
    };
    return map[s] ?? s;
  }

  statusClass(s: string): string {
    const map: Record<string, string> = {
      zakazan: '!bg-blue-100 !text-blue-800',
      realizovan: '!bg-green-100 !text-green-800',
      otkazao_pacijent: '!bg-red-100 !text-red-800',
      otkazala_klinika: '!bg-red-100 !text-red-800',
      nije_se_pojavio: '!bg-amber-100 !text-amber-800',
    };
    return map[s] ?? '';
  }
}
