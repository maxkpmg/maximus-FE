import { Component, AfterViewInit, Output, EventEmitter, ChangeDetectorRef, Input, OnInit } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { TimeReport } from '../../../../interfaces';
import { LoadingSpinnerComponent } from '../../../loading-spinner/loading-spinner.component';

@Component({
  selector: 'ProjectConfirmationComponent',
  standalone: true,
  imports: [LoadingSpinnerComponent],
  templateUrl: './project-confirmation.component.html',
  styleUrl: './project-confirmation.component.css',
  animations: [
    trigger('openClose', [
      state('open', style({ opacity: 1 })),
      state('closed', style({ opacity: 0 })),
      transition('closed => open', [animate(150)]),
      transition('open => closed', [animate(150)])
    ])
  ]
})
export class ProjectConfirmationComponent implements OnInit, AfterViewInit {
  @Input() timeReports: TimeReport[];
  @Input() filteredTimeReports: TimeReport[];
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
        this.msg = 'Are you sure you want to archive the project?';
        this.confirmText = 'Archive';
        break;

      case 'reactivate':
        this.msg = 'Are you sure you want to reactivate the project?';
        this.confirmText = 'Reactivate';
        break;

      case 'delete report':
        this.msg = 'Are you sure you want to delete this log?';
        this.confirmText = 'Delete';
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
        path = 'archive-project'
        break;
      case 'reactivate':
        path = 'reactivate-project'
        break;
      case 'delete report':
        path = 'delete-time-report'
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
