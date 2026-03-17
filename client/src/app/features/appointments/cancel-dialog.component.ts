import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '../../shared/services/dialog.service';

export interface CancelDialogData {
  appointmentId: number;
  pacijentIme: string;
}

@Component({
  selector: 'app-cancel-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h3 class="font-bold text-lg">Otkaži termin</h3>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <p class="text-sm opacity-70">Pacijent: {{ data.pacijentIme }}</p>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Razlog otkazivanja</legend>
        <select class="select w-full" formControlName="status">
          <option value="" disabled>Izaberite razlog</option>
          <option value="otkazao_pacijent">Otkazao pacijent</option>
          <option value="otkazala_klinika">Otkazala klinika</option>
          <option value="nije_se_pojavio">Nije se pojavio</option>
        </select>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Napomena</legend>
        <textarea class="textarea w-full" formControlName="razlogOtkazivanja" rows="2"></textarea>
      </fieldset>

      <div class="modal-action">
        <button class="btn" type="button" (click)="dialogRef.close()">Nazad</button>
        <button class="btn btn-error" type="submit" [disabled]="form.invalid">Otkaži termin</button>
      </div>
    </form>
  `,
})
export class CancelDialogComponent {
  data = inject<CancelDialogData>(DIALOG_DATA);
  dialogRef = inject(DialogRef);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    status: ['', Validators.required],
    razlogOtkazivanja: [''],
  });

  submit(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    this.dialogRef.close({
      status: val.status,
      razlogOtkazivanja: val.razlogOtkazivanja || null,
    });
  }
}
