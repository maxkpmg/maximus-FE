import { Component, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
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
export class ProjectsSidebarComponent implements OnChanges {
  @Output() projectSelect = new EventEmitter<Project>();
  @Output() openNewProjectEditor = new EventEmitter<void>();
  @Input() activeProjects: Project[];
  @Input() archivedProjects: Project[];
  filteredActiveProjects: Project[] = [];
  filteredArchivedProjects: Project[] = [];
  isOptionsOpened: boolean = false;
  isArchiveOpened: boolean = false;
  state = 'closed';


  ngOnChanges(changes: SimpleChanges): void {
    this.filteredActiveProjects = [...this.activeProjects];
    this.filteredArchivedProjects = [...this.archivedProjects];
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
    setTimeout(() => {
      this.filteredActiveProjects = [...this.activeProjects];
      this.filteredArchivedProjects = [...this.archivedProjects];
    }, 1000);
  }
}
