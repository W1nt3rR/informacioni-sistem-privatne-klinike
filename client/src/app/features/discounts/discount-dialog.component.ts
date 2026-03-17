import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '../../shared/services/dialog.service';
import { Discount } from './discount.model';

@Component({
  selector: 'app-discount-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h3 class="font-bold text-lg">{{ data ? 'Izmeni popust' : 'Novi popust' }}</h3>
    <form [formGroup]="form" class="mt-4 space-y-3">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Naziv</legend>
        <input class="input w-full" formControlName="naziv" />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Tip</legend>
        <select class="select w-full" formControlName="tip">
          <option value="opsti">Opšti</option>
          <option value="student">Student</option>
          <option value="penzioner">Penzioner</option>
        </select>
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Procenat (%)</legend>
        <input class="input w-full" type="number" formControlName="procenat" min="0" max="100" />
      </fieldset>
      <div class="flex gap-3">
        <fieldset class="fieldset flex-1">
          <legend class="fieldset-legend">Važi od</legend>
          <input class="input w-full" type="date" formControlName="vaziOd" />
        </fieldset>
        <fieldset class="fieldset flex-1">
          <legend class="fieldset-legend">Važi do</legend>
          <input class="input w-full" type="date" formControlName="vaziDo" />
        </fieldset>
      </div>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" class="toggle" formControlName="aktivan" />
        Aktivan
      </label>
    </form>
    <div class="modal-action">
      <button class="btn" (click)="ref.close()">Otkaži</button>
      <button class="btn btn-primary" [disabled]="form.invalid" (click)="save()">Sačuvaj</button>
    </div>
  `,
})
export class DiscountDialogComponent {
  private fb = inject(FormBuilder);
  ref = inject(DialogRef);
  data = inject<Discount | null>(DIALOG_DATA);

  form = this.fb.group({
    naziv: [this.data?.naziv ?? '', Validators.required],
    tip: [this.data?.tip ?? 'opsti', Validators.required],
    procenat: [this.data?.procenat ?? 0, [Validators.required, Validators.min(0), Validators.max(100)]],
    vaziOd: [this.data?.vaziOd ?? ''],
    vaziDo: [this.data?.vaziDo ?? ''],
    aktivan: [this.data?.aktivan ?? true],
  });

  save(): void {
    if (this.form.valid) {
      const val = this.form.value;
      this.ref.close({
        ...val,
        vaziOd: val.vaziOd || null,
        vaziDo: val.vaziDo || null,
      });
    }
  }
}
