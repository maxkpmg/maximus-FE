import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'UserFilterComponent',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './user-filter.component.html',
  styleUrl: './user-filter.component.css'
})
export class UserFilterComponent {
  viewType: string = 'monthly';
  @Output() onChangeView = new EventEmitter<void>();


  onRadioClick(): void {
    this.onChangeView.emit();
  }
}