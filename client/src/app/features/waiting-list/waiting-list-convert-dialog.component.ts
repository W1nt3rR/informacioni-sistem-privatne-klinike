import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '../../shared/services/dialog.service';
import { ApiService } from '../../shared/services/api.service';
import { ToastService } from '../../shared/services/toast.service';

interface AvailableSlot { vremeOd: string; vremeDo: string; }
interface OfficeOption { officeId: number; naziv: string; dostupna: boolean; }
interface DoctorOption { doctorId: number; ime: string; prezime: string; }

export interface ConvertDialogData {
  waitingListItemId: number;
  patientName: string;
  serviceName: string;
  serviceId: number;
  doctorId: number | null;
  doctorName: string | null;
}

@Component({
  selector: 'app-waiting-list-convert-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h3 class="font-bold text-lg">Zakaži termin sa liste čekanja</h3>
    <div class="mt-2 text-sm opacity-70">
      <p><strong>Pacijent:</strong> {{ data.patientName }}</p>
      <p><strong>Usluga:</strong> {{ data.serviceName }}</p>
    </div>

    <div class="mt-4 flex flex-col gap-3">
      @if (!data.doctorId) {
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Lekar</legend>
          <select class="select w-full" [(ngModel)]="model.doctorId" name="doctorId"
                  (ngModelChange)="onDoctorOrDateChange()">
            <option [ngValue]="null" disabled>Izaberite lekara</option>
            @for (d of doctors(); track d.doctorId) {
              <option [ngValue]="d.doctorId">{{ d.ime }} {{ d.prezime }}</option>
            }
          </select>
        </fieldset>
      }

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Ordinacija</legend>
        <select class="select w-full" [(ngModel)]="model.officeId" name="officeId" (ngModelChange)="onDoctorOrDateChange()">
          <option [ngValue]="null" disabled>Izaberite ordinaciju</option>
          @for (o of offices(); track o.officeId) {
            <option [ngValue]="o.officeId">{{ o.naziv }}</option>
          }
        </select>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Datum</legend>
        <input type="date" class="input w-full" [(ngModel)]="model.date" name="date"
               (ngModelChange)="onDoctorOrDateChange()" />
      </fieldset>

      @if (slots().length > 0) {
        <div>
          <label class="text-sm opacity-70 mb-1 block">Slobodni termini</label>
          <div class="flex flex-wrap gap-2">
            @for (slot of slots(); track slot.vremeOd) {
              <button type="button" class="btn btn-sm"
                      [class.btn-primary]="selectedSlot === slot.vremeOd"
                      [class.btn-outline]="selectedSlot !== slot.vremeOd"
                      (click)="selectedSlot = slot.vremeOd">
                {{ slot.vremeOd }} - {{ slot.vremeDo }}
              </button>
            }
          </div>
        </div>
      }
      @if (slotsLoaded() && slots().length === 0) {
        <div class="text-warning text-sm">Nema slobodnih termina za odabrani dan.</div>
      }
    </div>

    <div class="modal-action">
      <button class="btn" (click)="dialogRef.close(null)">Otkaži</button>
      <button class="btn btn-primary" (click)="convert()"
              [disabled]="!selectedSlot || !model.officeId || !effectiveDoctorId()">
        Zakaži
      </button>
    </div>
  `,
})
export class WaitingListConvertDialogComponent implements OnInit {
  data = inject<ConvertDialogData>(DIALOG_DATA);
  dialogRef = inject(DialogRef);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  doctors = signal<DoctorOption[]>([]);
  offices = signal<OfficeOption[]>([]);
  slots = signal<AvailableSlot[]>([]);
  slotsLoaded = signal(false);
  selectedSlot: string | null = null;

  model = {
    doctorId: this.data.doctorId as number | null,
    officeId: null as number | null,
    date: '',
  };

  ngOnInit() {
    this.api.get<OfficeOption[]>('offices').subscribe(o => this.offices.set(o.filter(x => x.dostupna)));
    if (!this.data.doctorId) {
      this.api.get<DoctorOption[]>('doctors?aktivan=true').subscribe(d => this.doctors.set(d));
    }
  }

  effectiveDoctorId(): number | null {
    return this.data.doctorId ?? this.model.doctorId;
  }

  onDoctorOrDateChange(): void {
    this.selectedSlot = null;
    this.slotsLoaded.set(false);
    const doctorId = this.effectiveDoctorId();
    if (doctorId && this.model.date && this.model.officeId) {
      this.api.get<AvailableSlot[]>(
        `appointments/available-slots?doctorId=${doctorId}&serviceId=${this.data.serviceId}&date=${this.model.date}&officeId=${this.model.officeId}`
      ).subscribe(s => {
        this.slots.set(s);
        this.slotsLoaded.set(true);
      });
    } else {
      this.slots.set([]);
    }
  }

  convert(): void {
    if (!this.selectedSlot || !this.model.officeId || !this.model.date) return;

    const [h, m] = this.selectedSlot.split(':').map(Number);
    const d = new Date(this.model.date);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const datumVreme = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(m)}:00`;

    this.api.post(`waiting-list/${this.data.waitingListItemId}/convert`, {
      datumVreme,
      officeId: this.model.officeId,
      doctorId: this.data.doctorId ? null : this.model.doctorId,
    }).subscribe({
      next: () => {
        this.toast.success('Termin uspešno zakazan sa liste čekanja.');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.toast.error(err?.error?.message ?? 'Greška pri zakazivanju.');
      },
    });
  }
}
