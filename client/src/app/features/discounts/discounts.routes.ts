import { Routes } from '@angular/router';
import { PlaceholderComponent } from '../../shared/components/placeholder.component';

export const DISCOUNT_ROUTES: Routes = [
  { path: '', component: PlaceholderComponent, data: { title: 'Popusti' } },
];
