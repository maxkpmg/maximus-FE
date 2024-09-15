import { Component } from '@angular/core';
import { LoadingSpinnerComponent } from '../../../loading-spinner/loading-spinner.component';

@Component({
  selector: 'TasksListComponent',
  standalone: true,
  imports: [LoadingSpinnerComponent],
  templateUrl: './tasks-list.component.html',
  styleUrl: './tasks-list.component.css',
})
export class TasksListComponent {

}
