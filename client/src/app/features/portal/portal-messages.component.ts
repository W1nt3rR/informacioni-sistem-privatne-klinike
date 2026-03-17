import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [DatePipe, FormsModule],
  template: `
    <h2 class="text-2xl font-semibold mb-6">Poruke</h2>

    <!-- New message -->
    <div class="card bg-base-100 shadow-sm mb-4">
      <div class="card-body">
        <h3 class="card-title text-base">Nova poruka</h3>
        <form (ngSubmit)="sendMessage()" class="flex gap-3 items-end mt-2">
          <fieldset class="fieldset flex-1">
            <textarea class="textarea w-full" [(ngModel)]="newMessage" name="msg" rows="2"
                      placeholder="Napišite poruku osoblju klinike..." required></textarea>
          </fieldset>
          <button class="btn btn-primary" type="submit"
                  [disabled]="!newMessage.trim() || sending()">
            <span class="material-icons text-sm">send</span> Pošalji
          </button>
        </form>
      </div>
    </div>

    <!-- Message list -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        @if (messages().length === 0) {
          <p class="text-base-content/60 text-center py-8">Nemate poruke.</p>
        } @else {
          <div class="flex flex-col divide-y divide-base-300">
            @for (m of messages(); track m.messageId) {
              <div class="flex items-start gap-3 py-3">
                <span class="material-icons" [class]="m.posiljalacTip === 'pacijent' ? 'text-info' : 'text-success'">
                  {{ m.posiljalacTip === 'pacijent' ? 'person' : 'support_agent' }}
                </span>
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-medium" [class]="m.posiljalacTip === 'pacijent' ? 'text-info' : 'text-success'">
                      {{ m.posiljalacTip === 'pacijent' ? 'Vi' : 'Klinika' }}
                    </span>
                    <span class="text-xs text-base-content/60">
                      {{ m.datumSlanja | date:'dd.MM.yyyy HH:mm' }}
                    </span>
                    @if (!m.procitana && m.posiljalacTip !== 'pacijent') {
                      <span class="badge badge-info badge-sm">Novo</span>
                    }
                  </div>
                  <p class="text-sm m-0 whitespace-pre-wrap">{{ m.sadrzaj }}</p>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
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
