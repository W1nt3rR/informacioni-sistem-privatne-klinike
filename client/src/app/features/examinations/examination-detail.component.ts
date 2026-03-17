import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../shared/services/api.service';
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
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSelectModule, MatTableModule, MatChipsModule,
    MatTabsModule, MatDialogModule, MatAutocompleteModule, MatSnackBarModule],
  template: `
    <div class="p-6">
      @if (exam(); as e) {
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold">
            Pregled #{{ e.examinationId }} — {{ e.patientIme }} {{ e.patientPrezime }}
          </h1>
          <div class="flex gap-2">
            <mat-chip [class]="'status-' + e.status">
              {{ e.status === 'u_toku' ? 'U toku' : 'Završen' }}
            </mat-chip>
            @if (e.status === 'u_toku') {
              <button mat-raised-button color="primary" (click)="saveExamination()">
                <mat-icon>save</mat-icon> Sačuvaj
              </button>
              <button mat-raised-button color="accent" (click)="completeExamination()">
                <mat-icon>check_circle</mat-icon> Završi pregled
              </button>
            }
          </div>
        </div>

        <mat-tab-group>
          <mat-tab label="Pregled">
            <div class="p-4">
              <div class="grid grid-cols-2 gap-4">
                <mat-form-field class="w-full">
                  <mat-label>Anamneza</mat-label>
                  <textarea matInput [(ngModel)]="anamneza" rows="4"
                    [readonly]="e.status === 'zavrsen'"></textarea>
                </mat-form-field>
                <mat-form-field class="w-full">
                  <mat-label>Simptomi</mat-label>
                  <textarea matInput [(ngModel)]="simptomi" rows="4"
                    [readonly]="e.status === 'zavrsen'"></textarea>
                </mat-form-field>
              </div>

              <div class="grid grid-cols-2 gap-4 mt-4">
                <mat-form-field class="w-full">
                  <mat-label>Dijagnoza (šifarnik)</mat-label>
                  <input matInput [(ngModel)]="diagnosisSearch"
                    [matAutocomplete]="autoDiag"
                    (ngModelChange)="filterDiagnoses($event)"
                    [readonly]="e.status === 'zavrsen'">
                  <mat-autocomplete #autoDiag="matAutocomplete"
                    (optionSelected)="selectDiagnosis($event.option.value)"
                    [displayWith]="displayDiagnosis">
                    @for (d of filteredDiagnoses(); track d.diagnosisId) {
                      <mat-option [value]="d">{{ d.sifra }} - {{ d.naziv }}</mat-option>
                    }
                  </mat-autocomplete>
                </mat-form-field>
                <mat-form-field class="w-full">
                  <mat-label>Dijagnoza (slobodan tekst)</mat-label>
                  <input matInput [(ngModel)]="dijagnozaTekst"
                    [readonly]="e.status === 'zavrsen'">
                </mat-form-field>
              </div>

              <div class="grid grid-cols-2 gap-4 mt-4">
                <mat-form-field class="w-full">
                  <mat-label>Zaključak</mat-label>
                  <textarea matInput [(ngModel)]="zakljucak" rows="3"
                    [readonly]="e.status === 'zavrsen'"></textarea>
                </mat-form-field>
                <mat-form-field class="w-full">
                  <mat-label>Preporuka</mat-label>
                  <textarea matInput [(ngModel)]="preporuka" rows="3"
                    [readonly]="e.status === 'zavrsen'"></textarea>
                </mat-form-field>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Terapije">
            <div class="p-4">
              @if (e.status === 'u_toku') {
                <button mat-raised-button color="primary" (click)="addTherapy()" class="mb-4">
                  <mat-icon>add</mat-icon> Dodaj terapiju
                </button>
              }
              <table mat-table [dataSource]="e.therapies" class="w-full">
                <ng-container matColumnDef="lek">
                  <th mat-header-cell *matHeaderCellDef>Lek</th>
                  <td mat-cell *matCellDef="let t">{{ t.nazivLeka }}</td>
                </ng-container>
                <ng-container matColumnDef="doza">
                  <th mat-header-cell *matHeaderCellDef>Doza</th>
                  <td mat-cell *matCellDef="let t">{{ t.doza }}</td>
                </ng-container>
                <ng-container matColumnDef="ucestalost">
                  <th mat-header-cell *matHeaderCellDef>Učestalost</th>
                  <td mat-cell *matCellDef="let t">{{ t.ucestalost }}</td>
                </ng-container>
                <ng-container matColumnDef="trajanje">
                  <th mat-header-cell *matHeaderCellDef>Trajanje</th>
                  <td mat-cell *matCellDef="let t">{{ t.trajanje }}</td>
                </ng-container>
                <ng-container matColumnDef="akcije">
                  <th mat-header-cell *matHeaderCellDef>Akcije</th>
                  <td mat-cell *matCellDef="let t">
                    @if (e.status === 'u_toku') {
                      <button mat-icon-button color="warn" (click)="deleteTherapy(t)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    }
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="therapyColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: therapyColumns;"></tr>
              </table>
              @if (e.therapies.length === 0) {
                <p class="text-center text-gray-500 py-4">Nema terapija.</p>
              }
            </div>
          </mat-tab>

          <mat-tab label="Uputi">
            <div class="p-4">
              @if (e.status === 'u_toku') {
                <button mat-raised-button color="primary" (click)="addReferral()" class="mb-4">
                  <mat-icon>add</mat-icon> Dodaj uput
                </button>
              }
              <table mat-table [dataSource]="e.referrals" class="w-full">
                <ng-container matColumnDef="tip">
                  <th mat-header-cell *matHeaderCellDef>Tip</th>
                  <td mat-cell *matCellDef="let r">{{ referralTypeLabel(r.tip) }}</td>
                </ng-container>
                <ng-container matColumnDef="opis">
                  <th mat-header-cell *matHeaderCellDef>Opis</th>
                  <td mat-cell *matCellDef="let r">{{ r.opis }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let r">{{ r.status }}</td>
                </ng-container>
                <ng-container matColumnDef="akcije">
                  <th mat-header-cell *matHeaderCellDef>Akcije</th>
                  <td mat-cell *matCellDef="let r">
                    @if (e.status === 'u_toku') {
                      <button mat-icon-button color="warn" (click)="deleteReferral(r)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    }
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="referralColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: referralColumns;"></tr>
              </table>
              @if (e.referrals.length === 0) {
                <p class="text-center text-gray-500 py-4">Nema uputa.</p>
              }
            </div>
          </mat-tab>

          <mat-tab label="Izveštaj">
            <div class="p-4">
              @if (e.medicalReport) {
                <div class="mb-4">
                  <p><strong>Status:</strong> {{ e.medicalReport.status === 'potpisan' ? 'Potpisan' : 'Kreiran' }}</p>
                  <p><strong>Datum:</strong> {{ formatDate(e.medicalReport.datumKreiranja) }}</p>
                  <mat-form-field class="w-full mt-2">
                    <mat-label>Sadržaj izveštaja</mat-label>
                    <textarea matInput [(ngModel)]="reportContent" rows="6"
                      [readonly]="e.medicalReport.status === 'potpisan'"></textarea>
                  </mat-form-field>
                  <div class="flex gap-2 mt-2">
                    @if (e.medicalReport.status !== 'potpisan') {
                      <button mat-raised-button (click)="updateReport()">
                        <mat-icon>save</mat-icon> Sačuvaj izveštaj
                      </button>
                      <button mat-raised-button color="primary" (click)="signReport()">
                        <mat-icon>verified</mat-icon> Potpiši
                      </button>
                    }
                    <button mat-raised-button color="accent" (click)="downloadPdf()">
                      <mat-icon>picture_as_pdf</mat-icon> Preuzmi PDF
                    </button>
                  </div>
                </div>
              } @else {
                <button mat-raised-button color="primary" (click)="createReport()">
                  <mat-icon>note_add</mat-icon> Kreiraj izveštaj
                </button>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .status-u_toku { background-color: #fff3e0 !important; }
    .status-zavrsen { background-color: #e8f5e9 !important; }
  `]
})
export class ExaminationDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  exam = signal<ExaminationDetail | null>(null);
  allDiagnoses = signal<Diagnosis[]>([]);
  filteredDiagnoses = signal<Diagnosis[]>([]);

  anamneza = '';
  simptomi = '';
  diagnosisSearch = '';
  selectedDiagnosisId: number | null = null;
  dijagnozaTekst = '';
  zakljucak = '';
  preporuka = '';
  reportContent = '';

  therapyColumns = ['lek', 'doza', 'ucestalost', 'trajanje', 'akcije'];
  referralColumns = ['tip', 'opis', 'status', 'akcije'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadExamination(+id);
    this.api.get<Diagnosis[]>('diagnoses').subscribe(d => {
      this.allDiagnoses.set(d);
      this.filteredDiagnoses.set(d);
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
      if (e.diagnosisId) {
        const diag = this.allDiagnoses().find(d => d.diagnosisId === e.diagnosisId);
        if (diag) this.diagnosisSearch = `${diag.sifra} - ${diag.naziv}`;
      }
    });
  }

  filterDiagnoses(value: string) {
    if (typeof value !== 'string') return;
    const term = value.toLowerCase();
    this.filteredDiagnoses.set(
      this.allDiagnoses().filter(d =>
        d.sifra.toLowerCase().includes(term) || d.naziv.toLowerCase().includes(term))
    );
  }

  selectDiagnosis(d: Diagnosis) {
    this.selectedDiagnosisId = d.diagnosisId;
    this.diagnosisSearch = `${d.sifra} - ${d.naziv}`;
  }

  displayDiagnosis = (d: Diagnosis): string => d ? `${d.sifra} - ${d.naziv}` : '';

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
        this.snackBar.open('Pregled sačuvan.', 'OK', { duration: 2000 });
      });
  }

  completeExamination() {
    const e = this.exam();
    if (!e) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Završi pregled', message: 'Da li želite da završite ovaj pregled? Nakon toga neće biti moguće vršiti izmene.' }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.saveExamination();
      this.api.patch(`examinations/${e.examinationId}/complete`).subscribe(() => {
        this.loadExamination(e.examinationId);
        this.snackBar.open('Pregled završen.', 'OK', { duration: 2000 });
      });
    });
  }

  addTherapy() {
    const e = this.exam();
    if (!e) return;
    const ref = this.dialog.open(TherapyDialogComponent);
    ref.afterClosed().subscribe((result: CreateTherapyRequest | undefined) => {
      if (!result) return;
      this.api.post<Therapy>(`examinations/${e.examinationId}/therapies`, result)
        .subscribe(() => this.loadExamination(e.examinationId));
    });
  }

  deleteTherapy(t: Therapy) {
    const e = this.exam();
    if (!e) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Brisanje terapije', message: `Obrisati terapiju "${t.nazivLeka}"?` }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.delete(`examinations/${e.examinationId}/therapies/${t.therapyId}`)
        .subscribe(() => this.loadExamination(e.examinationId));
    });
  }

  addReferral() {
    const e = this.exam();
    if (!e) return;
    const ref = this.dialog.open(ReferralDialogComponent);
    ref.afterClosed().subscribe((result: CreateReferralRequest | undefined) => {
      if (!result) return;
      this.api.post<any>(`examinations/${e.examinationId}/referrals`, result)
        .subscribe(() => this.loadExamination(e.examinationId));
    });
  }

  deleteReferral(r: any) {
    const e = this.exam();
    if (!e) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Brisanje uputa', message: `Obrisati uput?` }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.delete(`examinations/${e.examinationId}/referrals/${r.referralId}`)
        .subscribe(() => this.loadExamination(e.examinationId));
    });
  }

  createReport() {
    const ref = this.dialog.open(ReportDialogComponent);
    ref.afterClosed().subscribe((sadrzaj: string | undefined) => {
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
        this.snackBar.open('Izveštaj sačuvan.', 'OK', { duration: 2000 });
        this.loadExamination(e.examinationId);
      });
  }

  signReport() {
    const e = this.exam();
    if (!e?.medicalReport) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Potpisivanje izveštaja', message: 'Da li želite da potpišete ovaj izveštaj? Nakon toga neće moći da se menja.' }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.patch(`medical-reports/${e.medicalReport!.medicalReportId}/sign`)
        .subscribe(() => {
          this.loadExamination(e.examinationId);
          this.snackBar.open('Izveštaj potpisan.', 'OK', { duration: 2000 });
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
