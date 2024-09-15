import { Component, AfterViewInit, Output, EventEmitter, ChangeDetectorRef, Input, OnInit } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { LoadingSpinnerComponent } from '../../../loading-spinner/loading-spinner.component';

@Component({
  selector: 'UserConfirmationComponent',
  standalone: true,
  imports: [LoadingSpinnerComponent],
  templateUrl: './user-confirmation.component.html',
  styleUrl: './user-confirmation.component.css',
  animations: [
    trigger('openClose', [
      state('open', style({ opacity: 1 })),
      state('closed', style({ opacity: 0 })),
      transition('closed => open', [animate(150)]),
      transition('open => closed', [animate(150)])
    ])
  ]
})
export class UserConfirmationComponent implements OnInit, AfterViewInit {
  @Input() action: { type: string, id: number };
  @Output() confirm = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  msg: string;
  confirmText: string;
  state = 'closed';
  isLoading: boolean = false;
  isError: boolean = false;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    switch (this.action.type) {
      case 'archive':
        this.msg = 'Are you sure you want to archive the user?';
        this.confirmText = 'Archive';
        break;

      case 'reactivate':
        this.msg = 'Are you sure you want to reactivate the user?';
        this.confirmText = 'Reactivate';
    }
  }

  ngAfterViewInit(): void {
    this.state = 'open';
    this.cdr.detectChanges();
  }

  closeAction(): void {
    this.state = 'closed';
    this.cdr.detectChanges();
    this.close.emit();
  }

  async confirmAction(): Promise<void> {
    this.isLoading = true;
    let path = '';
    switch (this.action.type) {
      case 'archive':
        path = 'archive-user'
        break;
      case 'reactivate':
        path = 'reactivate-user'
        break;
    }
    try {
      const response = await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/' + path, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: this.action.id })
      });
      if (response.ok) {
        this.confirm.emit();         
        this.isLoading = this.isError = false;
        this.closeAction();
      }
    } catch (e) {
      this.isLoading = false;
      this.isError = true;
      console.error('Error: ', e);
    }
  }
}
