import { Routes } from '@angular/router';
import { PlaceholderComponent } from '../../shared/components/placeholder.component';

export const DIAGNOSIS_ROUTES: Routes = [
  { path: '', component: PlaceholderComponent, data: { title: 'Dijagnoze' } },
];
