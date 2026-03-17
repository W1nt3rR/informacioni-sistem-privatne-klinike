import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { environment } from '../../../environments/environment';
import { ExaminationDetail, Therapy, Referral, Diagnosis, UpdateExaminationRequest,
  CreateTherapyRequest, CreateReferralRequest } from './examination.model';
import { TherapyDialogComponent } from './therapy-dialog.component';
import { ReferralDialogComponent } from './referral-dialog.component';
import { ReportDialogComponent } from './report-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-examination-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
      @if (exam(); as e) {
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-semibold">
            Pregled #{{ e.examinationId }} — {{ e.patientIme }} {{ e.patientPrezime }}
          </h2>
          <div class="flex gap-2 items-center">
            <span class="badge" [class]="e.status === 'u_toku' ? 'badge-warning' : 'badge-success'">
              {{ e.status === 'u_toku' ? 'U toku' : 'Završen' }}
            </span>
            @if (e.status === 'u_toku') {
              <button class="btn btn-primary btn-sm" (click)="saveExamination()">
                <span class="material-icons text-sm">save</span> Sačuvaj
              </button>
              <button class="btn btn-accent btn-sm" (click)="completeExamination()">
                <span class="material-icons text-sm">check_circle</span> Završi pregled
              </button>
            }
          </div>
        </div>

        <div class="tabs tabs-bordered mb-4">
          <button class="tab" [class.tab-active]="activeTab() === 0" (click)="activeTab.set(0)">Pregled</button>
          <button class="tab" [class.tab-active]="activeTab() === 1" (click)="activeTab.set(1)">Terapije</button>
          <button class="tab" [class.tab-active]="activeTab() === 2" (click)="activeTab.set(2)">Uputi</button>
          <button class="tab" [class.tab-active]="activeTab() === 3" (click)="activeTab.set(3)">Izveštaj</button>
        </div>

        @if (activeTab() === 0) {
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Anamneza</legend>
                <textarea class="textarea w-full" [(ngModel)]="anamneza" rows="4"
                  [readOnly]="e.status === 'zavrsen'"></textarea>
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Simptomi</legend>
                <textarea class="textarea w-full" [(ngModel)]="simptomi" rows="4"
                  [readOnly]="e.status === 'zavrsen'"></textarea>
              </fieldset>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Dijagnoza (šifarnik)</legend>
                <select class="select w-full" [(ngModel)]="selectedDiagnosisId"
                  [disabled]="e.status === 'zavrsen'">
                  <option [ngValue]="null">— Izaberite dijagnozu —</option>
                  @for (d of allDiagnoses(); track d.diagnosisId) {
                    <option [ngValue]="d.diagnosisId">{{ d.sifra }} - {{ d.naziv }}</option>
                  }
                </select>
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Dijagnoza (slobodan tekst)</legend>
                <input class="input w-full" [(ngModel)]="dijagnozaTekst"
                  [readOnly]="e.status === 'zavrsen'" />
              </fieldset>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Zaključak</legend>
                <textarea class="textarea w-full" [(ngModel)]="zakljucak" rows="3"
                  [readOnly]="e.status === 'zavrsen'"></textarea>
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Preporuka</legend>
                <textarea class="textarea w-full" [(ngModel)]="preporuka" rows="3"
                  [readOnly]="e.status === 'zavrsen'"></textarea>
              </fieldset>
            </div>
          </div>
        }

        @if (activeTab() === 1) {
          <div>
            @if (e.status === 'u_toku') {
              <button class="btn btn-primary btn-sm mb-4" (click)="addTherapy()">
                <span class="material-icons text-sm">add</span> Dodaj terapiju
              </button>
            }
            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr><th>Lek</th><th>Doza</th><th>Učestalost</th><th>Trajanje</th><th>Akcije</th></tr>
                </thead>
                <tbody>
                  @for (t of e.therapies; track t.therapyId) {
                    <tr>
                      <td>{{ t.nazivLeka }}</td>
                      <td>{{ t.doza }}</td>
                      <td>{{ t.ucestalost }}</td>
                      <td>{{ t.trajanje }}</td>
                      <td>
                        @if (e.status === 'u_toku') {
                          <button class="btn btn-ghost btn-xs btn-square text-error" (click)="deleteTherapy(t)">
                            <span class="material-icons text-sm">delete</span>
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            @if (e.therapies.length === 0) {
              <p class="text-center text-base-content/60 py-4">Nema terapija.</p>
            }
          </div>
        }

        @if (activeTab() === 2) {
          <div>
            @if (e.status === 'u_toku') {
              <button class="btn btn-primary btn-sm mb-4" (click)="addReferral()">
                <span class="material-icons text-sm">add</span> Dodaj uput
              </button>
            }
            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr><th>Tip</th><th>Opis</th><th>Status</th><th>Akcije</th></tr>
                </thead>
                <tbody>
                  @for (r of e.referrals; track r.referralId) {
                    <tr>
                      <td>{{ referralTypeLabel(r.tip) }}</td>
                      <td>{{ r.opis }}</td>
                      <td>{{ r.status }}</td>
                      <td>
                        @if (e.status === 'u_toku') {
                          <button class="btn btn-ghost btn-xs btn-square text-error" (click)="deleteReferral(r)">
                            <span class="material-icons text-sm">delete</span>
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            @if (e.referrals.length === 0) {
              <p class="text-center text-base-content/60 py-4">Nema uputa.</p>
            }
          </div>
        }

        @if (activeTab() === 3) {
          <div>
            @if (e.medicalReport) {
              <div class="space-y-3">
                <p><strong>Status:</strong> {{ e.medicalReport.status === 'potpisan' ? 'Potpisan' : 'Kreiran' }}</p>
                <p><strong>Datum:</strong> {{ formatDate(e.medicalReport.datumKreiranja) }}</p>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">Sadržaj izveštaja</legend>
                  <textarea class="textarea w-full" [(ngModel)]="reportContent" rows="6"
                    [readOnly]="e.medicalReport.status === 'potpisan'"></textarea>
                </fieldset>
                <div class="flex gap-2">
                  @if (e.medicalReport.status !== 'potpisan') {
                    <button class="btn btn-sm" (click)="updateReport()">
                      <span class="material-icons text-sm">save</span> Sačuvaj izveštaj
                    </button>
                    <button class="btn btn-primary btn-sm" (click)="signReport()">
                      <span class="material-icons text-sm">verified</span> Potpiši
                    </button>
                  }
                  <button class="btn btn-accent btn-sm" (click)="downloadPdf()">
                    <span class="material-icons text-sm">picture_as_pdf</span> Preuzmi PDF
                  </button>
                </div>
              </div>
            } @else {
              <button class="btn btn-primary btn-sm" (click)="createReport()">
                <span class="material-icons text-sm">note_add</span> Kreiraj izveštaj
              </button>
            }
          </div>
        }
      }
  `
})
export class ExaminationDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private dialogService = inject(DialogService);
  private toast = inject(ToastService);

  exam = signal<ExaminationDetail | null>(null);
  allDiagnoses = signal<Diagnosis[]>([]);
  activeTab = signal(0);

  anamneza = '';
  simptomi = '';
  selectedDiagnosisId: number | null = null;
  dijagnozaTekst = '';
  zakljucak = '';
  preporuka = '';
  reportContent = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadExamination(+id);
    this.api.get<Diagnosis[]>('diagnoses').subscribe(d => {
      this.allDiagnoses.set(d);
    });
  }

  loadExamination(id: number) {
    this.api.get<ExaminationDetail>(`examinations/${id}`).subscribe(e => {
      this.exam.set(e);
      this.anamneza = e.anamneza ?? '';
      this.simptomi = e.simptomi ?? '';
      this.dijagnozaTekst = e.dijagnozaTekst ?? '';
      this.zakljucak = e.zakljucak ?? '';
      this.preporuka = e.preporuka ?? '';
      this.selectedDiagnosisId = e.diagnosisId ?? null;
      this.reportContent = e.medicalReport?.sadrzaj ?? '';
    });
  }

  saveExamination() {
    const e = this.exam();
    if (!e) return;
    const req: UpdateExaminationRequest = {
      anamneza: this.anamneza || undefined,
      simptomi: this.simptomi || undefined,
      diagnosisId: this.selectedDiagnosisId ?? undefined,
      dijagnozaTekst: this.dijagnozaTekst || undefined,
      zakljucak: this.zakljucak || undefined,
      preporuka: this.preporuka || undefined
    };
    this.api.put<ExaminationDetail>(`examinations/${e.examinationId}`, req)
      .subscribe(updated => {
        this.exam.set(updated);
        this.toast.success('Pregled sačuvan.');
      });
  }

  completeExamination() {
    const e = this.exam();
    if (!e) return;
    const ref = this.dialogService.open(ConfirmDialogComponent, {
      title: 'Završi pregled', message: 'Da li želite da završite ovaj pregled? Nakon toga neće biti moguće vršiti izmene.'
    });
    ref.afterClosed.subscribe(ok => {
      if (!ok) return;
      this.saveExamination();
      this.api.patch(`examinations/${e.examinationId}/complete`).subscribe(() => {
        this.loadExamination(e.examinationId);
        this.toast.success('Pregled završen.');
      });
    });
  }

  addTherapy() {
    const e = this.exam();
    if (!e) return;
    const ref = this.dialogService.open(TherapyDialogComponent);
    ref.afterClosed.subscribe((result: CreateTherapyRequest | undefined) => {
      if (!result) return;
      this.api.post<Therapy>(`examinations/${e.examinationId}/therapies`, result)
        .subscribe(() => this.loadExamination(e.examinationId));
    });
  }

  deleteTherapy(t: Therapy) {
    const e = this.exam();
    if (!e) return;
    const ref = this.dialogService.open(ConfirmDialogComponent, {
      title: 'Brisanje terapije', message: `Obrisati terapiju "${t.nazivLeka}"?`
    });
    ref.afterClosed.subscribe(ok => {
      if (!ok) return;
      this.api.delete(`examinations/${e.examinationId}/therapies/${t.therapyId}`)
        .subscribe(() => this.loadExamination(e.examinationId));
    });
  }

  addReferral() {
    const e = this.exam();
    if (!e) return;
    const ref = this.dialogService.open(ReferralDialogComponent);
    ref.afterClosed.subscribe((result: CreateReferralRequest | undefined) => {
      if (!result) return;
      this.api.post<any>(`examinations/${e.examinationId}/referrals`, result)
        .subscribe(() => this.loadExamination(e.examinationId));
    });
  }

  deleteReferral(r: any) {
    const e = this.exam();
    if (!e) return;
    const ref = this.dialogService.open(ConfirmDialogComponent, {
      title: 'Brisanje uputa', message: `Obrisati uput?`
    });
    ref.afterClosed.subscribe(ok => {
      if (!ok) return;
      this.api.delete(`examinations/${e.examinationId}/referrals/${r.referralId}`)
        .subscribe(() => this.loadExamination(e.examinationId));
    });
  }

  createReport() {
    const ref = this.dialogService.open(ReportDialogComponent);
    ref.afterClosed.subscribe((sadrzaj: string | undefined) => {
      if (!sadrzaj) return;
      const e = this.exam()!;
      this.api.post<any>(`medical-reports?examinationId=${e.examinationId}`, { sadrzaj })
        .subscribe(() => this.loadExamination(e.examinationId));
    });
  }

  updateReport() {
    const e = this.exam();
    if (!e?.medicalReport) return;
    this.api.put(`medical-reports/${e.medicalReport.medicalReportId}`, { sadrzaj: this.reportContent })
      .subscribe(() => {
        this.toast.success('Izveštaj sačuvan.');
        this.loadExamination(e.examinationId);
      });
  }

  signReport() {
    const e = this.exam();
    if (!e?.medicalReport) return;
    const ref = this.dialogService.open(ConfirmDialogComponent, {
      title: 'Potpisivanje izveštaja', message: 'Da li želite da potpišete ovaj izveštaj? Nakon toga neće moći da se menja.'
    });
    ref.afterClosed.subscribe(ok => {
      if (!ok) return;
      this.api.patch(`medical-reports/${e.medicalReport!.medicalReportId}/sign`)
        .subscribe(() => {
          this.loadExamination(e.examinationId);
          this.toast.success('Izveštaj potpisan.');
        });
    });
  }

  downloadPdf() {
    const e = this.exam();
    if (!e?.medicalReport) return;
    window.open(`${environment.apiUrl}/medical-reports/${e.medicalReport.medicalReportId}/pdf`, '_blank');
  }

  referralTypeLabel(tip: string): string {
    const map: Record<string, string> = {
      laboratorija: 'Laboratorija', specijalisticki: 'Specijalistički', dijagnostika: 'Dijagnostika'
    };
    return map[tip] ?? tip;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('sr-Latn', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
