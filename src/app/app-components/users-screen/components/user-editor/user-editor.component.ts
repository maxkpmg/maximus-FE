import { Component, ElementRef, Input, Output, ViewChild, EventEmitter, AfterViewInit, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../interfaces';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { LoadingSpinnerComponent } from '../../../loading-spinner/loading-spinner.component';

@Component({
  selector: 'UserEditorComponent',
  standalone: true,
  imports: [FormsModule, LoadingSpinnerComponent],
  templateUrl: './user-editor.component.html',
  styleUrl: './user-editor.component.css',
  animations: [
    trigger('openClose', [
      state('open', style({ opacity: 1 })),
      state('closed', style({ opacity: 0 })),
      transition('closed => open', [animate(150)]),
      transition('open => closed', [animate(150)])
    ])
  ]
})
export class UserEditorComponent implements OnInit, AfterViewInit {
  @Input() user: User;
  @Input() users: User[] = [];
  @Output() save = new EventEmitter<{ user: User, isNewUser: boolean }>();
  @Output() close = new EventEmitter<void>();
  @ViewChild('fn') fnameFieldRef: ElementRef;
  @ViewChild('ln') lnameFieldRef: ElementRef;
  @ViewChild('p') phoneFieldRef: ElementRef;
  @ViewChild('e') emailFieldRef: ElementRef;
  id: number;
  fname: string = '';
  lname: string = '';
  phone: string = '';
  email: string = '';
  active: boolean = true;
  existValid: boolean = true;
  fnameValid: boolean = true;
  lnameValid: boolean = true;
  phoneValid: boolean = true;
  emailValid: boolean = true;
  state = 'closed';
  serverError: boolean = false;
  isLoading: boolean = false;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    if (this.user.id > -1) {
      this.id = this.user.id;
      this.fname = this.user.fname;
      this.lname = this.user.lname;
      this.phone = this.user.phone;
      this.email = this.user.email;
      this.active = this.user.active;
    }
  }

  ngAfterViewInit(): void {
    this.state = 'open';
    this.cdr.detectChanges();
  }

  closeAction(): void {
    this.state = 'closed';
    this.cdr.detectChanges();
    this.close.emit();
  }

  async saveAction(): Promise<void> {
    if (this.validateData()) {
      const data: User = {
        id: this.id,
        fname: this.fname.charAt(0).toUpperCase() + this.fname.slice(1).toLowerCase(),
        lname: this.lname.charAt(0).toUpperCase() + this.lname.slice(1).toLowerCase(),
        phone: this.phone,
        email: this.email.toLowerCase(),
        active: this.active
      }
      const isNewUser = this.user.id > -1 ? false : true;
      const path = isNewUser ? '/create-user' : '/edit-user';
      try {
        this.isLoading = true;
        const response = await fetch('https://maximus-time-reports-apc6eggvf0c0gbaf.westeurope-01.azurewebsites.net' + path, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: data })
        });
        if (response.ok) {
          if (isNewUser)
            data.id = await response.json();
          this.save.emit({ user: data, isNewUser: isNewUser });
          this.isLoading = false;
        }
      } catch (e) {
        this.isLoading = false;
        this.serverError = true;
        console.error('Error: ', e);
      }
    }
  }

  validateData(): boolean {
    if (this.user.id < 1) {
      for (let i = 0; i < this.users.length; i++) {
        if (this.users[i].email === this.email) {
          this.existValid = false;
          return false;
        }
      }
    }
    this.existValid = true;

    if (!/^[a-zA-Z]+$/.test(this.fname)) {
      this.fnameValid = false;
      this.fnameFieldRef.nativeElement.classList.add('invalid');
    } else {
      this.fnameValid = true;
      this.fnameFieldRef.nativeElement.classList.remove('invalid');
    }

    if (!/^[a-zA-Z]+$/.test(this.lname)) {
      this.lnameValid = false;
      this.lnameFieldRef.nativeElement.classList.add('invalid');
    } else {
      this.lnameValid = true;
      this.lnameFieldRef.nativeElement.classList.remove('invalid');
    }

    if (!/^05\d{8}$/.test(this.phone)) {
      this.phoneValid = false;
      this.phoneFieldRef.nativeElement.classList.add('invalid');
    } else {
      this.phoneValid = true;
      this.phoneFieldRef.nativeElement.classList.remove('invalid');
    }

    if (!/^[a-z0-9]+@kpmg\.com$/.test(this.email.toLowerCase())) {
      this.emailValid = false;
      this.emailFieldRef.nativeElement.classList.add('invalid');
    } else {
      this.emailValid = true;
      this.emailFieldRef.nativeElement.classList.remove('invalid');
    }
    console.log(`${this.fnameValid} && ${this.lnameValid} && ${this.emailValid} && ${this.phoneValid}`)
    return this.fnameValid && this.lnameValid && this.emailValid && this.phoneValid;
  }
}
