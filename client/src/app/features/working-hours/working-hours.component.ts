import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { ToastService } from '../../shared/services/toast.service';

interface Doctor {
  doctorId: number;
  ime: string;
  prezime: string;
  titula: string | null;
  specializacija: string;
}

interface WorkingHoursItem {
  workingHoursId: number;
  danUNedelji: number;
  vremeOd: string;
  vremeDo: string;
}

const DAY_NAMES: Record<number, string> = {
  1: 'Ponedeljak',
  2: 'Utorak',
  3: 'Sreda',
  4: 'Četvrtak',
  5: 'Petak',
  6: 'Subota',
  7: 'Nedelja',
};

@Component({
  selector: 'app-working-hours',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2 class="text-2xl font-semibold mb-6">Radno vreme lekara</h2>

    @if (loading()) {
      <div class="flex justify-center py-12">
        <span class="loading loading-spinner loading-md"></span>
      </div>
    } @else {
      @for (doc of doctors(); track doc.doctorId) {
        <div class="collapse collapse-arrow bg-base-100 shadow-sm mb-3">
          <input type="checkbox" />
          <div class="collapse-title font-medium">
            {{ doc.titula ? doc.titula + ' ' : '' }}{{ doc.ime }} {{ doc.prezime }}
            <span class="badge badge-outline ml-2">{{ doc.specializacija }}</span>
          </div>
          <div class="collapse-content">
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Dan</th>
                    <th>Radi</th>
                    <th>Od</th>
                    <th>Do</th>
                  </tr>
                </thead>
                <tbody>
                  @for (day of days; track day) {
                    <tr>
                      <td>{{ dayName(day) }}</td>
                      <td>
                        <input type="checkbox" class="checkbox checkbox-sm"
                          [checked]="!!getEdit(doc.doctorId, day)"
                          (change)="toggleDay(doc.doctorId, day, $event)" />
                      </td>
                      <td>
                        @if (getEdit(doc.doctorId, day); as e) {
                          <input type="time" class="input input-sm input-bordered w-32"
                            [ngModel]="e.vremeOd"
                            (ngModelChange)="setField(doc.doctorId, day, 'vremeOd', $event)" />
                        }
                      </td>
                      <td>
                        @if (getEdit(doc.doctorId, day); as e) {
                          <input type="time" class="input input-sm input-bordered w-32"
                            [ngModel]="e.vremeDo"
                            (ngModelChange)="setField(doc.doctorId, day, 'vremeDo', $event)" />
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <button class="btn btn-primary btn-sm mt-3" (click)="save(doc.doctorId)"
                    [disabled]="saving() === doc.doctorId">
              @if (saving() === doc.doctorId) {
                <span class="loading loading-spinner loading-xs"></span>
              }
              <span class="material-icons text-sm">save</span> Sačuvaj
            </button>
          </div>
        </div>
      }

      @if (doctors().length === 0) {
        <div class="text-center text-base-content/60 py-8">Nema lekara.</div>
      }
    }
  `,
})
export class WorkingHoursComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  doctors = signal<Doctor[]>([]);
  loading = signal(true);
  saving = signal<number | null>(null);
  days = [1, 2, 3, 4, 5, 6, 7];

  // doctorId -> day -> edit values
  edits: Record<number, Record<number, { vremeOd: string; vremeDo: string }>> = {};

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.get<any[]>('doctors?aktivan=true').subscribe({
      next: (list) => {
        this.doctors.set(
          list.map((d) => ({
            doctorId: d.doctorId,
            ime: d.ime,
            prezime: d.prezime,
            titula: d.titula,
            specializacija: d.specijalizacijaNaziv,
          }))
        );
        // Load working hours for each doctor
        for (const d of list) {
          this.api.get<WorkingHoursItem[]>(`doctors/${d.doctorId}/working-hours`).subscribe({
            next: (wh) => {
              this.edits[d.doctorId] = {};
              for (const item of wh) {
                this.edits[d.doctorId][item.danUNedelji] = {
                  vremeOd: item.vremeOd,
                  vremeDo: item.vremeDo,
                };
              }
            },
          });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  dayName(day: number): string {
    return DAY_NAMES[day];
  }

  getEdit(doctorId: number, day: number): { vremeOd: string; vremeDo: string } | null {
    return this.edits[doctorId]?.[day] ?? null;
  }

  toggleDay(doctorId: number, day: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (!this.edits[doctorId]) this.edits[doctorId] = {};
    if (checked) {
      this.edits[doctorId][day] = { vremeOd: '08:00', vremeDo: '16:00' };
    } else {
      delete this.edits[doctorId][day];
    }
  }

  setField(doctorId: number, day: number, field: 'vremeOd' | 'vremeDo', value: string): void {
    if (this.edits[doctorId]?.[day]) {
      this.edits[doctorId][day][field] = value;
    }
  }

  save(doctorId: number): void {
    this.saving.set(doctorId);
    const data = this.edits[doctorId] ?? {};
    const hours = Object.entries(data)
      .filter(([, v]) => v.vremeOd && v.vremeDo)
      .map(([day, v]) => ({ danUNedelji: +day, vremeOd: v.vremeOd, vremeDo: v.vremeDo }));

    this.api.put(`doctors/${doctorId}/working-hours`, hours).subscribe({
      next: () => {
        this.toast.success('Radno vreme sačuvano');
        this.saving.set(null);
      },
      error: () => {
        this.toast.error('Greška pri čuvanju');
        this.saving.set(null);
      },
    });
  }
}
