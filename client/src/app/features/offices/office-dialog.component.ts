import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '../../shared/services/dialog.service';
import { Office } from './office.model';

@Component({
  selector: 'app-office-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h3 class="font-bold text-lg">{{ data ? 'Izmeni ordinaciju' : 'Nova ordinacija' }}</h3>
    <form [formGroup]="form" class="mt-4 space-y-3">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Naziv</legend>
        <input class="input w-full" formControlName="naziv" />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Lokacija</legend>
        <input class="input w-full" formControlName="lokacija" />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Oprema</legend>
        <textarea class="textarea w-full" formControlName="oprema" rows="3"></textarea>
      </fieldset>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" class="toggle" formControlName="dostupna" />
        Dostupna
      </label>
    </form>
    <div class="modal-action">
      <button class="btn" (click)="ref.close()">Otkaži</button>
      <button class="btn btn-primary" [disabled]="form.invalid" (click)="save()">Sačuvaj</button>
    </div>
  `,
})
export class OfficeDialogComponent {
  private fb = inject(FormBuilder);
  ref = inject(DialogRef);
  data = inject<Office | null>(DIALOG_DATA);

  form = this.fb.group({
    naziv: [this.data?.naziv ?? '', Validators.required],
    lokacija: [this.data?.lokacija ?? ''],
    oprema: [this.data?.oprema ?? ''],
    dostupna: [this.data?.dostupna ?? true],
  });

  save(): void {
    if (this.form.valid) {
      this.ref.close(this.form.value);
    }
  }
}
