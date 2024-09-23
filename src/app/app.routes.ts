import { Routes } from '@angular/router';
import { UsersScreenComponent } from './app-components/users-screen/users.component';
import { ProjectsScreenComponent } from './app-components/projects-screen/projects.component';
import { TasksScreenComponent } from './app-components/tasks-screen/tasks.component';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: '/users' },
    { path: 'users', component: UsersScreenComponent },
    { path: 'projects', component: ProjectsScreenComponent },
    { path: 'tasks', component: TasksScreenComponent },
    { path: '**', redirectTo: '' }
];
