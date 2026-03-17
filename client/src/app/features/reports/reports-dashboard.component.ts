import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../shared/services/api.service';

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTabsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatDatepickerModule,
    MatNativeDateModule, MatCardModule, MatProgressBarModule],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Izveštaji</h1>

      <!-- Date Range Filter -->
      <div class="flex gap-4 mb-6 items-center">
        <mat-form-field class="w-48">
          <mat-label>Od</mat-label>
          <input matInput [matDatepicker]="fromPicker" [(ngModel)]="fromDate">
          <mat-datepicker-toggle matSuffix [for]="fromPicker"/>
          <mat-datepicker #fromPicker/>
        </mat-form-field>
        <mat-form-field class="w-48">
          <mat-label>Do</mat-label>
          <input matInput [matDatepicker]="toPicker" [(ngModel)]="toDate">
          <mat-datepicker-toggle matSuffix [for]="toPicker"/>
          <mat-datepicker #toPicker/>
        </mat-form-field>
        <button mat-raised-button color="primary" (click)="loadAll()">
          <mat-icon>refresh</mat-icon> Učitaj
        </button>
      </div>

      <mat-tab-group>
        <!-- Examinations -->
        <mat-tab label="Pregledi">
          <div class="p-4">
            @if (examReport(); as r) {
              <div class="grid grid-cols-3 gap-4 mb-6">
                <mat-card><mat-card-content class="p-4 text-center">
                  <p class="text-3xl font-bold">{{ r.totalCount }}</p>
                  <p class="text-gray-500">Ukupno pregleda</p>
                </mat-card-content></mat-card>
              </div>

              <h3 class="font-semibold mb-2">Po doktoru</h3>
              <table mat-table [dataSource]="r.byDoctor" class="w-full mb-6">
                <ng-container matColumnDef="doctor">
                  <th mat-header-cell *matHeaderCellDef>Doktor</th>
                  <td mat-cell *matCellDef="let d">{{ d.doctorName }}</td>
                </ng-container>
                <ng-container matColumnDef="count">
                  <th mat-header-cell *matHeaderCellDef>Ukupno</th>
                  <td mat-cell *matCellDef="let d">{{ d.count }}</td>
                </ng-container>
                <ng-container matColumnDef="completed">
                  <th mat-header-cell *matHeaderCellDef>Završeni</th>
                  <td mat-cell *matCellDef="let d">{{ d.completed }}</td>
                </ng-container>
                <ng-container matColumnDef="cancelled">
                  <th mat-header-cell *matHeaderCellDef>Otkazani</th>
                  <td mat-cell *matCellDef="let d">{{ d.cancelled }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="['doctor','count','completed','cancelled']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['doctor','count','completed','cancelled'];"></tr>
              </table>

              <h3 class="font-semibold mb-2">Po usluzi</h3>
              <table mat-table [dataSource]="r.byService" class="w-full">
                <ng-container matColumnDef="service">
                  <th mat-header-cell *matHeaderCellDef>Usluga</th>
                  <td mat-cell *matCellDef="let s">{{ s.serviceName }}</td>
                </ng-container>
                <ng-container matColumnDef="count">
                  <th mat-header-cell *matHeaderCellDef>Broj</th>
                  <td mat-cell *matCellDef="let s">{{ s.count }}</td>
                </ng-container>
                <ng-container matColumnDef="bar">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let s" class="w-48">
                    <mat-progress-bar mode="determinate"
                      [value]="(s.count / r.totalCount) * 100"></mat-progress-bar>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="['service','count','bar']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['service','count','bar'];"></tr>
              </table>
            } @else {
              <p class="text-gray-500">Kliknite "Učitaj" za prikaz</p>
            }
          </div>
        </mat-tab>

        <!-- Revenue -->
        <mat-tab label="Prihodi">
          <div class="p-4">
            @if (revenueReport(); as r) {
              <div class="grid grid-cols-3 gap-4 mb-6">
                <mat-card><mat-card-content class="p-4 text-center">
                  <p class="text-3xl font-bold">{{ r.totalRevenue | number:'1.2-2' }}</p>
                  <p class="text-gray-500">Ukupan prihod (RSD)</p>
                </mat-card-content></mat-card>
                <mat-card><mat-card-content class="p-4 text-center">
                  <p class="text-3xl font-bold">{{ r.paymentCount }}</p>
                  <p class="text-gray-500">Broj uplata</p>
                </mat-card-content></mat-card>
              </div>

              <h3 class="font-semibold mb-2">Dnevni trend</h3>
              <table mat-table [dataSource]="r.daily" class="w-full mb-6">
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Datum</th>
                  <td mat-cell *matCellDef="let d">{{ d.date | date:'dd.MM.yyyy.' }}</td>
                </ng-container>
                <ng-container matColumnDef="revenue">
                  <th mat-header-cell *matHeaderCellDef>Prihod</th>
                  <td mat-cell *matCellDef="let d">{{ d.revenue | number:'1.2-2' }} RSD</td>
                </ng-container>
                <ng-container matColumnDef="count">
                  <th mat-header-cell *matHeaderCellDef>Uplata</th>
                  <td mat-cell *matCellDef="let d">{{ d.count }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="['date','revenue','count']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['date','revenue','count'];"></tr>
              </table>

              <h3 class="font-semibold mb-2">Po usluzi</h3>
              <table mat-table [dataSource]="r.byService" class="w-full">
                <ng-container matColumnDef="service">
                  <th mat-header-cell *matHeaderCellDef>Usluga</th>
                  <td mat-cell *matCellDef="let s">{{ s.serviceName }}</td>
                </ng-container>
                <ng-container matColumnDef="revenue">
                  <th mat-header-cell *matHeaderCellDef>Prihod</th>
                  <td mat-cell *matCellDef="let s">{{ s.revenue | number:'1.2-2' }} RSD</td>
                </ng-container>
                <ng-container matColumnDef="count">
                  <th mat-header-cell *matHeaderCellDef>Količina</th>
                  <td mat-cell *matCellDef="let s">{{ s.count }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="['service','revenue','count']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['service','revenue','count'];"></tr>
              </table>
            } @else {
              <p class="text-gray-500">Kliknite "Učitaj" za prikaz</p>
            }
          </div>
        </mat-tab>

        <!-- Cancellations -->
        <mat-tab label="Otkazivanja">
          <div class="p-4">
            @if (cancelReport(); as r) {
              <div class="grid grid-cols-4 gap-4 mb-6">
                <mat-card><mat-card-content class="p-4 text-center">
                  <p class="text-3xl font-bold">{{ r.totalCancellations }}</p>
                  <p class="text-gray-500">Ukupno otkazivanja</p>
                </mat-card-content></mat-card>
                @for (t of r.byType; track t.status) {
                  <mat-card><mat-card-content class="p-4 text-center">
                    <p class="text-2xl font-bold">{{ t.count }}</p>
                    <p class="text-gray-500">{{ formatStatus(t.status) }}</p>
                  </mat-card-content></mat-card>
                }
              </div>

              <table mat-table [dataSource]="r.details" class="w-full">
                <ng-container matColumnDef="patient">
                  <th mat-header-cell *matHeaderCellDef>Pacijent</th>
                  <td mat-cell *matCellDef="let d">{{ d.patient }}</td>
                </ng-container>
                <ng-container matColumnDef="service">
                  <th mat-header-cell *matHeaderCellDef>Usluga</th>
                  <td mat-cell *matCellDef="let d">{{ d.service }}</td>
                </ng-container>
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Datum</th>
                  <td mat-cell *matCellDef="let d">{{ d.datumVreme | date:'dd.MM.yyyy. HH:mm' }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Tip</th>
                  <td mat-cell *matCellDef="let d">{{ formatStatus(d.status) }}</td>
                </ng-container>
                <ng-container matColumnDef="razlog">
                  <th mat-header-cell *matHeaderCellDef>Razlog</th>
                  <td mat-cell *matCellDef="let d">{{ d.razlogOtkazivanja || '—' }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="['patient','service','date','status','razlog']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['patient','service','date','status','razlog'];"></tr>
              </table>
            } @else {
              <p class="text-gray-500">Kliknite "Učitaj" za prikaz</p>
            }
          </div>
        </mat-tab>

        <!-- Utilization -->
        <mat-tab label="Iskorišćenost">
          <div class="p-4">
            @if (utilReport(); as r) {
              <h3 class="font-semibold mb-2">Po ordinaciji</h3>
              <table mat-table [dataSource]="r.byOffice" class="w-full mb-6">
                <ng-container matColumnDef="office">
                  <th mat-header-cell *matHeaderCellDef>Ordinacija</th>
                  <td mat-cell *matCellDef="let o">{{ o.officeName }}</td>
                </ng-container>
                <ng-container matColumnDef="total">
                  <th mat-header-cell *matHeaderCellDef>Ukupno</th>
                  <td mat-cell *matCellDef="let o">{{ o.totalAppointments }}</td>
                </ng-container>
                <ng-container matColumnDef="completed">
                  <th mat-header-cell *matHeaderCellDef>Realizovani</th>
                  <td mat-cell *matCellDef="let o">{{ o.completed }}</td>
                </ng-container>
                <ng-container matColumnDef="cancelled">
                  <th mat-header-cell *matHeaderCellDef>Otkazani</th>
                  <td mat-cell *matCellDef="let o">{{ o.cancelled }}</td>
                </ng-container>
                <ng-container matColumnDef="util">
                  <th mat-header-cell *matHeaderCellDef>Stopa</th>
                  <td mat-cell *matCellDef="let o" class="w-40">
                    @if (o.totalAppointments > 0) {
                      <mat-progress-bar mode="determinate"
                        [value]="(o.completed / o.totalAppointments) * 100"></mat-progress-bar>
                    }
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="['office','total','completed','cancelled','util']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['office','total','completed','cancelled','util'];"></tr>
              </table>

              <h3 class="font-semibold mb-2">Po doktoru</h3>
              <table mat-table [dataSource]="r.byDoctor" class="w-full">
                <ng-container matColumnDef="doctor">
                  <th mat-header-cell *matHeaderCellDef>Doktor</th>
                  <td mat-cell *matCellDef="let d">{{ d.doctorName }}</td>
                </ng-container>
                <ng-container matColumnDef="total">
                  <th mat-header-cell *matHeaderCellDef>Termina</th>
                  <td mat-cell *matCellDef="let d">{{ d.totalAppointments }}</td>
                </ng-container>
                <ng-container matColumnDef="completed">
                  <th mat-header-cell *matHeaderCellDef>Realizovani</th>
                  <td mat-cell *matCellDef="let d">{{ d.completed }}</td>
                </ng-container>
                <ng-container matColumnDef="minutes">
                  <th mat-header-cell *matHeaderCellDef>Ukupno minuta</th>
                  <td mat-cell *matCellDef="let d">{{ d.totalMinutes }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="['doctor','total','completed','minutes']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['doctor','total','completed','minutes'];"></tr>
              </table>
            } @else {
              <p class="text-gray-500">Kliknite "Učitaj" za prikaz</p>
            }
          </div>
        </mat-tab>

        <!-- Popular Services -->
        <mat-tab label="Popularne usluge">
          <div class="p-4">
            @if (popularReport(); as r) {
              <table mat-table [dataSource]="r.services" class="w-full">
                <ng-container matColumnDef="rank">
                  <th mat-header-cell *matHeaderCellDef>#</th>
                  <td mat-cell *matCellDef="let s; let i = index">{{ i + 1 }}</td>
                </ng-container>
                <ng-container matColumnDef="service">
                  <th mat-header-cell *matHeaderCellDef>Usluga</th>
                  <td mat-cell *matCellDef="let s">{{ s.serviceName }}</td>
                </ng-container>
                <ng-container matColumnDef="price">
                  <th mat-header-cell *matHeaderCellDef>Cena</th>
                  <td mat-cell *matCellDef="let s">{{ s.cena | number:'1.2-2' }}</td>
                </ng-container>
                <ng-container matColumnDef="count">
                  <th mat-header-cell *matHeaderCellDef>Termina</th>
                  <td mat-cell *matCellDef="let s">{{ s.appointmentCount }}</td>
                </ng-container>
                <ng-container matColumnDef="revenue">
                  <th mat-header-cell *matHeaderCellDef>Prihod</th>
                  <td mat-cell *matCellDef="let s">{{ s.revenue | number:'1.2-2' }} RSD</td>
                </ng-container>
                <ng-container matColumnDef="bar">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let s" class="w-40">
                    @if (maxAppointments() > 0) {
                      <mat-progress-bar mode="determinate"
                        [value]="(s.appointmentCount / maxAppointments()) * 100"></mat-progress-bar>
                    }
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="['rank','service','price','count','revenue','bar']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['rank','service','price','count','revenue','bar'];"></tr>
              </table>
            } @else {
              <p class="text-gray-500">Kliknite "Učitaj" za prikaz</p>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `
})
export class ReportsDashboardComponent {
  private api = inject(ApiService);

  fromDate = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  toDate = new Date();

  examReport = signal<any>(null);
  revenueReport = signal<any>(null);
  cancelReport = signal<any>(null);
  utilReport = signal<any>(null);
  popularReport = signal<any>(null);
  maxAppointments = signal(0);

  loadAll() {
    const params = `from=${this.fromDate.toISOString()}&to=${this.toDate.toISOString()}`;
    this.api.get<any>(`reports/examinations?${params}`).subscribe(r => this.examReport.set(r));
    this.api.get<any>(`reports/revenue?${params}`).subscribe(r => this.revenueReport.set(r));
    this.api.get<any>(`reports/cancellations?${params}`).subscribe(r => this.cancelReport.set(r));
    this.api.get<any>(`reports/utilization?${params}`).subscribe(r => this.utilReport.set(r));
    this.api.get<any>(`reports/popular-services?${params}`).subscribe(r => {
      this.popularReport.set(r);
      const max = r.services?.reduce((m: number, s: any) => Math.max(m, s.appointmentCount), 0) ?? 0;
      this.maxAppointments.set(max);
    });
  }

  formatStatus(s: string): string {
    switch (s) {
      case 'otkazao_pacijent': return 'Otkazao pacijent';
      case 'otkazala_klinika': return 'Otkazala klinika';
      case 'nije_se_pojavio': return 'Nije se pojavio';
      default: return s;
    }
  }
}
