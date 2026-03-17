import { Routes } from '@angular/router';
import { PlaceholderComponent } from '../../shared/components/placeholder.component';

export const PATIENT_ROUTES: Routes = [
  { path: '', component: PlaceholderComponent, data: { title: 'Pacijenti' } },
];
