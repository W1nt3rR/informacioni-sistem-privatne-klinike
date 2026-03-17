import { Routes } from '@angular/router';
import { PlaceholderComponent } from '../../shared/components/placeholder.component';

export const WORKING_HOURS_ROUTES: Routes = [
  { path: '', component: PlaceholderComponent, data: { title: 'Radno vreme' } },
];
