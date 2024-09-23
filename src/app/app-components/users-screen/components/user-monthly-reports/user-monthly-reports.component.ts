import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { TimeReport, User } from '../../../../interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { LoadingSpinnerComponent } from '../../../loading-spinner/loading-spinner.component';

@Component({
  selector: 'UserMonthlyReportsComponent',
  standalone: true,
  imports: [FormsModule, CommonModule, CalendarModule, LoadingSpinnerComponent],
  templateUrl: './user-monthly-reports.component.html',
  styleUrl: './user-monthly-reports.component.css',
})
export class UserMonthlyReportsComponent implements OnChanges {
  @Input() user: User;
  @Output() openDailyReportEditor = new EventEmitter<{ date: string, day: string, reports: TimeReport[] }>();
  @Output() monthChange = new EventEmitter<string>();
  fetchedMonths: string[] = [];
  timeReports: { [key: string]: TimeReport[]; } = {}; // allow dynamic values to be added
  today: Date = new Date();
  monthToDisplay = new Date();
  isLoading: boolean = false;
  isError: boolean = false;
  isNoUserSelected: boolean = true;


  constructor(private cdr: ChangeDetectorRef) { }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (this.user.id !== -1) {
      this.fetchedMonths = [];
      this.timeReports = {};
      this.today.setHours(0, 0, 0, 0);
      await this.getTimeReports(this.today.getMonth() + 1, this.today.getFullYear());
    }
  }

  async getTimeReports(month: number, year: number): Promise<void> {
    if (this.fetchedMonths.includes(`${month}${year}`)) {
      setTimeout(() => this.styleCalendarCells(month, year), 10);
      return;
    }
    try {
      this.isError = this.isNoUserSelected = false;
      this.isLoading = true;
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      const response = await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/get-user-time-reports', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.user.id, startDate: startDate, endDate: endDate })
      });
      if (response.ok) {
        const data = await response.json();
        this.fetchedMonths.push(`${month}${year}`);
        for (let i = 0; i < data.length; i++) {
          if (!this.timeReports[data[i].date]) {
            this.timeReports[data[i].date] = [];
          }
          this.timeReports[data[i].date].push(data[i]);
        }
        this.monthToDisplay = new Date(year, month - 1);
        this.isLoading = this.isError = false;
        setTimeout(() => this.styleCalendarCells(month, year), 10);
      }
    } catch (e) {
      this.isError = true;
      console.error('Error: ', e);
    }
  }

  onDayClick(date: Date): void {
    const week = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    let timeReports: TimeReport[] = [];
    if (this.timeReports[formattedDate])
      timeReports = this.timeReports[formattedDate];
    this.openDailyReportEditor.emit({ date: formattedDate, day: week[date.getDay()], reports: timeReports });
  }

  async onMonthChange(event: any): Promise<void> {
    const month = event.month;
    const year = event.year;
    const selectedMonth = new Date(year, month - 1);
    if (selectedMonth > new Date(this.today.getFullYear(), this.today.getMonth())) {
      setTimeout(() => {
        const tbody = document.querySelectorAll('tbody');
        const rows = tbody[0].querySelectorAll('tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          cells.forEach(cell => {
            const span = cell.querySelector('span');
            if (span) span.style.backgroundColor = 'gainsboro';
          });
        });
      }, 10);
    } else {
      await this.getTimeReports(month, year);
    }
  }

  styleCalendarCells(month: number, year: number): void {
    const tbody = document.querySelectorAll('tbody');
    const rows = tbody[0].querySelectorAll('tr');
    // first row might contain days from the past month
    const firstWeek = rows[0].querySelectorAll('td');
    for (let i = 0; i < 7; i++) {
      const span = firstWeek[i].querySelector('span');
      if (span) {
        const day = parseInt(span.innerText);
        const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        if (day > 7 || this.isFutureDate(day, month, year)) {
          span.style.backgroundColor = 'gainsboro';
        } else if (i >= 5) {
          span.style.backgroundColor = 'whitesmoke';
        } else if (this.hoursReportedApproved(formattedDate)) {
          this.addReportedHoursIndicatorToCell(span, formattedDate, '#10b981');
        } else {
          this.addReportedHoursIndicatorToCell(span, formattedDate, '#ff595e');
        }
      }
    }
    // middle rows
    for (let i = 1; i < rows.length - 1; i++) {
      const cells = rows[i].querySelectorAll('td');
      for (let i = 0; i < 7; i++) {
        const span = cells[i].querySelector('span');
        if (span) {
          const day = parseInt(span.innerText);
          const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
          if (this.isFutureDate(day, month, year)) {
            span.style.backgroundColor = 'gainsboro';
          } else if (i >= 5) {
            span.style.backgroundColor = 'whitesmoke';
          } else if (this.hoursReportedApproved(formattedDate)) {
            this.addReportedHoursIndicatorToCell(span, formattedDate, '#10b981');
          } else {
            this.addReportedHoursIndicatorToCell(span, formattedDate, '#ff595e');
          }
        }
      }
    }
    // last row might contain days from the next month
    const lastWeek = rows[rows.length - 1].querySelectorAll('td');
    for (let i = 0; i < 7; i++) {
      const span = lastWeek[i].querySelector('span');
      if (span) {
        const day = parseInt(span.innerText);
        const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        if (day < 7 || this.isFutureDate(day, month, year)) {
          span.style.backgroundColor = 'gainsboro';
        } else if (i >= 5) {
          span.style.backgroundColor = 'whitesmoke';
        } else if (this.hoursReportedApproved(formattedDate)) {
          this.addReportedHoursIndicatorToCell(span, formattedDate, '#10b981');
        } else {
          this.addReportedHoursIndicatorToCell(span, formattedDate, '#ff595e');
        }
      }
    }
  }

  setTimeReports(timeReports: TimeReport[], date: string): void {
    this.timeReports[date] = timeReports;
    this.cdr.detectChanges();
  }

  updateCellColor(date: string): void {
    const day = date.slice(0, 2);
    const spans = document.querySelectorAll<HTMLSpanElement>('td > span');
    spans.forEach(span => {
      const match = span.innerHTML.match(/^\d{1,2}/);
      if (match && match[0] === day) {
        let color;
        if (this.hoursReportedApproved(date)) color = '#10b981';
        else color = '#ff595e';
        this.addReportedHoursIndicatorToCell(span, date, color);
      }
    });
  }

  addReportedHoursIndicatorToCell(span: HTMLSpanElement, date: string, color: string): void {
    const reports = this.timeReports[date];
    let totalHours = 0;
    let totalMinutes = 0;
    let projectIndicatorsHtml = '';
    if (reports) {
      const colorPlate = ['ee1e25', '3753a5', '6abd43', 'f6ec15', '7c287d', 'fcb812', 'ed197e', '3ac1c8', 'c0d62f', '008281'];
      projectIndicatorsHtml += '<div>';
      for (const report of reports) {
        totalHours += report.hours;
        totalMinutes += report.minutes;
        let chosenColor;
        if (colorPlate.length > 0) {
          const randomIndex = Math.floor(Math.random() * colorPlate.length);
          chosenColor = colorPlate.splice(randomIndex, 1)[0];
        } else {
          chosenColor = '000000';
        }
        projectIndicatorsHtml += `
          <div class="project-indicator" style="background-color: #${chosenColor};">
            <span class="project-hours">${report.hours}h ${report.minutes}m</span>
          </div>
        `
      }
      projectIndicatorsHtml += '</div>';
      totalHours += Math.floor(totalMinutes / 60);
    }
    const existingHoursIndicator = span.querySelector('.time-reported') as HTMLDivElement;
    if (existingHoursIndicator) {
      existingHoursIndicator.textContent = `${totalHours}/9`;
      existingHoursIndicator.style.backgroundColor = color;
    } else {
      const newDiv = document.createElement('div');
      newDiv.className = 'time-reported';
      newDiv.textContent = `${totalHours}/9`;
      newDiv.style.backgroundColor = color;
      span.appendChild(newDiv);
      span.innerHTML += projectIndicatorsHtml;
    }
  }

  hoursReportedApproved(date: string): boolean {
    if (!this.timeReports[date])
      return false;
    const reports = this.timeReports[date];
    let totalHours = 0;
    let totalMinutes = 0;
    for (const report of reports) {
      totalHours += report.hours;
      totalMinutes += report.minutes;
    }
    totalHours += Math.floor(totalMinutes / 60);
    return totalHours >= 9;
  }

  isFutureDate(day: number, month: number, year: number): boolean {
    const inputDate = new Date(year, month - 1, day);
    return inputDate > this.today;
  }
}
