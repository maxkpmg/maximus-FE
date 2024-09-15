import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Project, TimeReport } from '../../../../interfaces';
import { LoadingSpinnerComponent } from '../../../loading-spinner/loading-spinner.component';

@Component({
  selector: 'ProjectReportsComponent',
  standalone: true,
  imports: [LoadingSpinnerComponent],
  templateUrl: './project-reports.component.html',
  styleUrl: './project-reports.component.css',
})
export class ProjectReportsComponent implements OnChanges {
  @Input() project: Project;
  @Input() timeReports: TimeReport[];
  @Output() edit = new EventEmitter<TimeReport>();
  @Output() delete = new EventEmitter<{ type: string, id: number }>();
  @Output() getReports = new EventEmitter<any>();
  isLoading: boolean = false;
  isError: boolean = false;


  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['project'] && changes['project']['currentValue'].id && changes['project']['currentValue'].id !== changes['project']['previousValue'].id) {
      try {
        this.isError = false;
        this.isLoading = true;
        const response = await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/get-project-time-reports', {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_id: this.project.id })
        });
        if (response.ok) {
          const reports = await response.json();
          this.getReports.emit(reports);
          this.isLoading = this.isError = false;
        }
      } catch (e) {
        this.isLoading = false;
        this.isError = true;
        console.error('Error: ', e);
      }
    }
  }

  onEdit(timeReport: TimeReport): void {
    this.edit.emit(timeReport);
  }

  onDelete(id: number): void {
    this.delete.emit({ type: 'delete report', id: id });
  }
}
