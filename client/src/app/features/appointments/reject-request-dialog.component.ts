import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '../../shared/services/dialog.service';
import { AppointmentListItem, RejectRequest } from './appointment.model';

@Component({
  selector: 'app-reject-request-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h3 class="font-bold text-lg">Odbij zahtev za termin</h3>
    <p class="mt-2 text-sm opacity-70">Pacijent: {{ data.pacijentIme }}</p>

    <fieldset class="fieldset mt-4">
      <legend class="fieldset-legend">Razlog odbijanja</legend>
      <textarea class="textarea w-full" [(ngModel)]="reason" name="reason" rows="3"></textarea>
    </fieldset>

    <div class="modal-action">
      <button class="btn" type="button" (click)="dialogRef.close()">Nazad</button>
      <button class="btn btn-error" type="button" (click)="submit()">Odbij</button>
    </div>
  `,
})
export class RejectRequestDialogComponent {
  data = inject<AppointmentListItem>(DIALOG_DATA);
  dialogRef = inject(DialogRef<RejectRequest>);
  reason = '';

  submit(): void {
    this.dialogRef.close({
      razlogOtkazivanja: this.reason.trim() || null,
    });
  }
}
