import { Component, ElementRef, Input, Output, EventEmitter, AfterViewInit, ChangeDetectorRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Project, TimeReport, User, Stage } from '../../../../interfaces';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { LoadingSpinnerComponent } from '../../../loading-spinner/loading-spinner.component';

@Component({
  selector: 'UserDailyReportsEditorComponent',
  standalone: true,
  imports: [FormsModule, LoadingSpinnerComponent],
  templateUrl: './user-daily-reports-editor.component.html',
  styleUrl: './user-daily-reports-editor.component.css',
  animations: [
    trigger('openClose', [
      state('open', style({ opacity: 1 })),
      state('closed', style({ opacity: 0 })),
      transition('closed => open', [animate(150)]),
      transition('open => closed', [animate(150)])
    ])
  ]
})
export class UserDailyReportsEditorComponent implements OnInit, AfterViewInit {
  @Input() user: User;
  @Input() data: { date: string, day: string, reports: TimeReport[] };
  @Output() save = new EventEmitter<{ timeReports: TimeReport[], date: string }>();
  @Output() close = new EventEmitter<void>();
  @ViewChildren('h') hoursFieldRef: QueryList<ElementRef>;
  @ViewChildren('m') minutesFieldRef: QueryList<ElementRef>;
  @ViewChildren('d') descriptionFieldRef: QueryList<ElementRef>;
  @ViewChildren('j') jobTypeFieldRef: QueryList<ElementRef>;
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  bookmarkedProjects: Project[] = [];
  projectsModel: { id: number, projectId: number, hours: string, minutes: string, jobType: string, description: string }[] = [];
  descriptionValid: boolean = true;
  jobTypeValid: boolean = true;
  timeValid: boolean = true;
  maxTimeValid = true;
  totalReportedHours: number = 0;
  totalTime: string = '';
  state = 'closed';
  isLoading: boolean = false;
  isError: boolean = false;
  isStagesError: boolean = false;
  isProjectsListLoading: boolean = false;
  isProjectsListError: boolean = false;
  projectsFetched: boolean = false;
  jobTypes: { [projectId: number]: Stage[] | undefined } = {};

  constructor(private cdr: ChangeDetectorRef) { }

  ngAfterViewInit(): void {
    this.state = 'open';
    this.cdr.detectChanges();
    setTimeout(() => this.calculateTotalTimeReported(), 1000);
  }

