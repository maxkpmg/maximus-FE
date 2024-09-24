import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { User } from '../../../../interfaces';

@Component({
  selector: 'UserInfoComponent',
  standalone: true,
  imports: [],
  templateUrl: './user-info.component.html',
  styleUrl: './user-info.component.css',
})
export class UserInfoComponent implements OnChanges {
  @Input() user: User;
  @Input() isMonthlyOrWeeklyView: boolean;
  @Output() toggleWeeklyMonthly = new EventEmitter<void>();
  @Output() edit = new EventEmitter<User>();
  @Output() archive = new EventEmitter<{ type: string, id: number }>();
  @Output() navigateWeeks = new EventEmitter< { sunday: string, monday: string, tuesday: string, wednesday: string, thursday: string, friday: string, saturday: string }>();
  week = { sunday: '', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '' };
  currDisplayedDatesDisplayed: string = '';


  ngOnChanges(changes: SimpleChanges): void {
    if (this.user.id !== -1) {
      this.initWeekDates();
      this.currDisplayedDatesDisplayed = `${this.week.sunday} - ${this.week.saturday}`;
      if (this.isMonthlyOrWeeklyView) this.navigateWeeks.emit(this.week);
    }
  }

  onEditUser(): void {
    this.edit.emit(this.user);
  }

  onArchive(): void {
    this.archive.emit({ type: 'archive', id: this.user.id });
  }

  onReactivate(): void {
    this.archive.emit({ type: 'reactivate', id: this.user.id });
  }

  onNavigateWeeks(backOrForward: boolean): void {
    const diff = backOrForward ? 7 : -7;
    this.initWeekDates(diff);
    this.currDisplayedDatesDisplayed = `${this.week.sunday} - ${this.week.saturday}`;
    this.navigateWeeks.emit(this.week);
  }

  initWeekDates(diff: number = 0): void {
    const currFirstDay = this.week.sunday
      ? new Date(Number(this.week.sunday.slice(6, 10)), Number(this.week.sunday.slice(3, 5)) - 1, Number(this.week.sunday.slice(0, 2)))
      : new Date();
    const sunday = new Date(currFirstDay);
    sunday.setDate(sunday.getDate() - sunday.getDay() + diff);
    const monday = new Date(sunday);
    monday.setDate(sunday.getDate() + 1);
    const tuesday = new Date(sunday);
    tuesday.setDate(sunday.getDate() + 2);
    const wednesday = new Date(sunday);
    wednesday.setDate(sunday.getDate() + 3);
    const thursday = new Date(sunday);
    thursday.setDate(sunday.getDate() + 4);
    const friday = new Date(sunday);
    friday.setDate(sunday.getDate() + 5);
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    this.week = {
      sunday: `${String(sunday.getDate()).padStart(2, '0')}/${String(sunday.getMonth() + 1).padStart(2, '0')}/${sunday.getFullYear()}`,
      monday: `${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')}/${monday.getFullYear()}`,
      tuesday: `${String(tuesday.getDate()).padStart(2, '0')}/${String(tuesday.getMonth() + 1).padStart(2, '0')}/${tuesday.getFullYear()}`,
      wednesday: `${String(wednesday.getDate()).padStart(2, '0')}/${String(wednesday.getMonth() + 1).padStart(2, '0')}/${wednesday.getFullYear()}`,
      thursday: `${String(thursday.getDate()).padStart(2, '0')}/${String(thursday.getMonth() + 1).padStart(2, '0')}/${thursday.getFullYear()}`,
      friday: `${String(friday.getDate()).padStart(2, '0')}/${String(friday.getMonth() + 1).padStart(2, '0')}/${friday.getFullYear()}`,
      saturday: `${String(saturday.getDate()).padStart(2, '0')}/${String(saturday.getMonth() + 1).padStart(2, '0')}/${saturday.getFullYear()}`
    }
  }

  onButtonGroupClick($event: any): void {
    let clickedElement = $event.target || $event.srcElement;
    if (clickedElement.nodeName === "BUTTON") {
      let isCertainButtonAlreadyActive = clickedElement.parentElement.querySelector(".active");
      if (isCertainButtonAlreadyActive) {
        isCertainButtonAlreadyActive.classList.remove("active");
      }
      clickedElement.className += " active";
    }
  }

  onToggleWeeklyMonthly() {
    this.toggleWeeklyMonthly.emit();
  }
}
