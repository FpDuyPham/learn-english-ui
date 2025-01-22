import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea'; // If using PrimeNG
import { TooltipModule } from 'primeng/tooltip'; // For tooltip (optional)

@Component({
  selector: 'app-text-input',
  template: `
    <div class="text-input-container">
        <textarea
          pInputTextarea
          [(ngModel)]="userInput"
          (ngModelChange)="userInputChange.emit(userInput)"
          placeholder="Type what you hear..."
          (keyup.enter)="checkAnswer.emit()"
          (keydown.enter)="preventInput($event)"
          [rows]="2"
          [cols]="40"
        ></textarea>
    </div>
  `,
  standalone: true,
  imports: [FormsModule, TextareaModule, TooltipModule], // Import PrimeNG modules
  styles: [
    `
      .text-input-container {
        display: flex;
        align-items: center;
        border: 1px solid #ccc;
        border-radius: 5px;
        padding: 5px;
        width: fit-content;
      }

      textarea {
        flex-grow: 1;
        border: none;
        padding: 10px;
        font-size: 16px;
        resize: vertical; /* Allow vertical resizing */
      }
      textarea:focus {
        outline: none;
      }

      .fa-microphone {
        color: #666;
        cursor: pointer;
        padding: 10px;
        transition: color 0.2s; /* Add a transition for a smooth effect */
      }

      .fa-microphone:hover {
        color: #333; /* Darken color on hover */
      }

      .fa-microphone.active {
        color: #ff0000; /* Red when active */
      }

      /* PrimeNG Specific Styles */
      .p-inputtextarea {
        flex-grow: 1;
        width: auto;
      }
    `,
  ],
})
export class TextInputComponent {
  @Input() userInput: string;
  @Output() userInputChange = new EventEmitter<string>();
  @Output() checkAnswer = new EventEmitter<void>();

  usePrimeNG = true; // Set to false to use regular textarea
  isMicrophoneActive = false; // Track microphone state

  preventInput(event: Event) {
    event.preventDefault();
  }
}
