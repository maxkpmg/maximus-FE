import { Component, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import * as XLSX from 'xlsx';
import { TimeReport } from '../../../../interfaces';

@Component({
  selector: 'ProjectFilterComponent',
  standalone: true,
  imports: [FormsModule, CalendarModule],
  templateUrl: './project-filter.component.html',
  styleUrl: './project-filter.component.css'
})
export class ProjectFilterComponent implements OnChanges {
  isFiltered: boolean = false;
  filterType: string = '';
  today: Date = new Date();
  month: Date = new Date();
  fromDate: Date = new Date();
  toDate: Date = new Date();
  validationMsg: boolean = false;
  excelFileName: string = '';
  @Input() projectName: string;
  @Input() reports: TimeReport[];
  filteredReports: TimeReport[] = [];
  @Output() filter = new EventEmitter<TimeReport[]>();
  @Output() clear = new EventEmitter<Date[]>();
  @Output() exportXL = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    this.filteredReports = this.reports;
    this.isFiltered = false;
    this.filterType = '';
    this.month = this.today;
    this.fromDate = this.today;
    this.toDate = this.today;
    this.generateFileName();
  }

  onFilter(): void {
    if (this.filterType === 'month') {
      const firstDayOfMonth = new Date(this.month.getFullYear(), this.month.getMonth(), 1).getTime();
      const lastDayOfMonth = new Date(this.month.getFullYear(), this.month.getMonth() + 1, 0).getTime();
      this.filteredReports = this.reports.filter(timeReport => {
        const d = new Date(Number(timeReport.date.slice(6)), Number(timeReport.date.slice(3, 5)) - 1, Number(timeReport.date.slice(0, 2))).getTime();
        return (d >= firstDayOfMonth && d <= lastDayOfMonth);
      })
      this.isFiltered = true;
      this.generateFileName();
      this.filter.emit(this.filteredReports);
    }
    else {
      if (this.toDate.getTime() >= this.fromDate.getTime()) {
        this.validationMsg = false;
        this.filteredReports = this.reports.filter(timeReport => {
          const d = new Date(Number(timeReport.date.slice(6)), Number(timeReport.date.slice(3, 5)) - 1, Number(timeReport.date.slice(0, 2))).getTime();
          return (d >= this.fromDate.getTime() && d <= this.toDate.getTime());
        })
        this.isFiltered = true;
        this.generateFileName();
        this.filter.emit(this.filteredReports);
      }
      else {
        this.validationMsg = true;
      }
    }
  }

  onClear() {
    this.filteredReports = this.reports;
    this.isFiltered = false;
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
    if (!this.isFiltered) {
      this.excelFileName = `${this.projectName}_full_report.xlsx`;
    }
    else if (this.filterType === 'month') {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      this.excelFileName = `${this.projectName}_${monthNames[this.month.getMonth()]}_${this.month.getFullYear()}.xlsx`;
    }
    else {
      const fromDay = String(this.fromDate.getDate()).padStart(2, '0');
      const fromMonth = String(this.fromDate.getMonth() + 1).padStart(2, '0');
      const fromYear = this.fromDate.getFullYear();
      const fromDate = `${fromDay}${fromMonth}${fromYear}`;
      const toDay = String(this.toDate.getDate()).padStart(2, '0');
      const toMonth = String(this.toDate.getMonth() + 1).padStart(2, '0');
      const toYear = this.toDate.getFullYear();
      const toDate = `${toDay}${toMonth}${toYear}`;
      this.excelFileName = `${this.projectName}_${fromDate}_${toDate}.xlsx`;
    }
  }
}
