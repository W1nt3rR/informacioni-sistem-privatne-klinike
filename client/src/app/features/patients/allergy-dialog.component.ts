import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '../../shared/services/dialog.service';
import { Allergy } from './patient.model';

export interface AllergyDialogData {
  patientId: number;
  allergy: Allergy | null;
}

@Component({
  selector: 'app-allergy-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h3 class="font-bold text-lg">{{ data.allergy ? 'Izmeni alergiju' : 'Nova alergija' }}</h3>
    <form [formGroup]="form" (ngSubmit)="save()">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Naziv alergena</legend>
        <input class="input w-full" formControlName="nazivAlergena" />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Ozbiljnost</legend>
        <select class="select w-full" formControlName="ozbiljnost">
          <option value="" disabled>Izaberite</option>
          <option value="Blaga">Blaga</option>
          <option value="Umerena">Umerena</option>
          <option value="Ozbiljna">Ozbiljna</option>
          <option value="Životno ugrožavajuća">Životno ugrožavajuća</option>
        </select>
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Opis</legend>
        <textarea class="textarea w-full" formControlName="opis" rows="2"></textarea>
      </fieldset>
      <div class="modal-action">
        <button class="btn" type="button" (click)="dialogRef.close()">Otkaži</button>
        <button class="btn btn-primary" type="submit" [disabled]="form.invalid">
          {{ data.allergy ? 'Sačuvaj' : 'Dodaj' }}
        </button>
      </div>
    </form>
  `,
})
export class AllergyDialogComponent {
  data = inject<AllergyDialogData>(DIALOG_DATA);
  dialogRef = inject(DialogRef);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    nazivAlergena: [this.data.allergy?.nazivAlergena ?? '', Validators.required],
    ozbiljnost: [this.data.allergy?.ozbiljnost ?? '', Validators.required],
    opis: [this.data.allergy?.opis ?? ''],
  });

  save(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    this.dialogRef.close({
      ...val,
      opis: val.opis || null,
    });
  }
}
