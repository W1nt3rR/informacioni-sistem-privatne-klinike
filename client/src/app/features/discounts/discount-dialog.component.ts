import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Discount } from './discount.model';

@Component({
  selector: 'app-discount-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatCheckboxModule,
    MatDatepickerModule, MatNativeDateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Izmeni popust' : 'Novi popust' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-3 pt-2" style="min-width: 360px;">
        <mat-form-field>
          <mat-label>Naziv</mat-label>
          <input matInput formControlName="naziv" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Procenat (%)</mat-label>
          <input matInput type="number" formControlName="procenat" min="0" max="100" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Važi od</mat-label>
          <input matInput [matDatepicker]="pickerOd" formControlName="vaziOd" />
          <mat-datepicker-toggle matIconSuffix [for]="pickerOd"></mat-datepicker-toggle>
          <mat-datepicker #pickerOd></mat-datepicker>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Važi do</mat-label>
          <input matInput [matDatepicker]="pickerDo" formControlName="vaziDo" />
          <mat-datepicker-toggle matIconSuffix [for]="pickerDo"></mat-datepicker-toggle>
          <mat-datepicker #pickerDo></mat-datepicker>
        </mat-form-field>
        <mat-checkbox formControlName="aktivan">Aktivan</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Otkaži</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">Sačuvaj</button>
    </mat-dialog-actions>
  `,
})
export class DiscountDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<DiscountDialogComponent>);
  data = inject<Discount | null>(MAT_DIALOG_DATA);

  form = this.fb.group({
    naziv: [this.data?.naziv ?? '', Validators.required],
    procenat: [this.data?.procenat ?? 0, [Validators.required, Validators.min(0), Validators.max(100)]],
    vaziOd: [this.data?.vaziOd ? new Date(this.data.vaziOd) : null],
    vaziDo: [this.data?.vaziDo ? new Date(this.data.vaziDo) : null],
    aktivan: [this.data?.aktivan ?? true],
  });

  save(): void {
    if (this.form.valid) {
      const val = this.form.value;
      this.dialogRef.close({
        ...val,
        vaziOd: this.formatDate(val.vaziOd as Date | null),
        vaziDo: this.formatDate(val.vaziDo as Date | null),
      });
    }
  }

  private formatDate(d: Date | null): string | null {
    if (!d) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
