import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '../../shared/services/dialog.service';
import { ApiService } from '../../shared/services/api.service';

interface Specialization {
  specializationId: number;
  naziv: string;
}

@Component({
  selector: 'app-service-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h3 class="font-bold text-lg">{{ data ? 'Izmeni uslugu' : 'Nova usluga' }}</h3>
    <div class="mt-4 space-y-3">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Naziv</legend>
        <input class="input w-full" [formControl]="form.controls.naziv" />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Opis</legend>
        <textarea class="textarea w-full" [formControl]="form.controls.opis" rows="2"></textarea>
      </fieldset>
      <div class="flex gap-3">
        <fieldset class="fieldset flex-1">
          <legend class="fieldset-legend">Trajanje (min)</legend>
          <input class="input w-full" type="number" [formControl]="form.controls.trajanjeMinuta" />
        </fieldset>
        <fieldset class="fieldset flex-1">
          <legend class="fieldset-legend">Cena (RSD)</legend>
          <input class="input w-full" type="number" [formControl]="form.controls.cena" />
        </fieldset>
      </div>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Specijalizacija</legend>
        <select class="select w-full" [formControl]="form.controls.specializationId">
          <option [value]="0" disabled>Izaberi</option>
          @for (s of specializations(); track s.specializationId) {
            <option [value]="s.specializationId">{{ s.naziv }}</option>
          }
        </select>
      </fieldset>
    </div>
    <div class="modal-action">
      <button class="btn" (click)="ref.close()">Otkaži</button>
      <button class="btn btn-primary" (click)="save()" [disabled]="form.invalid">Sačuvaj</button>
    </div>
  `,
})
export class ServiceDialogComponent implements OnInit {
  data = inject<any | null>(DIALOG_DATA);
  ref = inject(DialogRef);
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
    this.ref.close(this.form.getRawValue());
  }
}
