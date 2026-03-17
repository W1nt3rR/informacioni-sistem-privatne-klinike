import { Routes } from '@angular/router';
import { InvoiceListComponent } from './invoice-list.component';
import { InvoiceDetailComponent } from './invoice-detail.component';

export const INVOICE_ROUTES: Routes = [
  { path: '', component: InvoiceListComponent },
  { path: ':id', component: InvoiceDetailComponent },
];
