import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../shared/services/api.service';
import { environment } from '../../../environments/environment';

interface MedicalReport {
  medicalReportId: number;
  examinationId: number;
  doctorName: string;
  serviceName: string;
  datumPregleda: string;
  dijagnoza: string | null;
  preporuka: string | null;
  sadrzaj: string;
  potpisan: boolean;
}

@Component({
  selector: 'app-my-reports',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatTableModule, MatChipsModule, MatButtonModule, MatIconModule],
  template: `
    <h2 class="text-2xl font-semibold text-slate-800 mb-6">Moji nalazi</h2>

    <mat-card>
      <mat-card-content>
        @if (reports().length === 0) {
          <p class="text-slate-500 text-center py-8">Nemate medicinske nalaze.</p>
        } @else {
          <table mat-table [dataSource]="reports()" class="w-full">
            <ng-container matColumnDef="datumPregleda">
              <th mat-header-cell *matHeaderCellDef>Datum</th>
              <td mat-cell *matCellDef="let r">{{ r.datumPregleda | date:'dd.MM.yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="serviceName">
              <th mat-header-cell *matHeaderCellDef>Usluga</th>
              <td mat-cell *matCellDef="let r">{{ r.serviceName }}</td>
            </ng-container>
            <ng-container matColumnDef="doctorName">
              <th mat-header-cell *matHeaderCellDef>Lekar</th>
              <td mat-cell *matCellDef="let r">{{ r.doctorName }}</td>
            </ng-container>
            <ng-container matColumnDef="dijagnoza">
              <th mat-header-cell *matHeaderCellDef>Dijagnoza</th>
              <td mat-cell *matCellDef="let r">{{ r.dijagnoza ?? '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="potpisan">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let r">
                <mat-chip [class]="r.potpisan ? '!bg-green-100 !text-green-800' : '!bg-amber-100 !text-amber-800'">
                  {{ r.potpisan ? 'Potpisan' : 'U pripremi' }}
                </mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let r">
                @if (r.potpisan) {
                  <button mat-icon-button color="primary" (click)="downloadPdf(r.medicalReportId)">
                    <mat-icon>download</mat-icon>
                  </button>
                }
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        }
      </mat-card-content>
    </mat-card>

    @if (selectedReport()) {
      <mat-card class="mt-4">
        <mat-card-header>
          <mat-card-title>Detalji nalaza</mat-card-title>
        </mat-card-header>
        <mat-card-content class="mt-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Dijagnoza:</strong> {{ selectedReport()!.dijagnoza ?? 'N/A' }}</div>
            <div><strong>Preporuka:</strong> {{ selectedReport()!.preporuka ?? 'N/A' }}</div>
          </div>
          <div class="mt-4">
            <strong>Sadržaj nalaza:</strong>
            <p class="mt-2 p-3 bg-slate-50 rounded whitespace-pre-wrap">{{ selectedReport()!.sadrzaj }}</p>
          </div>
        </mat-card-content>
      </mat-card>
    }
  `,
})
export class MyReportsComponent implements OnInit {
  private api = inject(ApiService);

  reports = signal<MedicalReport[]>([]);
  selectedReport = signal<MedicalReport | null>(null);
  columns = ['datumPregleda', 'serviceName', 'doctorName', 'dijagnoza', 'potpisan', 'actions'];

  ngOnInit() {
    this.api.get<MedicalReport[]>('portal/medical-reports').subscribe(d => this.reports.set(d));
  }

  downloadPdf(id: number): void {
    window.open(`${environment.apiUrl}/medical-reports/${id}/pdf`, '_blank');
  }
}
