import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Project } from '../../../../interfaces';
import { LoadingSpinnerComponent } from '../../../loading-spinner/loading-spinner.component';

@Component({
  selector: 'ProjectsSidebarComponent',
  standalone: true,
  imports: [LoadingSpinnerComponent],
  templateUrl: './projects-sidebar.component.html',
  styleUrl: './projects-sidebar.component.css',
  animations: [
    trigger('openClose', [
      state('closed', style({ 'height': '5vh', 'background-color': 'transparent' })),
      state('open', style({ 'height': '11.5vh', 'background-color': 'rgb(0, 0, 0, 0.1)' })),
      transition('closed => open', [animate(150)]),
      transition('open => closed', [animate(150)])
    ])
  ]
})
export class ProjectsSidebarComponent implements OnInit {
  @Output() projectSelect = new EventEmitter<Project>();
  @Output() openNewProjectEditor = new EventEmitter<void>();
  @Output() getProjects = new EventEmitter<Project[]>();
  activeProjects: Project[] = [];
  archivedProjects: Project[] = [];
  filteredActiveProjects: Project[] = [];
  filteredArchivedProjects: Project[] = [];
  isOptionsOpened: boolean = false;
  isArchiveOpened: boolean = false;
  state = 'closed';
  isError: boolean = false;
  isLoading: boolean = true;


  async ngOnInit(): Promise<void> {
    try {
      const response = await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/get-projects', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlyActiveProjects: false })
      });
      if (response.ok) {
        const projects = await response.json();
        for (let i = 0; i < projects.length; i++) {
          if (projects[i].active) this.activeProjects.push(projects[i]);
          else this.archivedProjects.push(projects[i]);
        }
        this.filteredActiveProjects = [...this.activeProjects];
        this.filteredArchivedProjects = [...this.archivedProjects];
        this.isLoading = false;
        this.getProjects.emit(projects);
      }
    } catch (e) {
      this.isError = true;
      console.error('Error: ', e);
    }
  }

  filterProjects(event: KeyboardEvent): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredActiveProjects = this.activeProjects.filter(project => project.name.toLowerCase().includes(searchTerm));
    this.filteredArchivedProjects = this.archivedProjects.filter(project => project.name.toLowerCase().includes(searchTerm));
  }

  onButtonGroupClick($event: any): void {
    const clickedElement = $event.target || $event.srcElement;
    if (clickedElement.nodeName === 'BUTTON') {
      const isCertainButtonAlreadyActive = clickedElement.parentElement.parentElement.querySelector('.active');
      if (isCertainButtonAlreadyActive) {
        isCertainButtonAlreadyActive.classList.remove('active');
      }
      clickedElement.className += ' active';
    }
  }

  archiveProject(projectToArchive: Project): void {
    this.activeProjects = this.activeProjects.filter(project => project.id !== projectToArchive.id);
    projectToArchive.active = false;
    this.archivedProjects.push(projectToArchive);
    this.archivedProjects = this.archivedProjects.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    this.filteredActiveProjects = [...this.activeProjects];
    this.filteredArchivedProjects = [...this.archivedProjects];
    if (!this.isArchiveOpened) {
      const archiveOpenerButton = document.querySelector('.archive-opener-button');
      if (archiveOpenerButton instanceof HTMLElement)
        archiveOpenerButton.click();
      setTimeout(() => {
        const button = document.getElementById(projectToArchive.name);
        if (button)
          button.className += ' active';
      }, 500);
    }
  }

  reactivateProject(projectToReactivate: Project): void {
    this.archivedProjects = this.archivedProjects.filter(project => project.id !== projectToReactivate.id);
    projectToReactivate.active = true;
    this.activeProjects.push(projectToReactivate);
    this.activeProjects = this.activeProjects.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    this.filteredActiveProjects = [...this.activeProjects];
    this.filteredArchivedProjects = [...this.archivedProjects];
    setTimeout(() => {
      const button = document.getElementById(projectToReactivate.name);
      if (button)
        button.className += ' active';
    }, 500);
  }

  onProjectSelect($event: any, project: Project) {
    let clickedElement = $event.target || $event.srcElement;
    if (clickedElement.nodeName === 'BUTTON') {
      if (!clickedElement.className.includes('active'))
        this.projectSelect.emit(project);
    }
  }

  optionsController(): void {
    if (this.state === 'closed') {
      this.state = 'open';
      setTimeout(() => this.isOptionsOpened = true, 150);
    } else {
      this.state = 'closed';
      this.isOptionsOpened = false;
    }
  }

  archiveController(): void {
    this.isArchiveOpened = !this.isArchiveOpened;
  }

  createNewProject(): void {
    this.openNewProjectEditor.emit();
  }

  saveProject(project: Project): void {
    this.activeProjects.push(project);
    this.activeProjects.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    this.filteredActiveProjects = [...this.activeProjects];
    this.filteredArchivedProjects = [...this.archivedProjects];
  }
}
