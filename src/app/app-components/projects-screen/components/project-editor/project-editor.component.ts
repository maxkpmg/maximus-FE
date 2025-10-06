import { Component, AfterViewInit, Input, Output, EventEmitter, ChangeDetectorRef, ViewChild, ElementRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Project, User, Stage } from '../../../../interfaces';
import { LoadingSpinnerComponent } from '../../../loading-spinner/loading-spinner.component';

@Component({
  selector: 'ProjectEditorComponent',
  standalone: true,
  imports: [FormsModule, LoadingSpinnerComponent],
  templateUrl: './project-editor.component.html',
  styleUrl: './project-editor.component.css',
  animations: [
    trigger('openClose', [
      state('open', style({ opacity: 1 })),
      state('closed', style({ opacity: 0 })),
      transition('closed => open', [animate(150)]),
      transition('open => closed', [animate(150)])
    ])
  ]
})
export class ProjectEditorComponent implements OnInit, AfterViewInit {
  @Input() project: Project;
  @Input() activeProjects: Project[];
  @Input() archivedProjects: Project[];
  @Output() save = new EventEmitter<{ project: Project, isNewProject: boolean }>();
  @Output() close = new EventEmitter<void>();
  @ViewChild('n') nameFieldRef: ElementRef;

  users: User[] = [];
  projectUsers: User[] = [];
  projectUsersToDisplay: User[] = [];
  usersToSave: User[] = [];
  usersToDelete: User[] = [];

  newStageName: string = '';
  projectStages: Stage[] = [];
  projectStagesToDisplay: Stage[] = [];
  stagesToSave: Stage[] = [];
  stagesToDelete: Stage[] = [];

  prevName: string = '';
  name: string = '';
  state = 'closed';
  error: string = '';
  isLoading: boolean = false;

