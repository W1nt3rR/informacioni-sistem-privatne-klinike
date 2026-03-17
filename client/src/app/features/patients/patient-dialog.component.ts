import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ApiService } from '../../shared/services/api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Patient } from './patient.model';

@Component({
  selector: 'app-patient-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSelectModule, MatDatepickerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Izmeni pacijenta' : 'Novi pacijent' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="flex flex-col gap-3">
        <div class="grid grid-cols-2 gap-3">
          <mat-form-field>
            <mat-label>Ime</mat-label>
            <input matInput formControlName="ime" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Prezime</mat-label>
            <input matInput formControlName="prezime" />
          </mat-form-field>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <mat-form-field>
            <mat-label>JMBG</mat-label>
            <input matInput formControlName="jmbg" maxlength="13" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Pol</mat-label>
            <mat-select formControlName="pol">
              <mat-option value="M">Muški</mat-option>
              <mat-option value="Ž">Ženski</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <mat-form-field>
          <mat-label>Datum rođenja</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="datumRodjenja" />
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
        </mat-form-field>
        <div class="grid grid-cols-2 gap-3">
          <mat-form-field>
            <mat-label>Telefon</mat-label>
            <input matInput formControlName="telefon" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
          </mat-form-field>
        </div>
        <mat-form-field>
          <mat-label>Adresa</mat-label>
          <input matInput formControlName="adresa" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Broj osiguranja</mat-label>
          <input matInput formControlName="brojOsiguranja" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Napomene</mat-label>
          <textarea matInput formControlName="napomene" rows="2"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Otkaži</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          {{ data ? 'Sačuvaj' : 'Kreiraj' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
})
export class PatientDialogComponent {
  data = inject<Patient | null>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<PatientDialogComponent>);
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    ime: [this.data?.ime ?? '', Validators.required],
    prezime: [this.data?.prezime ?? '', Validators.required],
    jmbg: [this.data?.jmbg ?? '', [Validators.required, Validators.minLength(13), Validators.maxLength(13)]],
    datumRodjenja: [this.data ? new Date(this.data.datumRodjenja) : null as Date | null, Validators.required],
    pol: [this.data?.pol ?? '', Validators.required],
    telefon: [this.data?.telefon ?? '', Validators.required],
    email: [this.data?.email ?? ''],
    adresa: [(this.data as any)?.adresa ?? ''],
    brojOsiguranja: [(this.data as any)?.brojOsiguranja ?? ''],
    napomene: [(this.data as any)?.napomene ?? ''],
  });

  save(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const body = {
      ...val,
      datumRodjenja: this.formatDate(val.datumRodjenja!),
      email: val.email || null,
      adresa: val.adresa || null,
      brojOsiguranja: val.brojOsiguranja || null,
      napomene: val.napomene || null,
    };

    const req$ = this.data
      ? this.api.put(`patients/${this.data.patientId}`, body)
      : this.api.post('patients', body);

    req$.subscribe({
      next: () => {
        this.snackBar.open(this.data ? 'Pacijent ažuriran' : 'Pacijent kreiran', 'OK', { duration: 2000 });
        this.dialogRef.close(true);
      },
      error: () => this.snackBar.open('Greška pri čuvanju', 'OK', { duration: 3000 }),
    });
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
