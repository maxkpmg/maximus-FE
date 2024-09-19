import { Component, OnInit, ViewChild } from '@angular/core';
import { TimeReport, Project } from '../../interfaces';
import { TimeReportEditorComponent } from './components/time-report-editor/time-report-editor.component';
import { ProjectEditorComponent } from './components/project-editor/project-editor.component';
import { ProjectsSidebarComponent } from './components/projects-sidebar/projects-sidebar.component';
import { ProjectInfoComponent } from './components/project-info/project-info.component';
import { ProjectReportsComponent } from './components/project-reports/project-reports.component';
import { ProjectConfirmationComponent } from './components/project-confirmation/project-confirmation.component';
import { ProjectFilterComponent } from './components/project-filter/project-filter.component';

@Component({
  selector: 'ProjectsScreenComponent',
  standalone: true,
  imports: [
    ProjectsSidebarComponent,
    ProjectInfoComponent,
    ProjectReportsComponent,
    TimeReportEditorComponent,
    ProjectEditorComponent,
    ProjectConfirmationComponent,
    ProjectFilterComponent
  ],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css'
})
export class ProjectsScreenComponent implements OnInit {
  archivedProjects: Project[] = [];
  activeProjects: Project[] = [];
  selectedProject: Project = { id: 0,name: '', active: false };
  timeReports: TimeReport[] = [];
  filteredTimeReports: TimeReport[] = this.timeReports;
  isTimeReportEditor: boolean = false;
  isProjectEditor: boolean = false;
  isConfirmation: boolean = false;
  projectToEdit: Project = { id: -1, name: '', active: true };
  timeReportToEdit: TimeReport = { id: -1, user_id: -1, project_id: -1, date: '', minutes: -1, hours: -1, fname: '', lname: '', description: '' };
  confirmationData: { type: string, id: number };
  @ViewChild('sb') sideBarRef: ProjectsSidebarComponent;
  @ViewChild('pi') projectInfoRef: ProjectInfoComponent;


  async ngOnInit(): Promise<void> {
    try {
      const projectsResponse = await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/get-projects', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlyActiveProjects: false })
      });
      if (projectsResponse.ok) {
        const projects = await projectsResponse.json();
        const activeProjects = [];
        const archivedProjects = [];
        for (let i = 0; i < projects.length; i++) {
          if (projects[i].active) activeProjects.push(projects[i]);
          else archivedProjects.push(projects[i]);
        }
        this.activeProjects = activeProjects;
        this.archivedProjects = archivedProjects;
      }
    } catch (e) {
      console.error('Error: ', e);
    }
  }

  onProjectSelect(project: Project): void {
    this.selectedProject = project;
  }

  initProjectReports(timeReports: TimeReport[]): void {
    this.timeReports = this.filteredTimeReports = timeReports;
  }

  displayTimeReportEditor(timeReport: TimeReport): void {
    this.timeReportToEdit = timeReport;
    this.isTimeReportEditor = true;
  }

  closeTimeReportEditor(): void {
    setTimeout(() => this.isTimeReportEditor = false, 150);
  }

  saveTimeReport(data: { timeReport: TimeReport, isNewTimeReport: boolean }): void {
    if (data.isNewTimeReport) {
      this.timeReports.unshift(data.timeReport);
      this.projectInfoRef.updateTime(data.timeReport.hours, data.timeReport.minutes, true);
    } else {
      for (let i = 0; i < this.timeReports.length; i++) {
        if (this.timeReports[i].id === data.timeReport.id) {
          this.timeReports[i] = data.timeReport;
          this.projectInfoRef.updateTime(data.timeReport.hours, data.timeReport.minutes, false);
          break;
        }
      }
      for (let i = 0; i < this.filteredTimeReports.length; i++) {
        if (this.filteredTimeReports[i].id === data.timeReport.id) {
          this.filteredTimeReports[i] = data.timeReport;
          this.projectInfoRef.updateTime(data.timeReport.hours, data.timeReport.minutes, false);
          break;
        }
      }
    }
    setTimeout(() => this.isTimeReportEditor = false, 150);
  }

  displayProjectEditor(project: Project = { id: -1, name: '', active: false }): void {
    this.projectToEdit = project;
    this.isProjectEditor = true;
  }

  closeProjectEditor(): void {
    setTimeout(() => this.isProjectEditor = false, 150);
  }

  saveProject(data: { project: Project, isNewProject: boolean }): void {
    const project = data.project;
    if (data.isNewProject) {
      this.activeProjects = [...this.activeProjects, project]
      this.activeProjects.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      setTimeout(() => this.isProjectEditor = false, 150);
    } else {
      for (let i = 0; i < this.activeProjects.length; i++) {
        if (this.activeProjects[i].id === data.project.id) {
          this.activeProjects[i] = project;
          this.activeProjects = [...this.activeProjects]
          break;
        }
      }
      setTimeout(() => this.isProjectEditor = false, 150);
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
    switch (this.confirmationData.type) {
      case 'archive':
        this.activeProjects = this.activeProjects.filter(project => project.id !== this.selectedProject.id);
        this.selectedProject.active = false;
        this.archivedProjects.push(this.selectedProject);
        this.archivedProjects = this.archivedProjects.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
        if (!this.selectedProject) {
          const archiveOpenerButton = document.querySelector('.archive-opener-button');
          if (archiveOpenerButton instanceof HTMLElement)
            archiveOpenerButton.click();
          setTimeout(() => {
            const button = document.getElementById(this.selectedProject.name);
            if (button)
              button.className += ' active';
          }, 500);
        }
        break;
      case 'reactivate':
        this.archivedProjects = this.archivedProjects.filter(project => project.id !== this.selectedProject.id);
        this.selectedProject.active = true;
        this.activeProjects.push(this.selectedProject);
        this.activeProjects = this.activeProjects.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
        setTimeout(() => {
          const button = document.getElementById(this.selectedProject.name);
          if (button)
            button.className += ' active';
        }, 500);
        break;
      case 'delete report':
        this.timeReports = this.timeReports.filter(report => report.id !== this.confirmationData.id);
        this.filteredTimeReports = this.filteredTimeReports.filter(report => report.id !== this.confirmationData.id);
    }
  }

  onFilter(filteredTimeReports: TimeReport[]): void {
    this.filteredTimeReports = filteredTimeReports;
  }

  onClearFilters(): void {
    this.filteredTimeReports = this.timeReports;
  }
}
