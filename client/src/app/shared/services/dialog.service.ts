import {
  Injectable,
  ApplicationRef,
  createComponent,
  EnvironmentInjector,
  Injector,
  InjectionToken,
  Type,
  inject,
} from '@angular/core';
import { Subject } from 'rxjs';

export class DialogRef<R = any> {
  private readonly _afterClosed = new Subject<R | undefined>();
  afterClosed = this._afterClosed.asObservable();

  constructor(private _dialog: HTMLDialogElement, private _cleanup: () => void) {}

  close(result?: R): void {
    this._dialog.close();
    this._afterClosed.next(result);
    this._afterClosed.complete();
    this._cleanup();
  }
}

export const DIALOG_DATA = new InjectionToken<any>('DIALOG_DATA');

@Injectable({ providedIn: 'root' })
export class DialogService {
  private appRef = inject(ApplicationRef);
  private injector = inject(EnvironmentInjector);

  open<C, R = any>(component: Type<C>, data?: any): DialogRef<R> {
    const dialog = document.createElement('dialog');
    dialog.className = 'modal';

    const box = document.createElement('div');
    box.className = 'modal-box';
    dialog.appendChild(box);

    // backdrop click to close
    const backdrop = document.createElement('form');
    backdrop.method = 'dialog';
    backdrop.className = 'modal-backdrop';
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'close';
    backdrop.appendChild(closeBtn);
    dialog.appendChild(backdrop);

    document.body.appendChild(dialog);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
      dialog.remove();
    };

    const dialogRef = new DialogRef<R>(dialog, cleanup);

    const componentRef = createComponent(component, {
      environmentInjector: this.injector,
      hostElement: box,
      elementInjector: Injector.create({
        providers: [
          { provide: DialogRef, useValue: dialogRef },
          { provide: DIALOG_DATA, useValue: data },
        ],
        parent: this.injector,
      }),
    });

    this.appRef.attachView(componentRef.hostView);

    // close on backdrop click
    backdrop.addEventListener('submit', (e) => {
      e.preventDefault();
      dialogRef.close(undefined);
    });

    dialog.showModal();

    return dialogRef;
  }
}
