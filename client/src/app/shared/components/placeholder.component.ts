import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center h-full text-base-content/40 py-20">
      <span class="material-icons text-6xl mb-4">construction</span>
      <h2 class="text-xl font-medium mb-2">{{ title }}</h2>
      <p class="text-sm">Ovaj modul je u pripremi.</p>
    </div>
  `,
})
export class PlaceholderComponent {
  private route = inject(ActivatedRoute);
  title = this.route.snapshot.data['title'] ?? 'U pripremi';
}
