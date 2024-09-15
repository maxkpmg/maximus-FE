import { Component } from '@angular/core';
import { LoadingSpinnerComponent } from '../../../loading-spinner/loading-spinner.component';
import { Project } from '../../../../interfaces';

@Component({
  selector: 'TasksSidebarComponent',
  standalone: true,
  imports: [LoadingSpinnerComponent],
  templateUrl: './tasks-sidebar.component.html',
  styleUrl: './tasks-sidebar.component.css',
})
export class TasksSidebarComponent {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  isError: boolean = false;
  isLoading: boolean = true;


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
      if (!clickedElement.className.includes('active')){}
        //this.projectSelect.emit(project);
    }
  }

  filterProjects(event: KeyboardEvent): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredProjects = this.projects.filter(project => project.name.toLowerCase().includes(searchTerm));
  }
}
