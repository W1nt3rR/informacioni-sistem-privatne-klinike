import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../shared/services/api.service';
import { PatientDetail, Allergy, PatientHistory } from './patient.model';
import { AllergyDialogComponent, AllergyDialogData } from './allergy-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatTabsModule, MatTableModule,
    MatChipsModule, MatProgressSpinnerModule, RouterLink, DatePipe,
  ],
  template: `
    @if (loading()) {
      <div class="flex justify-center py-12">
        <mat-spinner diameter="40" />
      </div>
    } @else if (patient()) {
      <div class="flex items-center gap-3 mb-4">
        <button mat-icon-button routerLink="/patients">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2 class="text-xl font-semibold text-slate-800 m-0">
          {{ patient()!.ime }} {{ patient()!.prezime }}
        </h2>
        <mat-chip [class]="patient()!.aktivan ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
          {{ patient()!.aktivan ? 'Aktivan' : 'Neaktivan' }}
        </mat-chip>
      </div>

      <mat-tab-group>
        <!-- Info tab -->
        <mat-tab label="Lični podaci">
          <div class="p-4">
            <div class="bg-white rounded-lg shadow-sm p-4">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div><span class="text-slate-500">JMBG:</span> {{ patient()!.jmbg }}</div>
                <div><span class="text-slate-500">Pol:</span> {{ patient()!.pol === 'M' ? 'Muški' : 'Ženski' }}</div>
                <div><span class="text-slate-500">Datum rođenja:</span> {{ patient()!.datumRodjenja }}</div>
                <div><span class="text-slate-500">Telefon:</span> {{ patient()!.telefon }}</div>
                <div><span class="text-slate-500">Email:</span> {{ patient()!.email ?? '—' }}</div>
                <div><span class="text-slate-500">Adresa:</span> {{ patient()!.adresa ?? '—' }}</div>
                <div><span class="text-slate-500">Broj osiguranja:</span> {{ patient()!.brojOsiguranja ?? '—' }}</div>
                <div><span class="text-slate-500">Registrovan:</span> {{ patient()!.datumRegistracije | date:'dd.MM.yyyy.' }}</div>
              </div>
              @if (patient()!.napomene) {
                <div class="mt-4 text-sm">
                  <span class="text-slate-500">Napomene:</span>
                  <p class="mt-1 text-slate-700">{{ patient()!.napomene }}</p>
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <!-- Allergies tab -->
        <mat-tab label="Alergije">
          <div class="p-4">
            <div class="flex justify-end mb-3">
              <button mat-flat-button color="primary" (click)="openAllergyDialog()">
                <mat-icon>add</mat-icon> Nova alergija
              </button>
            </div>
            <table mat-table [dataSource]="patient()!.allergies" class="w-full bg-white rounded-lg shadow-sm">
              <ng-container matColumnDef="nazivAlergena">
                <th mat-header-cell *matHeaderCellDef>Alergen</th>
                <td mat-cell *matCellDef="let row">{{ row.nazivAlergena }}</td>
              </ng-container>
              <ng-container matColumnDef="ozbiljnost">
                <th mat-header-cell *matHeaderCellDef>Ozbiljnost</th>
                <td mat-cell *matCellDef="let row">
                  <mat-chip [class]="severityClass(row.ozbiljnost)">{{ row.ozbiljnost }}</mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="opis">
                <th mat-header-cell *matHeaderCellDef>Opis</th>
                <td mat-cell *matCellDef="let row">{{ row.opis ?? '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="w-24"></th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button (click)="openAllergyDialog(row)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteAllergy(row)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="allergyColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: allergyColumns"></tr>
            </table>
            @if (patient()!.allergies.length === 0) {
              <div class="text-center text-slate-400 py-4">Nema zabeleženih alergija.</div>
            }
          </div>
        </mat-tab>

        <!-- History tab -->
        <mat-tab label="Istorija poseta">
          <div class="p-4">
            @if (historyLoading()) {
              <div class="flex justify-center py-8">
                <mat-spinner diameter="32" />
              </div>
            } @else {
              <h3 class="text-base font-medium text-slate-700 mb-2">Zakazani termini</h3>
              @if (history()?.appointments?.length) {
                <table mat-table [dataSource]="history()!.appointments" class="w-full bg-white rounded-lg shadow-sm mb-6">
                  <ng-container matColumnDef="datumVreme">
                    <th mat-header-cell *matHeaderCellDef>Datum</th>
                    <td mat-cell *matCellDef="let row">{{ row.datumVreme | date:'dd.MM.yyyy. HH:mm' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="usluga">
                    <th mat-header-cell *matHeaderCellDef>Usluga</th>
                    <td mat-cell *matCellDef="let row">{{ row.uslugaNaziv }}</td>
                  </ng-container>
                  <ng-container matColumnDef="lekar">
                    <th mat-header-cell *matHeaderCellDef>Lekar</th>
                    <td mat-cell *matCellDef="let row">{{ row.lekarIme }}</td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let row">
                      <mat-chip>{{ row.status }}</mat-chip>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="appointmentColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: appointmentColumns"></tr>
                </table>
              } @else {
                <div class="text-slate-400 mb-6">Nema zakazanih termina.</div>
              }

              <h3 class="text-base font-medium text-slate-700 mb-2">Pregledi</h3>
              @if (history()?.examinations?.length) {
                <table mat-table [dataSource]="history()!.examinations" class="w-full bg-white rounded-lg shadow-sm">
                  <ng-container matColumnDef="datumPregleda">
                    <th mat-header-cell *matHeaderCellDef>Datum</th>
                    <td mat-cell *matCellDef="let row">{{ row.datumPregleda | date:'dd.MM.yyyy. HH:mm' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="dijagnoza">
                    <th mat-header-cell *matHeaderCellDef>Dijagnoza</th>
                    <td mat-cell *matCellDef="let row">{{ row.dijagnozaTekst ?? '—' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="lekar">
                    <th mat-header-cell *matHeaderCellDef>Lekar</th>
                    <td mat-cell *matCellDef="let row">{{ row.lekarIme }}</td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let row">
                      <mat-chip>{{ row.status }}</mat-chip>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="examinationColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: examinationColumns"></tr>
                </table>
              } @else {
                <div class="text-slate-400">Nema obavljenih pregleda.</div>
              }
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    }
  `,
})
export class PatientDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  patient = signal<PatientDetail | null>(null);
  history = signal<PatientHistory | null>(null);
  loading = signal(true);
  historyLoading = signal(false);

  allergyColumns = ['nazivAlergena', 'ozbiljnost', 'opis', 'actions'];
  appointmentColumns = ['datumVreme', 'usluga', 'lekar', 'status'];
  examinationColumns = ['datumPregleda', 'dijagnoza', 'lekar', 'status'];

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.loadPatient(id);
    this.loadHistory(id);
  }

  loadPatient(id: number): void {
    this.loading.set(true);
    this.api.get<PatientDetail>(`patients/${id}`).subscribe({
      next: p => { this.patient.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadHistory(id: number): void {
    this.historyLoading.set(true);
    this.api.get<PatientHistory>(`patients/${id}/history`).subscribe({
      next: h => { this.history.set(h); this.historyLoading.set(false); },
      error: () => this.historyLoading.set(false),
    });
  }

  severityClass(ozbiljnost: string): string {
    switch (ozbiljnost) {
      case 'Blaga': return 'bg-blue-100 text-blue-800';
      case 'Umerena': return 'bg-yellow-100 text-yellow-800';
      case 'Ozbiljna': return 'bg-orange-100 text-orange-800';
      case 'Životno ugrožavajuća': return 'bg-red-100 text-red-800';
      default: return '';
    }
  }

  openAllergyDialog(allergy?: Allergy): void {
    const patientId = this.patient()!.patientId;
    this.dialog.open(AllergyDialogComponent, {
      width: '450px',
      data: { patientId, allergy: allergy ?? null } as AllergyDialogData,
    }).afterClosed().subscribe(result => {
      if (result) {
        const req$ = allergy
          ? this.api.put(`patients/${patientId}/allergies/${allergy.allergyId}`, result)
          : this.api.post(`patients/${patientId}/allergies`, result);
        req$.subscribe({
          next: () => {
            this.snackBar.open(allergy ? 'Alergija ažurirana' : 'Alergija dodana', 'OK', { duration: 2000 });
            this.loadPatient(patientId);
          },
          error: () => this.snackBar.open('Greška', 'OK', { duration: 3000 }),
        });
      }
    });
  }

  deleteAllergy(allergy: Allergy): void {
    const patientId = this.patient()!.patientId;
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Brisanje alergije', message: `Da li želite da obrišete alergiju "${allergy.nazivAlergena}"?` },
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.api.delete(`patients/${patientId}/allergies/${allergy.allergyId}`).subscribe({
          next: () => {
            this.snackBar.open('Alergija obrisana', 'OK', { duration: 2000 });
            this.loadPatient(patientId);
          },
          error: () => this.snackBar.open('Greška', 'OK', { duration: 3000 }),
        });
      }
    });
  }
}
