import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '../../shared/services/dialog.service';
import { ThemeService, DAISY_THEMES } from '../../shared/services/theme.service';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h3 class="font-bold text-lg">Podešavanja teme</h3>

    <div class="mt-4 flex flex-col gap-4">
      <!-- Mode selector -->
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Režim</legend>
        <div class="flex gap-2">
          @for (m of modes; track m.value) {
            <button
              class="btn btn-sm flex-1"
              [class.btn-primary]="mode() === m.value"
              [class.btn-ghost]="mode() !== m.value"
              (click)="setMode(m.value)">
              <span class="material-icons text-base">{{ m.icon }}</span>
              {{ m.label }}
            </button>
          }
        </div>
      </fieldset>

      <!-- Light theme -->
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Svetla tema</legend>
        <div class="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          @for (t of lightThemes; track t) {
            <button
              class="btn btn-sm btn-ghost justify-start"
              [class.btn-active]="lightTheme() === t"
              (click)="setLight(t)"
              [attr.data-theme]="t">
              <span class="flex gap-0.5">
                <span class="w-2 h-4 rounded-sm bg-primary"></span>
                <span class="w-2 h-4 rounded-sm bg-secondary"></span>
                <span class="w-2 h-4 rounded-sm bg-accent"></span>
                <span class="w-2 h-4 rounded-sm bg-neutral"></span>
              </span>
              <span class="text-xs">{{ t }}</span>
            </button>
          }
        </div>
      </fieldset>

      <!-- Dark theme -->
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Tamna tema</legend>
        <div class="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          @for (t of darkThemes; track t) {
            <button
              class="btn btn-sm btn-ghost justify-start"
              [class.btn-active]="darkTheme() === t"
              (click)="setDark(t)"
              [attr.data-theme]="t">
              <span class="flex gap-0.5">
                <span class="w-2 h-4 rounded-sm bg-primary"></span>
                <span class="w-2 h-4 rounded-sm bg-secondary"></span>
                <span class="w-2 h-4 rounded-sm bg-accent"></span>
                <span class="w-2 h-4 rounded-sm bg-neutral"></span>
              </span>
              <span class="text-xs">{{ t }}</span>
            </button>
          }
        </div>
      </fieldset>
    </div>

    <div class="modal-action">
      <button class="btn" (click)="dialogRef.close()">Zatvori</button>
    </div>
  `,
})
export class SettingsDialogComponent {
  dialogRef = inject(DialogRef);
  private theme = inject(ThemeService);

  lightThemes = DAISY_THEMES.light;
  darkThemes = DAISY_THEMES.dark;

  modes = [
    { value: 'light' as const, label: 'Svetlo', icon: 'light_mode' },
    { value: 'dark' as const, label: 'Tamno', icon: 'dark_mode' },
    { value: 'system' as const, label: 'Sistem', icon: 'contrast' },
  ];

  mode = signal(this.theme.config().mode);
  lightTheme = signal(this.theme.config().light);
  darkTheme = signal(this.theme.config().dark);

  setMode(m: 'light' | 'dark' | 'system'): void {
    this.mode.set(m);
    this.theme.update({ mode: m });
  }

  setLight(t: string): void {
    this.lightTheme.set(t);
    this.theme.update({ light: t });
  }

  setDark(t: string): void {
    this.darkTheme.set(t);
    this.theme.update({ dark: t });
  }
}
