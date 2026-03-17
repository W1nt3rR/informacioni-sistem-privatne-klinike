import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../shared/services/api.service';

interface PortalMessage {
  messageId: number;
  posiljalacTip: string;
  posiljalacId: number;
  sadrzaj: string;
  datumSlanja: string;
  procitana: boolean;
}

@Component({
  selector: 'app-portal-messages',
  standalone: true,
  imports: [
    DatePipe, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatListModule, MatDividerModule,
  ],
  template: `
    <h2 class="text-2xl font-semibold text-slate-800 mb-6">Poruke</h2>

    <!-- New message -->
    <mat-card class="mb-4">
      <mat-card-header>
        <mat-card-title class="!text-base">Nova poruka</mat-card-title>
      </mat-card-header>
      <mat-card-content class="mt-3">
        <form (ngSubmit)="sendMessage()" class="flex gap-3 items-end">
          <mat-form-field class="flex-1">
            <mat-label>Poruka</mat-label>
            <textarea matInput [(ngModel)]="newMessage" name="msg" rows="2"
                      placeholder="Napišite poruku osoblju klinike..." required></textarea>
          </mat-form-field>
          <button mat-flat-button color="primary" type="submit"
                  [disabled]="!newMessage.trim() || sending()">
            <mat-icon>send</mat-icon> Pošalji
          </button>
        </form>
      </mat-card-content>
    </mat-card>

    <!-- Message list -->
    <mat-card>
      <mat-card-content>
        @if (messages().length === 0) {
          <p class="text-slate-500 text-center py-8">Nemate poruke.</p>
        } @else {
          <mat-list>
            @for (m of messages(); track m.messageId) {
              <mat-list-item class="!h-auto !py-3">
                <div class="flex items-start gap-3 w-full">
                  <mat-icon [class]="m.posiljalacTip === 'pacijent'
                    ? 'text-blue-500' : 'text-green-500'">
                    {{ m.posiljalacTip === 'pacijent' ? 'person' : 'support_agent' }}
                  </mat-icon>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-xs font-medium"
                            [class]="m.posiljalacTip === 'pacijent'
                              ? 'text-blue-600' : 'text-green-600'">
                        {{ m.posiljalacTip === 'pacijent' ? 'Vi' : 'Klinika' }}
                      </span>
                      <span class="text-xs text-slate-400">
                        {{ m.datumSlanja | date:'dd.MM.yyyy HH:mm' }}
                      </span>
                      @if (!m.procitana && m.posiljalacTip !== 'pacijent') {
                        <span class="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">Novo</span>
                      }
                    </div>
                    <p class="text-sm text-slate-700 m-0 whitespace-pre-wrap">{{ m.sadrzaj }}</p>
                  </div>
                </div>
              </mat-list-item>
              <mat-divider />
            }
          </mat-list>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class PortalMessagesComponent implements OnInit {
  private api = inject(ApiService);

  messages = signal<PortalMessage[]>([]);
  newMessage = '';
  sending = signal(false);

  ngOnInit() {
    this.loadMessages();
  }

  loadMessages(): void {
    this.api.get<PortalMessage[]>('portal/messages').subscribe(d => this.messages.set(d));
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    this.sending.set(true);
    this.api.post('portal/messages', { sadrzaj: this.newMessage.trim() }).subscribe({
      next: () => {
        this.sending.set(false);
        this.newMessage = '';
        this.loadMessages();
      },
      error: () => this.sending.set(false),
    });
  }
}
