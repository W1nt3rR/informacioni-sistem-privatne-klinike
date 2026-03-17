import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
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
  imports: [DatePipe],
  template: `
    <h2 class="text-2xl font-semibold mb-6">Moji nalazi</h2>

    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        @if (reports().length === 0) {
          <p class="text-base-content/60 text-center py-8">Nemate medicinske nalaze.</p>
        } @else {
          <table class="table">
            <thead><tr><th>Datum</th><th>Usluga</th><th>Lekar</th><th>Dijagnoza</th><th>Status</th><th></th></tr></thead>
            <tbody>
              @for (r of reports(); track r.medicalReportId) {
                <tr class="cursor-pointer hover" (click)="selectedReport.set(r)">
                  <td>{{ r.datumPregleda | date:'dd.MM.yyyy' }}</td>
                  <td>{{ r.serviceName }}</td>
                  <td>{{ r.doctorName }}</td>
                  <td>{{ r.dijagnoza ?? '-' }}</td>
                  <td>
                    <span class="badge" [class]="r.potpisan ? 'badge-success' : 'badge-warning'">
                      {{ r.potpisan ? 'Potpisan' : 'U pripremi' }}
                    </span>
                  </td>
                  <td>
                    @if (r.potpisan) {
                      <button class="btn btn-ghost btn-xs btn-square" (click)="downloadPdf(r.medicalReportId); $event.stopPropagation()">
                        <span class="material-icons text-sm">download</span>
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>

    @if (selectedReport(); as sr) {
      <div class="card bg-base-100 shadow-sm mt-4">
        <div class="card-body">
          <h3 class="card-title text-base">Detalji nalaza</h3>
          <div class="grid grid-cols-2 gap-4 text-sm mt-2">
            <div><strong>Dijagnoza:</strong> {{ sr.dijagnoza ?? 'N/A' }}</div>
            <div><strong>Preporuka:</strong> {{ sr.preporuka ?? 'N/A' }}</div>
          </div>
          <div class="mt-4">
            <strong>Sadržaj nalaza:</strong>
            <p class="mt-2 p-3 bg-base-200 rounded whitespace-pre-wrap">{{ sr.sadrzaj }}</p>
          </div>
        </div>
      </div>
    }
  `,
})
export class MyReportsComponent implements OnInit {
  private api = inject(ApiService);

  reports = signal<MedicalReport[]>([]);
  selectedReport = signal<MedicalReport | null>(null);

  ngOnInit() {
    this.api.get<MedicalReport[]>('portal/medical-reports').subscribe(d => this.reports.set(d));
  }

  downloadPdf(id: number): void {
    window.open(`${environment.apiUrl}/medical-reports/${id}/pdf`, '_blank');
  }
}
