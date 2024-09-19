import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { User } from '../../../../interfaces';

@Component({
  selector: 'UsersSidebarComponent',
  standalone: true,
  imports: [],
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
export class UsersSidebarComponent implements OnChanges {
  @Output() userSelect = new EventEmitter<User>();
  @Output() openNewUserEditor = new EventEmitter<void>();
  @Input() activeUsers: User[];
  @Input() archivedUsers: User[];
  filteredActiveUsers: User[] = [];
  filteredArchivedUsers: User[] = [];
  isOptionsOpened: boolean = false;
  isArchiveOpened: boolean = false;
  state = 'closed';


  ngOnChanges(changes: SimpleChanges): void {
    this.filteredActiveUsers = [...this.activeUsers];
    this.filteredArchivedUsers = [...this.archivedUsers];
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

  onUserSelect($event: any, user: User) {
    const clickedElement = $event.target || $event.srcElement;
    if (clickedElement.nodeName === 'BUTTON') {
      if (!clickedElement.className.includes('active'))
        this.userSelect.emit(user);
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

  createNewUser(): void {
    this.openNewUserEditor.emit();
  }

  saveNewUser(user: User): void {
    this.activeUsers.push(user);
    this.activeUsers.sort((a, b) => `${a.fname} ${a.lname}`.toLowerCase().localeCompare(`${b.fname} ${b.lname}`.toLowerCase()));
    setTimeout(() => {
      this.activeUsers = [...this.activeUsers];
      this.filteredActiveUsers = [...this.activeUsers];
      this.filteredArchivedUsers = [...this.archivedUsers];
    }, 1000);
  }

  filterUsers(event: KeyboardEvent): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredActiveUsers = this.activeUsers.filter(user => user.fname.toLowerCase().includes(searchTerm) || user.lname.toLowerCase().includes(searchTerm));
    this.filteredArchivedUsers = this.archivedUsers.filter(user => user.fname.toLowerCase().includes(searchTerm) || user.lname.toLowerCase().includes(searchTerm));
  }
}