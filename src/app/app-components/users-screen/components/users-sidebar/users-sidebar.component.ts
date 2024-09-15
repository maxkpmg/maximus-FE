import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { User } from '../../../../interfaces';
import { LoadingSpinnerComponent } from '../../../loading-spinner/loading-spinner.component';

@Component({
  selector: 'UsersSidebarComponent',
  standalone: true,
  imports: [LoadingSpinnerComponent],
  templateUrl: './users-sidebar.component.html',
  styleUrl: './users-sidebar.component.css',
  animations: [
    trigger('openClose', [
      state('closed', style({ 'height': '5vh', 'background-color': 'transparent' })),
      state('open', style({ 'height': '11.5vh', 'background-color': 'rgb(0, 0, 0, 0.1)' })),
      transition('closed => open', [animate(150)]),
      transition('open => closed', [animate(150)])
    ])
  ]
})
export class UsersSidebarComponent implements OnInit {
  @Input() users: User [];
  @Output() userSelect = new EventEmitter<User>();
  @Output() openNewUserEditor = new EventEmitter<void>();
  @Output() getUsers = new EventEmitter<User[]>();
  activeUsers: User[] = [];
  archivedUsers: User[] = [];
  filteredActiveUsers: User[] = [];
  filteredArchivedUsers: User[] = [];
  isOptionsOpened: boolean = false;
  isArchiveOpened: boolean = false;
  state = 'closed';
  isError: boolean = false;
  isLoading: boolean = true;


  async ngOnInit(): Promise<void> {
    try {
      const response = await fetch('http://127.0.0.1:8000/get-users', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlyActiveUsers: false })
      });
      if (response.ok) {
        const users = await response.json();
        for (let i = 0; i < users.length; i++) {
          if (users[i].active) this.activeUsers.push(users[i]);
          else this.archivedUsers.push(users[i]);
        }
        this.filteredActiveUsers = [...this.activeUsers];
        this.filteredArchivedUsers = [...this.archivedUsers];
        this.isLoading = false;
        this.getUsers.emit(users);
      }
    } catch (e) {
      this.isError = true;
      console.error('Error: ', e);
    }
  }

  onButtonGroupClick($event: any): void {
    let clickedElement = $event.target || $event.srcElement;
    if (clickedElement.nodeName === 'BUTTON') {
      let isCertainButtonAlreadyActive = clickedElement.parentElement.parentElement.querySelector('.active');
      if (isCertainButtonAlreadyActive) {
        isCertainButtonAlreadyActive.classList.remove('active');
      }
      clickedElement.className += ' active';
    }
  }

  archiveUser(userToArchive: User): void {
    this.activeUsers = this.activeUsers.filter(project => project !== userToArchive);
    userToArchive.active = false;
    this.archivedUsers.push(userToArchive);
    this.archivedUsers = this.archivedUsers.sort((a, b) => `${a.fname} ${a.lname}`.toLowerCase().localeCompare(`${b.fname} ${b.lname}`.toLowerCase()));
    this.filteredActiveUsers = [...this.activeUsers];
    this.filteredArchivedUsers = [...this.archivedUsers];
    if (!this.isArchiveOpened) {
      const archiveOpenerButton = document.querySelector('.archive-opener-button');
      if (archiveOpenerButton instanceof HTMLElement)
        archiveOpenerButton.click();
      setTimeout(() => {
        const button = document.getElementById(`${userToArchive.fname}${userToArchive.lname}${userToArchive.id}`);
        if (button)
          button.className += ' active';
      }, 500);
    }
  }

  reactivateUser(userToReactivate: User): void {
    this.archivedUsers = this.archivedUsers.filter(user => user.id !== userToReactivate.id);
    userToReactivate.active = true;
    this.activeUsers.push(userToReactivate);
    this.activeUsers = this.activeUsers.sort((a, b) => `${a.fname} ${a.lname}`.toLowerCase().localeCompare(`${b.fname} ${b.lname}`.toLowerCase()));
    this.filteredActiveUsers = [...this.activeUsers];
    this.filteredArchivedUsers = [...this.archivedUsers];
    setTimeout(() => {
      const button = document.getElementById(`${userToReactivate.fname}${userToReactivate.lname}${userToReactivate.id}`);
      if (button)
        button.className += ' active';
    }, 500);
  }

  onUserSelect($event: any, user: User) {
    const clickedElement = $event.target || $event.srcElement;
    if (clickedElement.nodeName === 'BUTTON') {
      if (!clickedElement.className.includes('active'))
        this.userSelect.emit(user);
    }
  }

  optionsController():void {
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

  createNewUser(): void {
    this.openNewUserEditor.emit();
  }

  saveNewUser(user: User): void {
    this.activeUsers.push(user);
    this.activeUsers.sort((a, b) => `${a.fname} ${a.lname}`.toLowerCase().localeCompare(`${b.fname} ${b.lname}`.toLowerCase()));
    this.activeUsers = [...this.activeUsers];
    this.filteredActiveUsers = [...this.activeUsers];
    this.filteredArchivedUsers = [...this.archivedUsers];
  }

  filterUsers(event: KeyboardEvent): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredActiveUsers = this.activeUsers.filter(user => user.fname.toLowerCase().includes(searchTerm) || user.lname.toLowerCase().includes(searchTerm));
    this.filteredArchivedUsers = this.archivedUsers.filter(user => user.fname.toLowerCase().includes(searchTerm) || user.lname.toLowerCase().includes(searchTerm));
  }
}