import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../shared/services/api.service';

interface Specialization {
  specializationId: number;
  naziv: string;
}

@Component({
  selector: 'app-doctor-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Izmeni lekara' : 'Novi lekar' }}</h2>
    <mat-dialog-content class="flex flex-col gap-3 min-w-[420px]">
      <div class="flex gap-3">
        <mat-form-field class="flex-1">
          <mat-label>Ime</mat-label>
          <input matInput [formControl]="form.controls.ime" />
        </mat-form-field>
        <mat-form-field class="flex-1">
          <mat-label>Prezime</mat-label>
          <input matInput [formControl]="form.controls.prezime" />
        </mat-form-field>
      </div>
      <mat-form-field>
        <mat-label>Email</mat-label>
        <input matInput type="email" [formControl]="form.controls.email" />
      </mat-form-field>
      <mat-form-field>
        <mat-label>Telefon</mat-label>
        <input matInput [formControl]="form.controls.telefon" />
      </mat-form-field>
      <mat-form-field>
        <mat-label>Specijalizacija</mat-label>
        <mat-select [formControl]="form.controls.specializationId">
          @for (s of specializations(); track s.specializationId) {
            <mat-option [value]="s.specializationId">{{ s.naziv }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Titula</mat-label>
        <input matInput [formControl]="form.controls.titula" />
      </mat-form-field>
      <mat-form-field>
        <mat-label>Broj licence</mat-label>
        <input matInput [formControl]="form.controls.licencaBroj" />
      </mat-form-field>
      @if (!data) {
        <mat-form-field>
          <mat-label>Korisničko ime</mat-label>
          <input matInput [formControl]="form.controls.userName" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Lozinka</mat-label>
          <input matInput type="password" [formControl]="form.controls.password" />
        </mat-form-field>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Otkaži</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">Sačuvaj</button>
    </mat-dialog-actions>
  `,
})
export class DoctorDialogComponent implements OnInit {
  data = inject<any | null>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<DoctorDialogComponent>);
  private fb = inject(FormBuilder);
  private api = inject(ApiService);

  specializations = signal<Specialization[]>([]);

  form = this.fb.nonNullable.group({
    ime: [this.data?.ime ?? '', Validators.required],
    prezime: [this.data?.prezime ?? '', Validators.required],
    email: [this.data?.email ?? '', [Validators.required, Validators.email]],
    telefon: [this.data?.telefon ?? ''],
    specializationId: [this.data?.specializationId ?? 0, Validators.required],
    titula: [this.data?.titula ?? ''],
    licencaBroj: [this.data?.licencaBroj ?? '', Validators.required],
    userName: [{ value: '', disabled: !!this.data }, Validators.required],
    password: [{ value: '', disabled: !!this.data }, Validators.required],
  });

  ngOnInit(): void {
    this.api.get<Specialization[]>('specializations').subscribe(s => this.specializations.set(s));
  }

  save(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    this.dialogRef.close(val);
  }
}
