import { Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  selector: 'app-service-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Izmeni uslugu' : 'Nova usluga' }}</h2>
    <mat-dialog-content class="flex flex-col gap-3 min-w-[400px]">
      <mat-form-field>
        <mat-label>Naziv</mat-label>
        <input matInput [formControl]="form.controls.naziv" />
      </mat-form-field>
      <mat-form-field>
        <mat-label>Opis</mat-label>
        <textarea matInput [formControl]="form.controls.opis" rows="2"></textarea>
      </mat-form-field>
      <div class="flex gap-3">
        <mat-form-field class="flex-1">
          <mat-label>Trajanje (min)</mat-label>
          <input matInput type="number" [formControl]="form.controls.trajanjeMinuta" />
        </mat-form-field>
        <mat-form-field class="flex-1">
          <mat-label>Cena (RSD)</mat-label>
          <input matInput type="number" [formControl]="form.controls.cena" />
        </mat-form-field>
      </div>
      <mat-form-field>
        <mat-label>Specijalizacija</mat-label>
        <mat-select [formControl]="form.controls.specializationId">
          @for (s of specializations(); track s.specializationId) {
            <mat-option [value]="s.specializationId">{{ s.naziv }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Otkaži</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">Sačuvaj</button>
    </mat-dialog-actions>
  `,
})
export class ServiceDialogComponent implements OnInit {
  data = inject<any | null>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ServiceDialogComponent>);
  private fb = inject(FormBuilder);
  private api = inject(ApiService);

  specializations = signal<Specialization[]>([]);

  form = this.fb.nonNullable.group({
    naziv: [this.data?.naziv ?? '', Validators.required],
    opis: [this.data?.opis ?? ''],
    trajanjeMinuta: [this.data?.trajanjeMinuta ?? 30, [Validators.required, Validators.min(1)]],
    cena: [this.data?.cena ?? 0, [Validators.required, Validators.min(0)]],
    specializationId: [this.data?.specializationId ?? 0, Validators.required],
  });

  ngOnInit(): void {
    this.api.get<Specialization[]>('specializations').subscribe(s => this.specializations.set(s));
  }

  save(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