  constructor(private cdr: ChangeDetectorRef) { }

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    if (this.project.id > 0)
      this.name = this.prevName = this.project.name;
    try {
      if (this.project.id > 0) {
        await this.getProjectUsers();
        await this.getProjectStages();
      }
      await this.getUsers();
      this.isLoading = false;
    }
    catch (e) {
      this.isLoading = false;
      this.error = 'Server error, failed to fetch data';
      console.error('Error: ', e);
    }
  }

  ngAfterViewInit(): void {
    this.state = 'open';
    this.cdr.detectChanges();
  }

  async getProjectUsers(): Promise<void> {
    const response = await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/get-project-users', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: this.project.id })
    });
    if (response.ok) {
      const data = await response.json();
      this.projectUsers = [...data];
      this.projectUsersToDisplay = [...data];
    }
  }

  async getUsers(): Promise<void> {
    const response = await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/get-users', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onlyActiveUsers: true })
    });
    if (response.ok) {
      const data: User[] = await response.json();
      data.forEach(user => {
        const existsInProjectUsers = this.projectUsers.some(projectUser => projectUser.id === user.id);
        if (!existsInProjectUsers) this.users.push(user);
      });
    }
  }

    async getProjectStages(): Promise<void> {
    const response = await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/get-project-stages', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: this.project.id })
    });
    if (response.ok) {
      const data = await response.json();
      this.projectStages = [...data];
      this.projectStagesToDisplay = [...data];
    }
  }

  // === STAGES ACTIONS ===
  addProjectStage(): void {
    const name = this.newStageName.trim();
    if (!name) return;

    // prevent duplicates (case-insensitive)
    const exists = this.projectStagesToDisplay.some(s => s.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      this.error = 'Stage already added';
      return;
    }

    // create new stage object (no id yet, backend will assign)
    const stageToAdd: Stage = { id: -1, project_id: this.project.id, name };

    this.projectStagesToDisplay.push(stageToAdd);
    this.stagesToSave.push(stageToAdd);
    this.newStageName = '';
    this.error = '';
  }

  deleteProjectStage(stageToDelete: Stage): void {
    // remove from currently displayed stages
    this.projectStagesToDisplay = this.projectStagesToDisplay.filter(
      stage => stage.id !== stageToDelete.id
    );
    // if the stage was queued to be saved but not yet persisted, cancel that
    this.stagesToSave = this.stagesToSave.filter(
      stage => stage.id !== stageToDelete.id
    );
    // if the stage already existed in the project (not a brand new one), queue it for deletion
    if (this.projectStages.some(stage => stage.id === stageToDelete.id)) {
      this.stagesToDelete.push(stageToDelete);
    }
  }

  async saveProjectStages(): Promise<void> {
    await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/add-project-stages', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: this.project.id, stages: this.stagesToSave })
    });
  }

  async deleteProjectStages(): Promise<void> {
    await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/delete-project-stages', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: this.project.id, stages: this.stagesToDelete })
    });
  }

  closeAction(): void {
    this.state = 'closed';
    this.cdr.detectChanges();
    this.close.emit();
  }

  async saveAction(): Promise<void> {
    if (this.validateName()) {
      try {
        this.isLoading = true;
        await this.saveProject();

        if (this.usersToDelete.length) await this.deleteProjectUsers();
        if (this.usersToSave.length) await this.saveProjectUsers();

        if (this.stagesToDelete.length) await this.deleteProjectStages();
        if (this.stagesToSave.length) await this.saveProjectStages();

        this.isLoading = false;
      } catch (e) {
        this.isLoading = false;
        this.error = 'Server error, failed to save';
        console.error('Error: ', e);
      }
    }
  }

  validateName(): boolean {
    this.name = this.name.trim();
    if (this.project.id > -1 && this.name === this.prevName) {
      return true;
    }
    if (this.name === '') {
      this.nameFieldRef.nativeElement.classList.add('invalid');
      this.error = 'Empty project name';
      return false;
    }
    if (this.activeProjects.some(project => project.name.toLowerCase() === this.name.toLowerCase()) ||
      this.archivedProjects.some(project => project.name.toLowerCase() === this.name.toLowerCase()))
    {
      this.nameFieldRef.nativeElement.classList.add('invalid');
      this.error = 'Project name alread exists';
      return false;
    }
    return true;
  }

  addProjectUser(userToAdd: User): void {
    this.projectUsersToDisplay.push(userToAdd);
    this.users = this.users.filter(user => user.id !== userToAdd.id);
    this.usersToDelete = this.usersToDelete.filter(user => user.id !== userToAdd.id);
    if (!this.projectUsers.some(user => user.id === userToAdd.id)) {
      this.usersToSave.push(userToAdd);
    }
  }

  deleteProjectUser(userToDelete: User): void {
    this.projectUsersToDisplay = this.projectUsersToDisplay.filter(user => user.id !== userToDelete.id);
    this.users.push(userToDelete);
    this.users.sort((a, b) => `${a.fname} ${a.lname}`.toLowerCase().localeCompare(`${b.fname} ${b.lname}`.toLowerCase()));
    this.usersToSave = this.usersToSave.filter(user => user.id !== userToDelete.id);
    if (this.projectUsers.some(user => user.id === userToDelete.id))
      this.usersToDelete.push(userToDelete);
  }

  async saveProject(): Promise<void> {
    const isNewProject = this.project.id > -1 ? false : true;
    const path = isNewProject ? '/create-project' : '/edit-project';
    this.project.name = this.name.charAt(0).toUpperCase() + this.name.slice(1);
    const response = await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net' + path, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: this.project })
    });
    if (response.ok) {
      if (isNewProject) {
        this.project.id = await response.json();
        this.project.active = true;
      }
      this.save.emit({ project: this.project, isNewProject: isNewProject });
    }
  }

  async saveProjectUsers(): Promise<void> {
    await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/add-project-users', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: this.project.id, users: this.usersToSave })
    });
  }

  async deleteProjectUsers(): Promise<void> {
    await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net/delete-project-users', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: this.project.id, users: this.usersToDelete })
    });
  }
}
