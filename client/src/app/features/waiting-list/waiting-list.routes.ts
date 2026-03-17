import { Routes } from '@angular/router';
import { PlaceholderComponent } from '../../shared/components/placeholder.component';

export const WAITING_LIST_ROUTES: Routes = [
  { path: '', component: PlaceholderComponent, data: { title: 'Lista čekanja' } },
];
