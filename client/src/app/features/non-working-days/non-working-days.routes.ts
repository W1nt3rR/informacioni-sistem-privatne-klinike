import { Routes } from '@angular/router';
import { PlaceholderComponent } from '../../shared/components/placeholder.component';

export const NON_WORKING_DAYS_ROUTES: Routes = [
  { path: '', component: PlaceholderComponent, data: { title: 'Neradni dani' } },
];
