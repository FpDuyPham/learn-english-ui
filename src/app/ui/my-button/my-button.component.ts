import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-my-button',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <p-button
      (click)="onClick.emit($event)"
      [label]="label"
      [disabled]="disabled"
      [styleClass]="styleClass"
    ></p-button>
  `,
})
export class MyButtonComponent {
  @Input() label: string;
  @Input() disabled: boolean;
  @Input() styleClass: string;
  @Output() onClick = new EventEmitter<any>();
}
