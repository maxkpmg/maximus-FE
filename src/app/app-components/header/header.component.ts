import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'HeaderComponent',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {}