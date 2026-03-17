import { Routes } from '@angular/router';
import { WaitingListComponent } from './waiting-list.component';

export const WAITING_LIST_ROUTES: Routes = [
  { path: '', component: WaitingListComponent, data: { title: 'Lista čekanja' } },
];
