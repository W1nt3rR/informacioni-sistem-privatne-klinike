import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { DIALOG_DATA, DialogRef } from '../../shared/services/dialog.service';
import { AppointmentListItem, AvailableSlot, Office, RescheduleRequest } from './appointment.model';

@Component({
  selector: 'app-reschedule-appointment-dialog',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <h3 class="font-bold text-lg">Pomeranje termina</h3>
    <div class="mt-2 text-sm opacity-70">
      <p><strong>Pacijent:</strong> {{ data.pacijentIme }}</p>
      <p><strong>Trenutni termin:</strong> {{ data.datumVreme | date:'dd.MM.yyyy. HH:mm' }}</p>
    </div>

    <div class="mt-4 flex flex-col gap-3">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Ordinacija</legend>
        <select class="select w-full" [(ngModel)]="model.officeId" name="officeId" (ngModelChange)="loadSlots()">
          <option [ngValue]="null" disabled>Izaberite ordinaciju</option>
          @for (o of offices(); track o.officeId) {
            <option [ngValue]="o.officeId">{{ o.naziv }}</option>
          }
        </select>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Datum</legend>
        <input type="date" class="input w-full" [(ngModel)]="model.date" name="date" (ngModelChange)="loadSlots()" />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Razlog promene</legend>
        <textarea class="textarea w-full" [(ngModel)]="model.razlogPromene" name="razlogPromene" rows="2"></textarea>
      </fieldset>

      @if (slots().length > 0) {
        <div>
          <label class="text-sm opacity-70 mb-1 block">Slobodni termini</label>
          <div class="flex flex-wrap gap-2">
            @for (slot of slots(); track slot.vremeOd) {
              <button type="button" class="btn btn-sm"
                      [class.btn-primary]="selectedSlot() === slot.vremeOd"
                      [class.btn-outline]="selectedSlot() !== slot.vremeOd"
                      (click)="selectedSlot.set(slot.vremeOd)">
                {{ slot.vremeOd }} - {{ slot.vremeDo }}
              </button>
            }
          </div>
        </div>
      }
      @if (slotsLoaded() && slots().length === 0) {
        <div class="text-warning text-sm">Nema slobodnih termina za odabrani datum i ordinaciju.</div>
      }
    </div>

    <div class="modal-action">
      <button class="btn" type="button" (click)="dialogRef.close()">Otkaži</button>
      <button class="btn btn-primary" type="button" [disabled]="!selectedSlot() || !model.officeId" (click)="submit()">
        Sačuvaj
      </button>
    </div>
  `,
})
export class RescheduleAppointmentDialogComponent implements OnInit {
  data = inject<AppointmentListItem>(DIALOG_DATA);
  dialogRef = inject(DialogRef<RescheduleRequest>);
  private api = inject(ApiService);

  offices = signal<Office[]>([]);
  slots = signal<AvailableSlot[]>([]);
  slotsLoaded = signal(false);
  selectedSlot = signal<string | null>(null);

  model = {
    officeId: this.data.officeId,
    date: this.toDateString(new Date(this.data.datumVreme)),
    razlogPromene: '',
  };

  ngOnInit(): void {
    this.api.get<Office[]>('offices').subscribe(o => this.offices.set(o.filter(x => x.dostupna)));
    this.loadSlots();
  }

  loadSlots(): void {
    this.selectedSlot.set(null);
    this.slotsLoaded.set(false);

    if (!this.model.officeId || !this.model.date) {
      this.slots.set([]);
      return;
    }

    this.api.get<AvailableSlot[]>(
      `appointments/available-slots?doctorId=${this.data.doctorId}&serviceId=${this.data.serviceId}&date=${this.model.date}&officeId=${this.model.officeId}`,
    ).subscribe(s => {
      this.slots.set(s);
      this.slotsLoaded.set(true);
    });
  }

  submit(): void {
    if (!this.model.officeId || !this.model.date || !this.selectedSlot()) {
      return;
    }

    const [hour, minute] = (this.selectedSlot() ?? '').split(':').map(Number);
    const date = new Date(this.model.date);
    const pad = (value: number) => value.toString().padStart(2, '0');
    const datumVreme = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hour)}:${pad(minute)}:00`;

    this.dialogRef.close({
      datumVreme,
      officeId: this.model.officeId,
      razlogPromene: this.model.razlogPromene.trim() || null,
    });
  }

  private toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