  async ngOnInit(): Promise<void> {
    try {
      this.isError = false;
      this.isLoading = true;

      await this.getBookmarkedProjects();

      const reportedProjectsToFetch: number[] = [];
      for (const report of this.data.reports) {
        if (!this.bookmarkedProjects.some(bm => bm.id === report.project_id)) {
          reportedProjectsToFetch.push(report.project_id);
        }
      }

      if (reportedProjectsToFetch.length) {
        await this.getProjectsById(reportedProjectsToFetch);
      }

      const allProjects = [...this.bookmarkedProjects];
      await this.fetchJobTypesForProjects(allProjects.map(p => p.id));

      this.projectsModel = this.bookmarkedProjects.map((project) => {
        const matchingReport = this.data.reports.find(r => r.project_id === project.id);
        return matchingReport ? {
          id: matchingReport.id,
          projectId: project.id,
          hours: String(matchingReport.hours),
          minutes: String(matchingReport.minutes),
          jobType: matchingReport.jobType || '',
          description: matchingReport.description
        } : {
          id: 0,
          projectId: project.id,
          hours: '',
          minutes: '',
          jobType: '',
          description: ''
        };
      });

      this.isLoading = false;
    } catch (e) {
      this.isError = true;
      console.error('Error: ', e);
    }
  }

async fetchJobTypesForProjects(projectIds: number[]): Promise<void> {
    if (!projectIds?.length) return;

    const requests = projectIds.map(async (projectId) => {
      try {
        const response = await fetch(
          'https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/get-project-stages',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId })
          }
        );
        if (response.ok) {
          const stages = await response.json();
          this.jobTypes[projectId] = stages;
        } else {
          console.error(`Failed to fetch job types for project ${projectId}`);
        }
      } catch (e) {
        console.error(`Error fetching job types for project ${projectId}:`, e);
        this.isStagesError = true;
      }
    });

    await Promise.all(requests);
  }

  async onOtherProjectSelected(project: Project): Promise<void> {
    this.projects = this.projects.filter(elem => elem.id !== project.id);
    this.bookmarkedProjects.push(project);

    await this.fetchJobTypesForProjects([project.id]);

    this.projectsModel.push({
      id: 0,
      projectId: project.id,
      hours: '',
      minutes: '',
      jobType: '',
      description: ''
    });
  }

  async getBookmarkedProjects(): Promise<void> {
    const [day, month, year] = this.data.date.split('/');
    const formattedDate = `${year}-${month}-${day}`;

    const response = await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/get-bookmarked-projects', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: this.user.id, date: formattedDate })
    });

    if (response.ok)
      this.bookmarkedProjects = await response.json();
  }

  async getProjectsById(ids: number[]): Promise<void> {
    const response = await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/get-projects-by-ids', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ids })
    });
    if (response.ok) {
      const data: Project[] = await response.json();
      this.bookmarkedProjects = this.bookmarkedProjects.concat(data);
    }
  }

  async getProjects(): Promise<void> {
    if (!this.projectsFetched) {
      this.isProjectsListLoading = true;
      const response = await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/get-projects', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlyActiveProjects: true })
      });
      if (response.ok) {
        const data: Project[] = await response.json();
        data.forEach(project => {
          const existsInBookmarks = this.bookmarkedProjects.some(bookmarked => bookmarked.id === project.id);
          if (!existsInBookmarks) this.projects.push(project);
        });
        this.filteredProjects = [...this.projects];
        this.isProjectsListLoading = this.isProjectsListError = false;
        this.projectsFetched = true;
      }
    }
  }

  closeAction(): void {
    this.state = 'closed';
    this.cdr.detectChanges();
    this.close.emit();
  }

  async saveAction(): Promise<void> {
    if (this.validateTimeReports()) {
      this.isLoading = true;
      const reportsToInsert: TimeReport[] = [];
      for (const report of this.projectsModel) {
        const hours = Number(report.hours);
        const minutes = Number(report.minutes);
        // if existant report from before or new one
        if (report.id > 0 || (!isNaN(hours) && hours > 0) || (!isNaN(minutes) && minutes > 0)) {
          const data: TimeReport = {
            id: report.id,
            date: this.data.date,
            fname: '',
            lname: '',
            user_id: this.user.id,
            project_id: report.projectId,
            hours: !isNaN(hours) ? hours : 0,
            minutes: !isNaN(minutes) ? minutes : 0,
            jobType: report.jobType,
            description: report.description
          }
          reportsToInsert.push(data);
        }
      }
      if (reportsToInsert.length) {
        try {
          const response = await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/create-multiple-time-reports', {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ time_reports: reportsToInsert })
          });
          if (response.ok) {
            const dayReports = await response.json();
            this.save.emit({ timeReports: dayReports, date: this.data.date });
          }
        } catch (e) {
          this.isLoading = false;
          this.isError = true;
          console.error('Error: ', e);
        }
      } else {
        this.closeAction();
      }
    }
  }

  validateTimeReports(): boolean {
    let totalReportedHours = 0, totalReportedMinutes = 0;
    this.descriptionValid = this.timeValid = this.maxTimeValid = this.jobTypeValid = true;
    for (let i = 0; i < this.projectsModel.length; i++) {
      this.validate(this.projectsModel[i], i);
      if (!isNaN(Number(this.projectsModel[i].hours)))
        totalReportedHours += Number(this.projectsModel[i].hours);
      if (!isNaN(Number(this.projectsModel[i].minutes)))
        totalReportedMinutes += Number(this.projectsModel[i].minutes);
    }
    this.totalReportedHours = totalReportedHours + totalReportedMinutes / 60
    if (this.totalReportedHours > 16) {
      this.descriptionValid = this.timeValid = this.jobTypeValid = true;
      this.maxTimeValid = false;
      return this.maxTimeValid;
    }
    return this.descriptionValid && this.timeValid && this.jobTypeValid;
  }

  validate(timeReport: { projectId: number, hours: string, minutes: string, jobType: string, description: string }, index: number): void {
    const description = timeReport.description.trim();
    const hours = timeReport.hours;
    const minutes = timeReport.minutes;
    const jobType = timeReport.jobType.trim();

    if (!description && !jobType && !hours && !minutes) return;

    if (description.length === 0) {
      this.descriptionFieldRef.get(index)!.nativeElement.classList.add('invalid');
      this.descriptionValid = false;
    } else {
      this.descriptionFieldRef.get(index)!.nativeElement.classList.remove('invalid');
    }

    if (jobType.length === 0) {
      this.jobTypeFieldRef.get(index)!.nativeElement.classList.add('invalid');
      this.jobTypeValid = false;
    } else {
      this.jobTypeFieldRef.get(index)!.nativeElement.classList.remove('invalid');
    }

    if (!hours && !minutes) {
      this.timeValid = false;
      this.hoursFieldRef.get(index)!.nativeElement.classList.add('invalid');
      this.minutesFieldRef.get(index)!.nativeElement.classList.add('invalid');
      return;
    } else {
      this.hoursFieldRef.get(index)!.nativeElement.classList.remove('invalid');
      this.minutesFieldRef.get(index)!.nativeElement.classList.remove('invalid');
    }

    if (hours !== '') {
      if (!isNaN(Number(hours)) && Number(hours) >= 0 && Number(hours) <= 16) {
        this.hoursFieldRef.get(index)!.nativeElement.classList.remove('invalid');
      } else {
        this.hoursFieldRef.get(index)!.nativeElement.classList.add('invalid');
        this.timeValid = false;
      }
    }

    if (minutes !== '') {
      if (!isNaN(Number(minutes)) && Number(minutes) >= 0 && Number(minutes) < 60) {
        this.minutesFieldRef.get(index)!.nativeElement.classList.remove('invalid');
      } else {
        this.minutesFieldRef.get(index)!.nativeElement.classList.add('invalid');
        this.timeValid = false;
      }
    }
  }

  onPlusButtonClick(index: number): void {
    const hoursRef = this.hoursFieldRef.get(index)!.nativeElement;
    const minutesRef = this.minutesFieldRef.get(index)!.nativeElement;
    const hoursVal = Number(hoursRef.value);
    const minutesVal = Number(minutesRef.value);
    if (isNaN(minutesVal) || minutesVal < 0) minutesRef.value = '0';
    else if (hoursVal >= 16) {
      hoursRef.value = '16';
      minutesRef.value = '0'
    }
    else if (minutesVal < 30) minutesRef.value = '30';
    else {
      minutesRef.value = '0';
      if (isNaN(hoursVal) || minutesVal < 1) hoursRef.value = '1';
      else hoursRef.value = `${hoursVal + 1}`;
    }
    this.projectsModel[index].hours = hoursRef.value;
    this.projectsModel[index].minutes = minutesRef.value;
    this.calculateTotalTimeReported();
  }

  onMinusButtonClick(index: number): void {
    const hoursRef = this.hoursFieldRef.get(index)!.nativeElement;
    const minutesRef = this.minutesFieldRef.get(index)!.nativeElement;
    const hoursVal = Number(hoursRef.value);
    const minutesVal = Number(minutesRef.value);
    if (isNaN(minutesVal) || (minutesVal <= 30 && minutesVal > 0)) minutesRef.value = '0';
    else if (minutesVal > 30) minutesRef.value = '30';
    else if (!isNaN(hoursVal) && hoursVal > 0) {
      hoursRef.value = `${hoursVal - 1}`;
      minutesRef.value = '30';
    }
    this.projectsModel[index].hours = hoursRef.value;
    this.projectsModel[index].minutes = minutesRef.value;
    this.calculateTotalTimeReported();
  }

  onInput(input: any, index: number, isHours: boolean): void {
    const ref = isHours ? this.hoursFieldRef.get(index)!.nativeElement : this.minutesFieldRef.get(index)!.nativeElement;
    if (input.target.value.length > 2) ref.value = ref.value.slice(0, 2);
    else if (!['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(input.data)) ref.value = ref.value.slice(0, -1);

    this.calculateTotalTimeReported();
  }

  calculateTotalTimeReported(): void {
    let totalHours = 0;
    let totalMinutes = 0;
    this.hoursFieldRef.forEach((hoursInput, index) => {
      totalHours += parseInt(hoursInput.nativeElement.value) || 0;
      totalMinutes += parseInt(this.minutesFieldRef.toArray()[index].nativeElement.value) || 0;
    });
    if (totalMinutes >= 60) {
      totalHours += Math.floor(totalMinutes / 60);
      totalMinutes = totalMinutes % 60;
    }
    this.totalTime = `${totalHours}H ${totalMinutes}M`;
  }

  filterProjects(event: KeyboardEvent): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredProjects = this.projects.filter(project => project.name.toLowerCase().includes(searchTerm));
  }
}
