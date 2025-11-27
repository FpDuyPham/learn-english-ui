import { Component, Output, EventEmitter } from '@angular/core';
import {MyButtonComponent} from '../my-button/my-button.component'; // Import PrimeNG ButtonModule

@Component({
  standalone: true,
  selector: 'app-action-buttons',
  template: `
    <div class="action-buttons">
      <app-my-button label="Check" styleClass="p-button-success" (click)="check.emit()"></app-my-button>
      <app-my-button label="Skip" styleClass="p-button-secondary" (click)="skip.emit()"></app-my-button>
    </div>
  `,
  imports: [MyButtonComponent], // Add ButtonModule to imports
  styles: [
    `
      .action-buttons {
        display: flex;
        gap: 10px; /* Add spacing between buttons */
      }
    `,
  ],
})
export class ActionButtonsComponent {
  @Output() check = new EventEmitter<void>();
  @Output() skip = new EventEmitter<void>();
}
