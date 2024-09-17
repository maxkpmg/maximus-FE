import { Component, ViewChild } from '@angular/core';
import { TimeReport, User } from '../../interfaces';
import { UserEditorComponent } from './components/user-editor/user-editor.component';
import { UserDailyReportsEditorComponent } from './components/user-daily-reports-editor/user-daily-reports-editor.component';
import { UsersSidebarComponent } from './components/users-sidebar/users-sidebar.component';
import { UserInfoComponent } from './components/user-info/user-info.component';
import { UserWeeklyReportsComponent } from './components/user-weekly-reports/user-weekly-reports.component';
import { UserMonthlyReportsComponent } from './components/user-monthly-reports/user-monthly-reports.component';
import { UserConfirmationComponent } from './components/user-confirmation/user-confirmation.component';
import { UserFilterComponent } from './components/user-filter/user-filter.component';

@Component({
  selector: 'UsersScreenComponent',
  standalone: true,
  imports: [
    UsersSidebarComponent,
    UserInfoComponent,
    UserWeeklyReportsComponent,
    UserMonthlyReportsComponent,
    UserEditorComponent,
    UserDailyReportsEditorComponent,
    UserConfirmationComponent,
    UserFilterComponent
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersScreenComponent {
  users: User[] = [];
  selectedUser: User = { id: -1, fname: '', lname: '', phone: '', email: '', active: false };
  timeReportsToDisplay: TimeReport[] = [];
  isWeeklyOrMonthlyReports: boolean = false;
  isUserEditor: boolean = false;
  isUserDailyReportsEditor: boolean = false;
  isConfirmation: boolean = false;
  userToEdit: User;
  confirmationData: { type: string, id: number };
  dailyReportEditorData: { date: string, day: string, reports: TimeReport[] };
  @ViewChild('sideBar') sideBarRef: UsersSidebarComponent;
  @ViewChild('userMonthlyReports') userMonthlyReportsRef: UserMonthlyReportsComponent;
  @ViewChild('userWeeklyReports') userWeeklyReportsRef: UserWeeklyReportsComponent;


  initUsers(users: User[]): void {
    this.users = users;
  }

  onUserSelected(user: User): void {
    this.selectedUser = user;
  }

  displayUserEditor(user: User = { id: -1, fname: '', lname: '', phone: '', email: '', active: false }): void {
    this.userToEdit = user;
    this.isUserEditor = true;
  }

  closeUserEditor(): void {
    setTimeout(() => this.isUserEditor = false, 150);
  }

  saveUser(data: { user: User, isNewUser: boolean }): void {
    const user = data.user;
    if (data.isNewUser) {
      this.sideBarRef.activeUsers.push(user);
      this.sideBarRef.activeUsers.sort((a, b) => `${a.fname} ${a.lname}`.toLowerCase().localeCompare(`${b.fname} ${b.lname}`.toLowerCase()));
      this.users = this.sideBarRef.activeUsers;
      setTimeout(() => this.isUserEditor = false, 150);
    } else {
      for (let i = 0; i < this.sideBarRef.activeUsers.length; i++) {
        if (this.sideBarRef.activeUsers[i].id === data.user.id) {
          this.sideBarRef.activeUsers[i] = user;
          break;
        }
      }
      this.users = this.sideBarRef.activeUsers;
      setTimeout(() => this.isUserEditor = false, 150);
    }
  }

  displayConfirmation(data: { type: string, id: number }): void {
    this.confirmationData = data;
    this.isConfirmation = true;
  }

  closeConfirmation(): void {
    setTimeout(() => this.isConfirmation = false, 150);
  }

  onConfirm(): void {
    setTimeout(() => this.isConfirmation = false, 150);
    switch (this.confirmationData.type) {
      case 'archive':
        this.sideBarRef.archiveUser(this.selectedUser);
        break;
      case 'reactivate':
        this.sideBarRef.reactivateUser(this.selectedUser);
    }
  }

  monthlyWeeklyViewController(): void {
    this.isWeeklyOrMonthlyReports = !this.isWeeklyOrMonthlyReports;
  }

  displayUserDailyReportEditor(data: { date: string, day: string, reports: TimeReport[] }): void {
    this.dailyReportEditorData = data;
    this.isUserDailyReportsEditor = true;
  }

  closeUserDailyReportEditor(): void {
    setTimeout(() => this.isUserDailyReportsEditor = false, 150);
  }

  saveUserDailyReport(data: { timeReports: TimeReport[], date: string }): void {
    if (this.isWeeklyOrMonthlyReports) {
      this.userWeeklyReportsRef.setTimeReports(data.timeReports, data.date);
      this.userWeeklyReportsRef.styleDayHeadings();
    } else {
      this.userMonthlyReportsRef.setTimeReports(data.timeReports, data.date);
      this.userMonthlyReportsRef.updateCellColor(data.date);
    }
    setTimeout(() => this.isUserDailyReportsEditor = false, 150);
  }

  navigateWeeks(week: { sunday: string, monday: string, tuesday: string, wednesday: string, thursday: string, friday: string, saturday: string }): void {
    setTimeout(() => this.userWeeklyReportsRef.navigateWeek(week), 10);
  }
}
