import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NonWorkingDay } from './non-working-day.model';

@Component({
  selector: 'app-non-working-day-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Izmeni neradni dan' : 'Novi neradni dan' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-3 pt-2" style="min-width: 360px;">
        <mat-form-field>
          <mat-label>Datum</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="datum" />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Naziv</mat-label>
          <input matInput formControlName="naziv" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Opis</mat-label>
          <textarea matInput formControlName="opis" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Otkaži</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">Sačuvaj</button>
    </mat-dialog-actions>
  `,
})
export class NonWorkingDayDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<NonWorkingDayDialogComponent>);
  data = inject<NonWorkingDay | null>(MAT_DIALOG_DATA);

  form = this.fb.group({
    datum: [this.data ? new Date(this.data.datum) : null, Validators.required],
    naziv: [this.data?.naziv ?? '', Validators.required],
    opis: [this.data?.opis ?? ''],
  });

  save(): void {
    if (this.form.valid) {
      const val = this.form.value;
      const d = val.datum as Date;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      this.dialogRef.close({ ...val, datum: dateStr });
    }
  }
}
