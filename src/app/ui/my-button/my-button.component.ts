import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-my-button',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <p-button
      [rounded]="true"
      [raised]="raised"
      (click)="onClick.emit($event)"
      [label]="label"
      [disabled]="disabled"
      [styleClass]="styleClass"
      [icon]="icon"
    ></p-button>
  `,
})
export class MyButtonComponent {
  @Input() label: string;
  @Input() disabled: boolean;
  @Input() styleClass: string;
  @Input() icon: string;
  @Input() raised: boolean = true;
  @Output() onClick = new EventEmitter<any>();
}
