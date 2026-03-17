import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '../../shared/services/dialog.service';
import { Diagnosis } from './diagnosis.model';

@Component({
  selector: 'app-diagnosis-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h3 class="font-bold text-lg">{{ data ? 'Izmeni dijagnozu' : 'Nova dijagnoza' }}</h3>
    <form [formGroup]="form" class="mt-4 space-y-3">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Šifra</legend>
        <input class="input w-full" formControlName="sifra" />
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
    <div class="modal-action">
      <button class="btn" (click)="ref.close()">Otkaži</button>
      <button class="btn btn-primary" [disabled]="form.invalid" (click)="save()">Sačuvaj</button>
    </div>
  `,
})
export class DiagnosisDialogComponent {
  private fb = inject(FormBuilder);
  ref = inject(DialogRef);
  data = inject<Diagnosis | null>(DIALOG_DATA);

  form = this.fb.group({
    sifra: [this.data?.sifra ?? '', Validators.required],
    naziv: [this.data?.naziv ?? '', Validators.required],
    opis: [this.data?.opis ?? ''],
  });

  save(): void {
    if (this.form.valid) {
      this.ref.close(this.form.value);
    }
  }
}
