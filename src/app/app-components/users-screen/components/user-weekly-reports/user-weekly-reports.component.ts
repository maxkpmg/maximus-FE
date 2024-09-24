import { Component, Input, Output, EventEmitter, ChangeDetectorRef, SimpleChanges, OnChanges } from '@angular/core';
import { Project, TimeReport, User } from '../../../../interfaces';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../../../loading-spinner/loading-spinner.component';

@Component({
  selector: 'UserWeeklyReportsComponent',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  templateUrl: './user-weekly-reports.component.html',
  styleUrl: './user-weekly-reports.component.css',
})
export class UserWeeklyReportsComponent implements OnChanges {
  @Input() user: User;
  @Input() projects: Project[];
  @Output() openDailyReportEditor = new EventEmitter<{ date: string, day: string, reports: TimeReport[] }>();
  fetchedWeeks: string[] = [];
  timeReports: { [key: string]: TimeReport[]; } = {}; // allow dynamic values to be added
  today: Date = new Date();
  week = { sunday: '', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '' };
  isLoading: boolean = false;
  isError: boolean = false;
  isNoUserSelected: boolean = true;
  colorsArray: { [key: string]: object[]; } = {};
  projectNamesArray: { [key: string]: string[]; } = {};


  constructor(private cdr: ChangeDetectorRef) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.user.id !== -1) {
      this.fetchedWeeks = [];
      this.timeReports = {};
      this.colorsArray = {};
      this.projectNamesArray = {};
      this.today.setHours(0, 0, 0, 0);
    }
  }

  async getTimeReports(): Promise<void> {
    const week = this.week;
    if (week.sunday === '' || this.fetchedWeeks.includes(week.sunday)) {
      return;
    }
    try {
      this.isError = this.isNoUserSelected = false;
      this.isLoading = true;
      const startDate = new Date(Number(week.sunday.slice(6, 10)), Number(week.sunday.slice(3, 5)) - 1, Number(week.sunday.slice(0, 2)), 12).toISOString().split('T')[0];
      const endDate = new Date(Number(week.thursday.slice(6, 10)), Number(week.thursday.slice(3, 5)) - 1, Number(week.thursday.slice(0, 2)), 12).toISOString().split('T')[0];
      const response = await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/get-user-time-reports', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.user.id, startDate: startDate, endDate: endDate })
      });
      if (response.ok) {
        const data = await response.json();
        this.fetchedWeeks.push(week.sunday);
        for (let i = 0; i < data.length; i++) {
          // push time report
          if (!this.timeReports[data[i].date]) {
            this.timeReports[data[i].date] = [];
          }
          this.timeReports[data[i].date].push(data[i]);
          // push random color
          if (!this.colorsArray[data[i].date])
            this.colorsArray[data[i].date] = [];
          this.colorsArray[data[i].date].push(this.calcColor());
          // push the project name
          if (!this.projectNamesArray[data[i].date])
            this.projectNamesArray[data[i].date] = [];
          const projectName = this.findProjectById(data[i].project_id)?.name || 'Unknown Project';
          this.projectNamesArray[data[i].date].push(projectName);
        }
        this.isLoading = this.isError = false;
      }
    } catch (e) {
      this.isError = true;
      console.error('Error: ', e);
    }
  }

  openDailyReportWindow(date: string, dayOfWeek: string): void {
    let timeReports: TimeReport[] = [];
    if (this.timeReports[date])
      timeReports = this.timeReports[date];
    this.openDailyReportEditor.emit({ date: date, day: dayOfWeek, reports: timeReports });
  }

  async navigateWeek(week: { sunday: string, monday: string, tuesday: string, wednesday: string, thursday: string, friday: string, saturday: string }): Promise<void> {
    this.week = week;
    const [day, month, year] = this.week.sunday.split('/').map(Number);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(year, month - 1, day) <= today)
      await this.getTimeReports();
    setTimeout(() => this.styleDayHeadings(), 10);
  }

  setTimeReports(timeReports: TimeReport[], date: string): void {
    this.timeReports[date] = timeReports;
    this.cdr.detectChanges();
  }

  findProjectById(projectId: number): Project | undefined {
    return this.projects.find(project => project.id === projectId);
  }

  calcHeight(hours: number, minutes: number): object {
    return { 'height': (hours + minutes / 60) * 6.5 + 'vh' };
  }

  calcColor(): object {
    const colors = ['#ee1e25', '#3753a5', '#6abd43', '#008281', '#7c287d', '#3ac1c8', '#ed197e', '#fcb812', '#c0d62f', '#f6ec15'];
    const randomNum = Math.floor(Math.random() * 10);
    const textColor = randomNum > 6 ? '#343434' : '#ffffff';
    return { 'backgroundColor': colors[randomNum], 'color': textColor };
  }

  styleDayHeadings(): void {
    const cells = document.querySelectorAll<HTMLButtonElement>('.thBackground');
    if (cells) {
    type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
    const daysOfWeek: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < daysOfWeek.length; i++) {
      const approveBlock = cells[i].querySelector<HTMLDivElement>('.approveBlock');
      const day = daysOfWeek[i];
      const date = this.week[day];
      cells[i].disabled = false;
      if (this.isFutureDate(date) || i >= 5) {
        cells[i].disabled = true;
        if (approveBlock) {
          approveBlock.style.background = 'gainsboro';
          approveBlock.innerText = '';
        }
      } else if (this.hoursReportedApproved(date)) {
        if (approveBlock) {
          approveBlock.style.background = '#10b981';
          approveBlock.innerText = 'APPROVED';
        }
      } else {
        if (approveBlock) {
          approveBlock.style.background = '#ff595e';
          approveBlock.innerText = 'MISSING';
        }
      }
    }
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

  isFutureDate(date: string): boolean {
    const [day, month, year] = date.split('/').map(Number);
    const inputDate = new Date(year, month - 1, day);
    return inputDate > this.today;
  }
}
