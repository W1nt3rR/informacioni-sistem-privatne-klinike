import { Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="toast toast-end toast-top z-[9999]">
      @for (t of toastService.toasts(); track t.id) {
        <div class="alert"
             [class.alert-success]="t.type === 'success'"
             [class.alert-error]="t.type === 'error'"
             [class.alert-info]="t.type === 'info'"
             [class.alert-warning]="t.type === 'warning'">
          <span>{{ t.message }}</span>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
