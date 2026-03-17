import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../shared/services/api.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { PatientDetail, Allergy, PatientHistory } from './patient.model';
import { AllergyDialogComponent, AllergyDialogData } from './allergy-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    @if (loading()) {
      <div class="flex justify-center py-12">
        <span class="loading loading-spinner loading-md"></span>
      </div>
    } @else if (patient()) {
      <div class="flex items-center gap-3 mb-6">
        <button class="btn btn-ghost btn-sm btn-square" routerLink="/patients">
          <span class="material-icons">arrow_back</span>
        </button>
        <h2 class="text-2xl font-semibold">
          {{ patient()!.ime }} {{ patient()!.prezime }}
        </h2>
        <span class="badge" [class]="patient()!.aktivan ? 'badge-success' : 'badge-error'">
          {{ patient()!.aktivan ? 'Aktivan' : 'Neaktivan' }}
        </span>
        @if (patient()!.jeStudent) {
          <span class="badge badge-info">Student</span>
        }
        @if (patient()!.jePenzioner) {
          <span class="badge badge-warning">Penzioner</span>
        }
      </div>

      <div role="tablist" class="tabs tabs-bordered mb-4">
        <a role="tab" class="tab" [class.tab-active]="activeTab() === 0" (click)="activeTab.set(0)">Lični podaci</a>
        <a role="tab" class="tab" [class.tab-active]="activeTab() === 1" (click)="activeTab.set(1)">Alergije</a>
        <a role="tab" class="tab" [class.tab-active]="activeTab() === 2" (click)="activeTab.set(2)">Istorija poseta</a>
      </div>

      <!-- Info tab -->
      @if (activeTab() === 0) {
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div><span class="text-base-content/60">JMBG:</span> {{ patient()!.jmbg }}</div>
              <div><span class="text-base-content/60">Pol:</span> {{ patient()!.pol === 'M' ? 'Muški' : 'Ženski' }}</div>
              <div><span class="text-base-content/60">Datum rođenja:</span> {{ patient()!.datumRodjenja }}</div>
              <div><span class="text-base-content/60">Telefon:</span> {{ patient()!.telefon }}</div>
              <div><span class="text-base-content/60">Email:</span> {{ patient()!.email ?? '—' }}</div>
              <div><span class="text-base-content/60">Adresa:</span> {{ patient()!.adresa ?? '—' }}</div>
              <div><span class="text-base-content/60">Broj osiguranja:</span> {{ patient()!.brojOsiguranja ?? '—' }}</div>
              <div><span class="text-base-content/60">Registrovan:</span> {{ patient()!.datumRegistracije | date:'dd.MM.yyyy.' }}</div>
            </div>
            @if (patient()!.napomene) {
              <div class="mt-4 text-sm">
                <span class="text-base-content/60">Napomene:</span>
                <p class="mt-1">{{ patient()!.napomene }}</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- Allergies tab -->
      @if (activeTab() === 1) {
        <div class="flex justify-end mb-3">
          <button class="btn btn-primary btn-sm" (click)="openAllergyDialog()">
            <span class="material-icons text-base">add</span> Nova alergija
          </button>
        </div>
        <div class="card bg-base-100 shadow-sm">
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Alergen</th>
                  <th>Ozbiljnost</th>
                  <th>Opis</th>
                  <th class="w-24"></th>
                </tr>
              </thead>
              <tbody>
                @for (row of patient()!.allergies; track row.allergyId) {
                  <tr class="hover">
                    <td>{{ row.nazivAlergena }}</td>
                    <td><span class="badge" [class]="severityClass(row.ozbiljnost)">{{ row.ozbiljnost }}</span></td>
                    <td>{{ row.opis ?? '—' }}</td>
                    <td>
                      <button class="btn btn-ghost btn-xs btn-square" (click)="openAllergyDialog(row)">
                        <span class="material-icons text-base">edit</span>
                      </button>
                      <button class="btn btn-ghost btn-xs btn-square text-error" (click)="deleteAllergy(row)">
                        <span class="material-icons text-base">delete</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (patient()!.allergies.length === 0) {
            <div class="text-center text-base-content/60 py-4">Nema zabeleženih alergija.</div>
          }
        </div>
      }

      <!-- History tab -->
      @if (activeTab() === 2) {
        @if (historyLoading()) {
          <div class="flex justify-center py-8">
            <span class="loading loading-spinner loading-md"></span>
          </div>
        } @else {
          <h3 class="text-base font-medium mb-2">Zakazani termini</h3>
          @if (history()?.appointments?.length) {
            <div class="card bg-base-100 shadow-sm mb-6">
              <div class="overflow-x-auto">
                <table class="table">
                  <thead>
                    <tr><th>Datum</th><th>Usluga</th><th>Lekar</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    @for (row of history()!.appointments; track row.appointmentId) {
                      <tr class="hover">
                        <td>{{ row.datumVreme | date:'dd.MM.yyyy. HH:mm' }}</td>
                        <td>{{ row.uslugaNaziv }}</td>
                        <td>{{ row.lekarIme }}</td>
                        <td><span class="badge">{{ row.status }}</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          } @else {
            <div class="text-base-content/60 mb-6">Nema zakazanih termina.</div>
          }

          <h3 class="text-base font-medium mb-2">Pregledi</h3>
          @if (history()?.examinations?.length) {
            <div class="card bg-base-100 shadow-sm">
              <div class="overflow-x-auto">
                <table class="table">
                  <thead>
                    <tr><th>Datum</th><th>Dijagnoza</th><th>Lekar</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    @for (row of history()!.examinations; track row.examinationId) {
                      <tr class="hover">
                        <td>{{ row.datumPregleda | date:'dd.MM.yyyy. HH:mm' }}</td>
                        <td>{{ row.dijagnozaTekst ?? '—' }}</td>
                        <td>{{ row.lekarIme }}</td>
                        <td><span class="badge">{{ row.status }}</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          } @else {
            <div class="text-base-content/60">Nema obavljenih pregleda.</div>
          }
        }
      }
    }
  `,
})
export class PatientDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private dialogService = inject(DialogService);
  private toast = inject(ToastService);

  patient = signal<PatientDetail | null>(null);
  history = signal<PatientHistory | null>(null);
  loading = signal(true);
  historyLoading = signal(false);
  activeTab = signal(0);

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
      case 'Blaga': return 'badge-info';
      case 'Umerena': return 'badge-warning';
      case 'Ozbiljna': return 'badge-error';
      case 'Životno ugrožavajuća': return 'badge-error';
      default: return '';
    }
  }

  openAllergyDialog(allergy?: Allergy): void {
    const patientId = this.patient()!.patientId;
    const ref = this.dialogService.open(AllergyDialogComponent, {
      patientId, allergy: allergy ?? null,
    } as AllergyDialogData);
    ref.afterClosed.subscribe(result => {
      if (result) {
        const req$ = allergy
          ? this.api.put(`patients/${patientId}/allergies/${allergy.allergyId}`, result)
          : this.api.post(`patients/${patientId}/allergies`, result);
        req$.subscribe({
          next: () => {
            this.toast.success(allergy ? 'Alergija ažurirana' : 'Alergija dodana');
            this.loadPatient(patientId);
          },
          error: () => this.toast.error('Greška'),
        });
      }
    });
  }

  deleteAllergy(allergy: Allergy): void {
    const patientId = this.patient()!.patientId;
    const ref = this.dialogService.open(ConfirmDialogComponent, {
      title: 'Brisanje alergije', message: `Da li želite da obrišete alergiju "${allergy.nazivAlergena}"?`,
    });
    ref.afterClosed.subscribe(confirmed => {
      if (confirmed) {
        this.api.delete(`patients/${patientId}/allergies/${allergy.allergyId}`).subscribe({
          next: () => {
            this.toast.success('Alergija obrisana');
            this.loadPatient(patientId);
          },
          error: () => this.toast.error('Greška'),
        });
      }
    });
  }
}
