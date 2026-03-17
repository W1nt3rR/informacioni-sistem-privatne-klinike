import { Routes } from '@angular/router';
import { PlaceholderComponent } from '../../shared/components/placeholder.component';

export const NOTIFICATION_ROUTES: Routes = [
  { path: '', component: PlaceholderComponent, data: { title: 'Obaveštenja' } },
];
