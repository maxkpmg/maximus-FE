import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'HeaderComponent',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Output() tab = new EventEmitter<string>();

  onButtonGroupClick($event: any): void {
    let clickedElement = $event.target || $event.srcElement;
    if (clickedElement.nodeName === "BUTTON") {
      let isCertainButtonAlreadyActive = clickedElement.parentElement.querySelector(".active");
      if (isCertainButtonAlreadyActive) {
        isCertainButtonAlreadyActive.classList.remove("active");
      }
      clickedElement.className += " active";
    }
  }

  onButtonClick($event: any, type: string): void {
    let clickedElement = $event.target || $event.srcElement;
    if (clickedElement.nodeName === "BUTTON") {
      if (!clickedElement.className.includes("active"))
        this.tab.emit(type);
    }
  }
}
