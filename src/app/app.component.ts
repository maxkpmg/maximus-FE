import { Component } from '@angular/core';
import { HeaderComponent } from './app-components/header/header.component';
import { ProjectsScreenComponent } from './app-components/projects-screen/projects.component';
import { UsersScreenComponent } from './app-components/users-screen/users.component';
import { TasksScreenComponent } from './app-components/tasks-screen/tasks.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, ProjectsScreenComponent, UsersScreenComponent, TasksScreenComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  tab: string = 'users';


  tabSwitch(type: string): void {
    this.tab = type;
  }
}
