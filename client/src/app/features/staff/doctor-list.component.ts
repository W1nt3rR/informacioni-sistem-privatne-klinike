import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { Doctor } from './doctor.model';
import { DoctorDialogComponent } from './doctor-dialog.component';

interface Specialization {
  specializationId: number;
  naziv: string;
}

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold">Lekari</h2>
      <div class="flex gap-3 items-center">
        <select class="select w-52" (change)="filterBySpec($event)">
          <option value="">Sve specijalizacije</option>
          @for (s of specializations(); track s.specializationId) {
            <option [value]="s.specializationId">{{ s.naziv }}</option>
          }
        </select>
        <button class="btn btn-primary btn-sm" (click)="openDialog()">
          <span class="material-icons text-sm">add</span> Dodaj
        </button>
      </div>
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
              <th>Ime i prezime</th>
              <th>Specijalizacija</th>
              <th>Broj licence</th>
              <th>Email</th>
              <th>Status</th>
              <th class="w-32">Akcije</th>
            </tr>
          </thead>
          <tbody>
            @for (row of items(); track row.doctorId) {
              <tr>
                <td>
                  <a [routerLink]="[row.doctorId]" class="link link-primary">
                    {{ row.titula ? row.titula + ' ' : '' }}{{ row.ime }} {{ row.prezime }}
                  </a>
                </td>
                <td>{{ row.specijalizacijaNaziv }}</td>
                <td>{{ row.licencaBroj }}</td>
                <td>{{ row.email }}</td>
                <td>
                  <span class="badge" [class]="row.aktivan ? 'badge-success' : 'badge-error'">
                    {{ row.aktivan ? 'Aktivan' : 'Neaktivan' }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-1">
                    <div class="tooltip" data-tip="Izmeni">
                      <button class="btn btn-ghost btn-xs btn-square" (click)="openDialog(row)">
                        <span class="material-icons text-sm">edit</span>
                      </button>
                    </div>
                    <div class="tooltip" [attr.data-tip]="row.aktivan ? 'Deaktiviraj' : 'Aktiviraj'">
                      <button class="btn btn-ghost btn-xs btn-square" (click)="toggleStatus(row)">
                        <span class="material-icons text-sm">{{ row.aktivan ? 'block' : 'check_circle' }}</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (items().length === 0) {
          <div class="text-center text-base-content/60 py-8">Nema lekara.</div>
        }
      </div>
    }
  `,
})
export class DoctorListComponent implements OnInit {
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private toast = inject(ToastService);

  items = signal<Doctor[]>([]);
  specializations = signal<Specialization[]>([]);
  loading = signal(true);
  private specFilter: number | null = null;

  ngOnInit(): void {
    this.api.get<Specialization[]>('specializations').subscribe(s => this.specializations.set(s));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const params: Record<string, string> = {};
    if (this.specFilter) params['specializationId'] = this.specFilter.toString();
    this.api.get<Doctor[]>('doctors', params).subscribe({
      next: data => { this.items.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  filterBySpec(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.specFilter = val ? +val : null;
    this.load();
  }

  openDialog(item?: Doctor): void {
    const ref = this.dialogService.open(DoctorDialogComponent, item ?? null);
    ref.afterClosed.subscribe(result => {
      if (!result) return;
      const op = item
        ? this.api.put(`doctors/${item.doctorId}`, {
            ime: result.ime, prezime: result.prezime, email: result.email,
            telefon: result.telefon || null, specializationId: result.specializationId,
            titula: result.titula || null, licencaBroj: result.licencaBroj,
          })
        : this.api.post('doctors', result);
      op.subscribe({
        next: () => { this.toast.success(item ? 'Izmenjeno' : 'Dodato'); this.load(); },
        error: () => this.toast.error('Greška pri čuvanju'),
      });
    });
  }

  toggleStatus(item: Doctor): void {
    this.api.patch(`doctors/${item.doctorId}/status`).subscribe({
      next: () => { this.toast.success('Status promenjen'); this.load(); },
      error: () => this.toast.error('Greška'),
    });
  }
}
