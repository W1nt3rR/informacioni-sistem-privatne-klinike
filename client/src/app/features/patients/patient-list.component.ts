import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { Patient } from './patient.model';
import { PatientDialogComponent } from './patient-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold">Pacijenti</h2>
      <button class="btn btn-primary btn-sm" (click)="openDialog()">
        <span class="material-icons text-sm">add</span> Novi pacijent
      </button>
    </div>

    <label class="input w-full mb-4">
      <span class="material-icons">search</span>
      <input (input)="onSearch($event)" placeholder="Ime, prezime, JMBG, telefon, email..." />
    </label>

    @if (loading()) {
      <div class="flex justify-center py-12">
        <span class="loading loading-spinner loading-md"></span>
      </div>
    } @else {
      <div class="card bg-base-100 shadow-sm">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Ime i prezime</th>
                <th>JMBG</th>
                <th>Telefon</th>
                <th>Email</th>
                <th>Status</th>
                <th class="w-24"></th>
              </tr>
            </thead>
            <tbody>
              @for (row of patients(); track row.patientId) {
                <tr class="hover">
                  <td>
                    <a [routerLink]="['/patients', row.patientId]" class="link link-primary">
                      {{ row.ime }} {{ row.prezime }}
                    </a>
                  </td>
                  <td>{{ row.jmbg }}</td>
                  <td>{{ row.telefon }}</td>
                  <td>{{ row.email ?? '—' }}</td>
                  <td>
                    <span class="badge" [class]="row.aktivan ? 'badge-success' : 'badge-error'">
                      {{ row.aktivan ? 'Aktivan' : 'Neaktivan' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-ghost btn-xs btn-square" (click)="openDialog(row)">
                      <span class="material-icons text-base">edit</span>
                    </button>
                    <button class="btn btn-ghost btn-xs btn-square" (click)="toggleStatus(row)">
                      <span class="material-icons text-base">{{ row.aktivan ? 'person_off' : 'person' }}</span>
                    </button>
                  </td>
                </tr>
              }
              @if (patients().length === 0) {
                <tr><td colspan="6" class="text-center text-base-content/60 py-8">Nema pronađenih pacijenata.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
})
export class PatientListComponent implements OnInit {
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private toast = inject(ToastService);

  patients = signal<Patient[]>([]);
  loading = signal(false);
  private search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(q => this.load(q));
    this.load('');
  }

  onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
  }

  load(search: string): void {
    this.loading.set(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    this.api.get<Patient[]>(`patients${params}`).subscribe({
      next: data => { this.patients.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openDialog(patient?: Patient): void {
    const ref = this.dialogService.open(PatientDialogComponent, patient ?? null);
    ref.afterClosed.subscribe(result => {
      if (result) this.load('');
    });
  }

  toggleStatus(patient: Patient): void {
    const action = patient.aktivan ? 'deaktivirate' : 'aktivirate';
    const ref = this.dialogService.open(ConfirmDialogComponent, {
      title: 'Potvrda', message: `Da li želite da ${action} pacijenta ${patient.ime} ${patient.prezime}?`,
    });
    ref.afterClosed.subscribe(confirmed => {
      if (confirmed) {
        this.api.patch(`patients/${patient.patientId}/status`, {}).subscribe({
          next: () => {
            this.toast.success('Status ažuriran');
            this.load('');
          },
          error: () => this.toast.error('Greška'),
        });
      }
    });
  }
}
