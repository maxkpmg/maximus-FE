import { Component } from '@angular/core';
import { TasksSidebarComponent } from './components/tasks-sidebar/tasks-sidebar.component';
// import { TasksInfoComponent } from './components/tasks-info/tasks-info.component';
// import { TasksListComponent } from './components/tasks-list/tasks-list.component';

@Component({
  selector: 'TasksScreenComponent',
  standalone: true,
  imports: [
    TasksSidebarComponent,
    // TasksInfoComponent,
    // TasksListComponent
  ],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css'
})
export class TasksScreenComponent {

}
