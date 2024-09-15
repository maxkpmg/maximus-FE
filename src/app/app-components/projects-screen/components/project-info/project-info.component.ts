import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { TimeReport, Project } from '../../../../interfaces';

@Component({
  selector: 'ProjectInfoComponent',
  standalone: true,
  imports: [],
  templateUrl: './project-info.component.html',
  styleUrl: './project-info.component.css',
})
export class ProjectInfoComponent implements OnChanges {
  hours: number = 0;
  minutes: number = 0;
  @Input() project: Project;
  @Input() reports: TimeReport[];
  @Output() newTimeReport = new EventEmitter<TimeReport>();
  @Output() edit = new EventEmitter<Project>();
  @Output() archive = new EventEmitter<{ type: string, id: number }>();

  ngOnChanges(changes: SimpleChanges): void {
    if (this.reports.length === 0) {
      this.hours = this.minutes = 0;
      return;
    }
    let totalHours: number = 0;
    let totalMinutes: number = 0;
    for (let i = 0; i < this.reports.length; i++) {
      totalHours += this.reports[i].hours;
      totalMinutes += this.reports[i].minutes;
    }
    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes = totalMinutes % 60;
    this.hours = totalHours;
    this.minutes = totalMinutes;
  }

  updateTime(hours: number, minutes: number, isNewTimeReport: boolean): void {
    if (isNewTimeReport) {
      this.hours = this.hours + hours + Math.floor((minutes + minutes) / 60);
      this.minutes = (this.minutes + minutes) % 60;
    }
    else {
      let totalHours: number = 0;
      let totalMinutes: number = 0;
      for (let i = 0; i < this.reports.length; i++) {
        totalHours += this.reports[i].hours;
        totalMinutes += this.reports[i].minutes;
      }
      totalHours += Math.floor(totalMinutes / 60);
      totalMinutes = totalMinutes % 60;
      this.hours = totalHours;
      this.minutes = totalMinutes;
    }
  }

  onNewTimeReport(): void {
    this.newTimeReport.emit({ id: -1, date: '', user_id: -1, fname: '', lname: '', project_id: -1, hours: -1, minutes: -1, description: '' });
  }

  onEditProject(): void {
    this.edit.emit(this.project);
  }

  onArchive(): void {
    this.archive.emit({ type: 'archive', id: this.project.id });
  }

  onReactivate(): void {
    this.archive.emit({ type: 'reactivate', id: this.project.id });
  }
}
