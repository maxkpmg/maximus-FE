import { Component, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import * as XLSX from 'xlsx';
import { TimeReport, Stage, User } from '../../../../interfaces';

@Component({
  selector: 'ProjectFilterComponent',
  standalone: true,
  imports: [FormsModule, CalendarModule],
  templateUrl: './project-filter.component.html',
  styleUrl: './project-filter.component.css'
})
export class ProjectFilterComponent implements OnChanges {
  @Input() projectId!: number;
  @Input() projectName: string;
  @Input() reports: TimeReport[];
  @Output() filter = new EventEmitter<TimeReport[]>();
  @Output() clear = new EventEmitter<Date[]>();
  @Output() exportXL = new EventEmitter<void>();
  isFiltered: boolean = false;
  filterType: string = '';
  today: Date = new Date();
  month: Date = new Date();
  fromDate: Date = new Date();
  toDate: Date = new Date();
  validationMsg: boolean = false;
  excelFileName: string = '';
  filteredReports: TimeReport[] = [];

  stages: Stage[] = [];
  selectedStage: string = '';
  filterByStage: boolean = false;
  isStagesError: boolean = false;

  users: User[] = [];
  filterByUser: boolean = false;
  selectedUser: string = '';
  isUsersError: boolean = false;

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    this.filteredReports = this.reports;
    this.isFiltered = false;
    this.filterType = '';
    this.month = this.today;
    this.fromDate = this.today;
    this.toDate = this.today;
    this.generateFileName();
    if (changes['projectId'] && this.projectId) {
      await this.fetchStages();
      await this.fetchUsers();
    }
  }

  async fetchUsers() {
    try {
      const response = await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/get-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ onlyActiveUsers: false })
        }
      );

      if (!response.ok) {
        this.isUsersError = true;
        return;
      }

      const allUsers: User[] = await response.json();

      if (!this.reports || this.reports.length === 0) {
        this.users = [];
        return;
      }
      const userIdsInReports = new Set(this.reports.map(r => Number(r.user_id)));
      this.users = allUsers.filter(u => userIdsInReports.has(Number(u.id)));
      this.users.sort((a, b) => `${a.fname} ${a.lname}`.localeCompare(`${b.fname} ${b.lname}`));

    } catch (e) {
      this.isUsersError = true;
      console.error('Error fetching users: ', e);
    }
  }

  async fetchStages() {
    try {
      const response = await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/get-project-stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: this.projectId })
      });
      if (response.ok) {
        this.stages = await response.json();
      } else {
        this.isStagesError = true;
      }
    } catch (e) {
      this.isStagesError = true;
      console.error('Error fetching stages: ', e);
    }
  }

  onFilter(): void {
    let filtered = this.reports;

    // Filter by Month
    if (this.filterType === 'month') {
      const firstDayOfMonth = new Date(this.month.getFullYear(), this.month.getMonth(), 1).getTime();
      const lastDayOfMonth = new Date(this.month.getFullYear(), this.month.getMonth() + 1, 0).getTime();
      filtered = filtered.filter(timeReport => {
        const d = new Date(
          Number(timeReport.date.slice(6)),
          Number(timeReport.date.slice(3, 5)) - 1,
          Number(timeReport.date.slice(0, 2))
        ).getTime();
        return d >= firstDayOfMonth && d <= lastDayOfMonth;
      });
    }

    // Filter by Custom Date Range
    else if (this.filterType === 'custom') {
      if (this.toDate.getTime() < this.fromDate.getTime()) {
        this.validationMsg = true;
        return;
      }
      this.validationMsg = false;
      filtered = filtered.filter(timeReport => {
        const d = new Date(
          Number(timeReport.date.slice(6)),
          Number(timeReport.date.slice(3, 5)) - 1,
          Number(timeReport.date.slice(0, 2))
        ).getTime();
        return d >= this.fromDate.getTime() && d <= this.toDate.getTime();
      });
    }

    if (this.filterByStage && this.selectedStage && this.selectedStage.trim() !== '') {
      filtered = filtered.filter(r => r.jobType === this.selectedStage);
    }

    if (this.filterByUser && this.selectedUser?.trim() !== '') {
      filtered = filtered.filter(
        r => `${r.fname} ${r.lname}`.trim() === this.selectedUser
      );
    }

    this.filteredReports = filtered;
    this.isFiltered = true;
    this.generateFileName();
    this.filter.emit(this.filteredReports);
  }

  onClear() {
    this.filteredReports = this.reports;
    this.isFiltered = false;
    this.filterByStage = false;
    this.selectedStage = '';
    this.filterByUser = false;
    this.selectedUser = '';
    this.clear.emit();
  }

  onExport(): void {
    const reports = this.filteredReports;
    const ExcelData: (string | Date | Number)[][] = [['Date', 'Reported Time', 'Description', 'Name', 'Total']];
    
    for (let i = 0; i < reports.length; i++) {
      // Split the date string to extract only the date part (before the space)
      const reportDate = reports[i].date.split(' ')[0]; // '13/01/2025'
      const dateParts = reportDate.split('/'); // ['13', '01', '2025']
      
      // Create a Date object with the format: new Date(year, month, day)
      const excelDate = new Date(+dateParts[2], +dateParts[1] - 1, +dateParts[0]);
      
      // Calculate the reported time in hours
      const hoursAndMinutes = reports[i].hours + reports[i].minutes / 60;
      const timeReported = Math.round((hoursAndMinutes) * 100) / 100;
      
      const rowData: (string | Date | Number)[] = [
        excelDate, // Pass the Date object here for Excel to recognize as a date
        timeReported,
        reports[i].description,
        `${reports[i].fname} ${reports[i].lname}`,
      ];
      ExcelData.push(rowData);
    }

    // Set the SUM formula in cell E2 (for total reported time)
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(ExcelData);
    
    // Set the cell format for the 'Date' column to date type (for Excel sorting)
    for (let row = 1; row < ExcelData.length; row++) {
      const cellAddress = { r: row, c: 0 }; // Column 0 is 'Date'
      if (ws[XLSX.utils.encode_cell(cellAddress)]) {
        ws[XLSX.utils.encode_cell(cellAddress)].z = 'mm/dd/yyyy'; // Format as Date
      }
    }
    // Set the SUM formula for the Total row
    ws['E2'] = { f: 'SUM(B:B)' };
    // Create a new workbook and append the worksheet
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    // Write the file to the user's system
    XLSX.writeFile(wb, this.excelFileName);
  }  

  generateFileName(): void {
    let baseFileName = '';

    if (!this.isFiltered) {
      baseFileName = `${this.projectName}_full_report`;
    } 
    else if (this.filterType === 'month') {
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      baseFileName = `${this.projectName}_${monthNames[this.month.getMonth()]}_${this.month.getFullYear()}`;
    } 
    else {
      const fromDay = String(this.fromDate.getDate()).padStart(2, '0');
      const fromMonth = String(this.fromDate.getMonth() + 1).padStart(2, '0');
      const fromYear = this.fromDate.getFullYear();
      const toDay = String(this.toDate.getDate()).padStart(2, '0');
      const toMonth = String(this.toDate.getMonth() + 1).padStart(2, '0');
      const toYear = this.toDate.getFullYear();
      baseFileName = `${this.projectName}_${fromDay}${fromMonth}${fromYear}_${toDay}${toMonth}${toYear}`;
    }

    if (this.filterByStage && this.selectedStage && this.selectedStage.trim() !== '') {
      // Replace spaces with underscores for a clean filename
      const stageSafe = this.selectedStage.replace(/\s+/g, '_');
      baseFileName += `_${stageSafe}`;
    }

    if (this.filterByUser && this.selectedUser?.trim() !== '') {
      const userSafe = this.selectedUser.replace(/\s+/g, '_');
      baseFileName += `_${userSafe}`;
    }

    this.excelFileName = `${baseFileName}.xlsx`;
  }
}
