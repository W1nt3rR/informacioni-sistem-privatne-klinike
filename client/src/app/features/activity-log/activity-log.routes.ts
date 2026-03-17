import { Routes } from '@angular/router';
import { PlaceholderComponent } from '../../shared/components/placeholder.component';

export const ACTIVITY_LOG_ROUTES: Routes = [
  { path: '', component: PlaceholderComponent, data: { title: 'Evidencija aktivnosti' } },
];
