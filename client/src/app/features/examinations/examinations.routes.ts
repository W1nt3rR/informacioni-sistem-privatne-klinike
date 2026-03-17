import { Routes } from '@angular/router';
import { ExaminationListComponent } from './examination-list.component';
import { ExaminationDetailComponent } from './examination-detail.component';

export const EXAMINATION_ROUTES: Routes = [
  { path: '', component: ExaminationListComponent },
  { path: ':id', component: ExaminationDetailComponent },
];
