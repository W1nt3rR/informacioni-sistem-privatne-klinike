import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '../../shared/services/dialog.service';
import { ApiService } from '../../shared/services/api.service';

interface Specialization {
  specializationId: number;
  naziv: string;
}

@Component({
  selector: 'app-doctor-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h3 class="font-bold text-lg">{{ data ? 'Izmeni lekara' : 'Novi lekar' }}</h3>
    <div class="mt-4 space-y-3">
      <div class="flex gap-3">
        <fieldset class="fieldset flex-1">
          <legend class="fieldset-legend">Ime</legend>
          <input class="input w-full" [formControl]="form.controls.ime" />
        </fieldset>
        <fieldset class="fieldset flex-1">
          <legend class="fieldset-legend">Prezime</legend>
          <input class="input w-full" [formControl]="form.controls.prezime" />
        </fieldset>
      </div>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Email</legend>
        <input class="input w-full" type="email" [formControl]="form.controls.email" />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Telefon</legend>
        <input class="input w-full" [formControl]="form.controls.telefon" />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Specijalizacija</legend>
        <select class="select w-full" [formControl]="form.controls.specializationId">
          <option [ngValue]="0" disabled>Izaberite...</option>
          @for (s of specializations(); track s.specializationId) {
            <option [ngValue]="s.specializationId">{{ s.naziv }}</option>
          }
        </select>
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Titula</legend>
        <input class="input w-full" [formControl]="form.controls.titula" />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Broj licence</legend>
        <input class="input w-full" [formControl]="form.controls.licencaBroj" />
      </fieldset>
      @if (!data) {
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Korisničko ime</legend>
          <input class="input w-full" [formControl]="form.controls.userName" />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Lozinka</legend>
          <input class="input w-full" type="password" [formControl]="form.controls.password" />
        </fieldset>
      }
    </div>
    <div class="modal-action">
      <button class="btn" (click)="dialogRef.close(null)">Otkaži</button>
      <button class="btn btn-primary" (click)="save()" [disabled]="form.invalid">Sačuvaj</button>
    </div>
  `,
})
export class DoctorDialogComponent implements OnInit {
  data = inject(DIALOG_DATA) as any;
  dialogRef = inject(DialogRef);
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
