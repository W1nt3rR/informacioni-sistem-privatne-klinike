import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { ApiService } from '../../shared/services/api.service';
import { Patient } from './patient.model';

@Component({
  selector: 'app-patient-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h3 class="font-bold text-lg">{{ data ? 'Izmeni pacijenta' : 'Novi pacijent' }}</h3>
    <form [formGroup]="form" (ngSubmit)="save()">
      <div class="grid grid-cols-2 gap-3">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Ime</legend>
          <input class="input w-full" formControlName="ime" />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Prezime</legend>
          <input class="input w-full" formControlName="prezime" />
        </fieldset>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">JMBG</legend>
          <input class="input w-full" formControlName="jmbg" maxlength="13" />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Pol</legend>
          <select class="select w-full" formControlName="pol">
            <option value="" disabled>Izaberite</option>
            <option value="M">Muški</option>
            <option value="Ž">Ženski</option>
          </select>
        </fieldset>
      </div>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Datum rođenja</legend>
        <input type="date" class="input w-full" formControlName="datumRodjenja" />
      </fieldset>
      <div class="grid grid-cols-2 gap-3">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Telefon</legend>
          <input class="input w-full" formControlName="telefon" />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Email</legend>
          <input type="email" class="input w-full" formControlName="email" />
        </fieldset>
      </div>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Adresa</legend>
        <input class="input w-full" formControlName="adresa" />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Broj osiguranja</legend>
        <input class="input w-full" formControlName="brojOsiguranja" />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Napomene</legend>
        <textarea class="textarea w-full" formControlName="napomene" rows="2"></textarea>
      </fieldset>
      <div class="modal-action">
        <button class="btn" type="button" (click)="dialogRef.close()">Otkaži</button>
        <button class="btn btn-primary" type="submit" [disabled]="form.invalid">
          {{ data ? 'Sačuvaj' : 'Kreiraj' }}
        </button>
      </div>
    </form>
  `,
})
export class PatientDialogComponent {
  data = inject<Patient | null>(DIALOG_DATA);
  dialogRef = inject(DialogRef);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    ime: [this.data?.ime ?? '', Validators.required],
    prezime: [this.data?.prezime ?? '', Validators.required],
    jmbg: [this.data?.jmbg ?? '', [Validators.required, Validators.minLength(13), Validators.maxLength(13)]],
    datumRodjenja: [this.data?.datumRodjenja ?? '', Validators.required],
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
        this.toast.success(this.data ? 'Pacijent ažuriran' : 'Pacijent kreiran');
        this.dialogRef.close(true);
      },
      error: () => this.toast.error('Greška pri čuvanju'),
    });
  }
}
