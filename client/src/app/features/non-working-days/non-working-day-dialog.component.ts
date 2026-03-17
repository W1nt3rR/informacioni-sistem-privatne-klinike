import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '../../shared/services/dialog.service';
import { NonWorkingDay } from './non-working-day.model';

@Component({
  selector: 'app-non-working-day-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h3 class="font-bold text-lg">{{ data ? 'Izmeni neradni dan' : 'Novi neradni dan' }}</h3>
    <div class="mt-4">
      <form [formGroup]="form" class="flex flex-col gap-3">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Datum</legend>
          <input type="date" class="input w-full" formControlName="datum" />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Naziv</legend>
          <input class="input w-full" formControlName="naziv" />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Opis</legend>
          <textarea class="textarea w-full" formControlName="opis" rows="3"></textarea>
        </fieldset>
      </form>
    </div>
    <div class="modal-action">
      <button class="btn" (click)="dialogRef.close(null)">Otkaži</button>
      <button class="btn btn-primary" [disabled]="form.invalid" (click)="save()">Sačuvaj</button>
    </div>
  `,
})
export class NonWorkingDayDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject(DialogRef);
  data = inject(DIALOG_DATA) as NonWorkingDay | null;

  form = this.fb.group({
    datum: [this.data ? this.data.datum : '', Validators.required],
    naziv: [this.data?.naziv ?? '', Validators.required],
    opis: [this.data?.opis ?? ''],
  });

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
