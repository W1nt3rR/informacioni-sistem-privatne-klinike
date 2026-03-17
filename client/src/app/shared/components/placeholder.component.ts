import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  template: `
    <div class="flex flex-col items-center justify-center h-full text-slate-400 py-20">
      <mat-icon class="text-6xl mb-4" style="font-size: 64px; width: 64px; height: 64px;">construction</mat-icon>
      <h2 class="text-xl font-medium mb-2">{{ title }}</h2>
      <p class="text-sm">Ovaj modul je u pripremi.</p>
    </div>
  `,
})
export class PlaceholderComponent {
  private route = inject(ActivatedRoute);
  title = this.route.snapshot.data['title'] ?? 'U pripremi';
}
