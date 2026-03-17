import { Routes } from '@angular/router';
import { PlaceholderComponent } from '../../shared/components/placeholder.component';

export const EXAMINATION_ROUTES: Routes = [
  { path: '', component: PlaceholderComponent, data: { title: 'Pregledi' } },
];
