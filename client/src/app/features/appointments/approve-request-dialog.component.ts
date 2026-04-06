import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';
import { DIALOG_DATA, DialogRef } from '../../shared/services/dialog.service';
import { AppointmentListItem, ApproveRequest, Office } from './appointment.model';

@Component({
  selector: 'app-approve-request-dialog',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <h3 class="font-bold text-lg">Odobri zahtev za termin</h3>
    <div class="mt-2 text-sm opacity-70">
      <p><strong>Pacijent:</strong> {{ data.pacijentIme }}</p>
      <p><strong>Lekar:</strong> {{ data.lekarIme }}</p>
      <p><strong>Usluga:</strong> {{ data.uslugaNaziv }}</p>
      <p><strong>Traženi termin:</strong> {{ data.datumVreme | date:'dd.MM.yyyy. HH:mm' }}</p>
    </div>

    <fieldset class="fieldset mt-4">
      <legend class="fieldset-legend">Ordinacija</legend>
      <select class="select w-full" [(ngModel)]="officeId" name="officeId">
        <option [ngValue]="null" disabled>Izaberite ordinaciju</option>
        @for (o of offices(); track o.officeId) {
          <option [ngValue]="o.officeId">{{ o.naziv }}</option>
        }
      </select>
    </fieldset>

    <div class="modal-action">
      <button class="btn" type="button" (click)="dialogRef.close()">Otkaži</button>
      <button class="btn btn-primary" type="button" [disabled]="!officeId" (click)="submit()">Odobri</button>
    </div>
  `,
})
export class ApproveRequestDialogComponent implements OnInit {
  data = inject<AppointmentListItem>(DIALOG_DATA);
  dialogRef = inject(DialogRef<ApproveRequest>);
  private api = inject(ApiService);

  offices = signal<Office[]>([]);
  officeId: number | null = null;

  ngOnInit(): void {
    this.api.get<Office[]>('offices').subscribe(o => this.offices.set(o.filter(x => x.dostupna)));
  }

  submit(): void {
    if (!this.officeId) {
      return;
    }

    this.dialogRef.close({ officeId: this.officeId });
  }
}
