import { Component, ElementRef, Input, Output, ViewChild, EventEmitter, AfterViewInit, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { TimeReport, User } from '../../../../interfaces';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { LoadingSpinnerComponent } from '../../../loading-spinner/loading-spinner.component';

@Component({
  selector: 'TimeReportEditorComponent',
  standalone: true,
  imports: [FormsModule, CalendarModule, LoadingSpinnerComponent],
  templateUrl: './time-report-editor.component.html',
  styleUrl: './time-report-editor.component.css',
  animations: [
    trigger('openClose', [
      state('open', style({ opacity: 1 })),
      state('closed', style({ opacity: 0 })),
      transition('closed => open', [animate(150)]),
      transition('open => closed', [animate(150)])
    ])
  ]
})
export class TimeReportEditorComponent implements OnInit, AfterViewInit {
  @Input() timeReportId: number;
  @Input() projectId: number;
  @Input() timeReportToEdit: TimeReport;
  @Output() save = new EventEmitter<{ timeReport: TimeReport, isNewTimeReport: boolean }>();
  @Output() close = new EventEmitter<void>();
  @ViewChild('n') nameFieldRef: ElementRef;
  @ViewChild('h') hoursFieldRef: ElementRef;
  @ViewChild('m') minutesFieldRef: ElementRef;
  @ViewChild('d') descriptionFieldRef: ElementRef;
  users: User[] = [];
  today: Date = new Date();
  date: Date = new Date();
  id: number = -1;
  fname: string = '';
  lname: string = '';
  user_id: number = -1;
  hours: string = '';
  minutes: string = '';
  description: string = '';
  nameValid: boolean = true;
  hoursValid: boolean = true;
  minutesValid: boolean = true;
  descriptionValid: boolean = true;
  state = 'closed';
  isLoading: boolean = true;
  isUsersError: boolean = false;
  isSaveError: boolean = false;

  constructor(private cdr: ChangeDetectorRef) { }

  async ngOnInit(): Promise<void> {
    try {
      const response = await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/get-users', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlyActiveUsers: true })
      });
      if (response.ok) {
        this.users = await response.json();
        this.isLoading = false;
      }
    } catch (e) {
      this.isLoading = false;
      this.isUsersError = true;
      console.error('Error: ', e);
    }

    if (this.timeReportToEdit.id > -1) {
      this.id = this.timeReportToEdit.id;
      const dd = Number(this.timeReportToEdit.date.slice(0, 2));
      const mm = Number(this.timeReportToEdit.date.slice(3, 5)) - 1;
      const yy = Number(this.timeReportToEdit.date.slice(6));
      this.date = new Date(yy, mm, dd);
      this.user_id = this.timeReportToEdit.user_id;
      this.fname = this.timeReportToEdit.fname;
      this.lname = this.timeReportToEdit.lname;
      this.hours = String(this.timeReportToEdit.hours);
      this.minutes = String(this.timeReportToEdit.minutes);
      this.description = this.timeReportToEdit.description;
    }
  }

  ngAfterViewInit(): void {
    this.state = 'open';
    this.cdr.detectChanges();
  }

  onUserSelect(user: User): void {
    this.fname = user.fname;
    this.lname = user.lname;
    this.user_id = user.id;
  }

  closeAction(): void {
    this.state = 'closed';
    this.cdr.detectChanges();
    this.close.emit();
  }

  async saveAction(): Promise<void> {
    if (this.validateData()) {
      const data: TimeReport = {
        id: this.id,
        date: `${String(this.date.getDate()).padStart(2, '0')}/${String(this.date.getMonth() + 1).padStart(2, '0')}/${this.date.getFullYear()}`,
        user_id: this.user_id,
        project_id: this.projectId,
        fname: this.fname,
        lname: this.lname,
        hours: isNaN(Number(this.hours)) ? 0 : Number(this.hours),
        minutes: isNaN(Number(this.minutes)) ? 0 : Number(this.minutes),
        description: this.description
      }
      const isNewTimeReport = this.id > -1 ? false : true;
      const path = isNewTimeReport ? '/create-time-report' : '/edit-time-report';
      try {
        this.isLoading = true;
        this.isSaveError = false;
        const response = await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net' + path, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ time_report: data })
        });
        if (isNewTimeReport)
          data.id = await response.json();
        if (response.ok) {
          this.isLoading = false;
          this.save.emit({ timeReport: data, isNewTimeReport: isNewTimeReport });
        }
      } catch (e) {
        this.isLoading = false;
        this.isSaveError = true;
        console.error('Error: ', e);
      }
    }
  }

  validateData(): boolean {
    if (this.date === null) this.date = this.today;

    if (this.fname.length === 0) {
      this.nameFieldRef.nativeElement.classList.add('invalid');
      this.nameValid = false;
    } else {
      this.nameFieldRef.nativeElement.classList.remove('invalid');
      this.nameValid = true;
    }

    if (!this.hours || Number(this.hours) < 0 || Number(this.hours) > 12) {
      this.hoursFieldRef.nativeElement.classList.add('invalid');
      this.hoursValid = false;
    } else {
      this.hoursFieldRef.nativeElement.classList.remove('invalid');
      this.hoursValid = true;
    }

    if (!this.minutes || Number(this.minutes) < 0 || Number(this.minutes) > 59) {
      this.minutesFieldRef.nativeElement.classList.add('invalid');
      this.minutesValid = false;
    } else {
      this.minutesFieldRef.nativeElement.classList.remove('invalid');
      this.minutesValid = true;
    }

    if (!this.description.trim()) {
      this.descriptionFieldRef.nativeElement.classList.add('invalid');
      this.descriptionValid = false;
    } else {
      this.descriptionFieldRef.nativeElement.classList.remove('invalid');
      this.descriptionValid = true;
    }

    if (this.hoursValid && !this.minutes) {
      this.minutesFieldRef.nativeElement.classList.remove('invalid');
      this.minutesValid = true;
    }
    if (this.minutesValid && !this.hours) {
      this.hoursFieldRef.nativeElement.classList.remove('invalid');
      this.hoursValid = true;
    }

    return this.nameValid && this.hoursValid && this.minutesValid && this.descriptionValid;
  }

  onInput(input: any, isHours: boolean): void {
    const ref = isHours ? this.hoursFieldRef.nativeElement : this.minutesFieldRef.nativeElement;
    if (input.target.value.length > 2) ref.value = ref.value.slice(0, 2);
    else if (!['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(input.data)) ref.value = ref.value.slice(0, -1);
  }
}
