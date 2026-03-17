import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { Allergy } from './patient.model';

export interface AllergyDialogData {
  patientId: number;
  allergy: Allergy | null;
}

@Component({
  selector: 'app-allergy-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.allergy ? 'Izmeni alergiju' : 'Nova alergija' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="flex flex-col gap-3">
        <mat-form-field>
          <mat-label>Naziv alergena</mat-label>
          <input matInput formControlName="nazivAlergena" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Ozbiljnost</mat-label>
          <mat-select formControlName="ozbiljnost">
            <mat-option value="Blaga">Blaga</mat-option>
            <mat-option value="Umerena">Umerena</mat-option>
            <mat-option value="Ozbiljna">Ozbiljna</mat-option>
            <mat-option value="Životno ugrožavajuća">Životno ugrožavajuća</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Opis</mat-label>
          <textarea matInput formControlName="opis" rows="2"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Otkaži</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          {{ data.allergy ? 'Sačuvaj' : 'Dodaj' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
})
export class AllergyDialogComponent {
  data = inject<AllergyDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<AllergyDialogComponent>);
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
