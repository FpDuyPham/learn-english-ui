import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

/**
 * Wrapper for PrimeNG Button component
 * Provides consistent styling and behavior across the application
 */
@Component({
    selector: 'app-button',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    template: `
    <p-button
      [label]="label"
      [icon]="icon"
      [iconPos]="iconPos"
      [severity]="severity"
      [size]="size"
      [outlined]="outlined"
      [raised]="raised"
      [rounded]="rounded"
      [text]="text"
      [disabled]="disabled"
      [loading]="loading"
      [type]="type"
      [badge]="badge"
      [badgeSeverity]="badgeSeverity"
      (onClick)="handleClick($event)">
    </p-button>
  `,
    styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class AppButtonComponent {
    @Input() label?: string;
    @Input() icon?: string;
    @Input() iconPos: 'left' | 'right' | 'top' | 'bottom' = 'left';
    @Input() severity: 'success' | 'info' | 'warn' | 'danger' | 'help' | 'primary' | 'secondary' | 'contrast' = 'primary';
    @Input() size: 'small' | 'large' = 'small';
    @Input() outlined = false;
    @Input() raised = false;
    @Input() rounded = false;
    @Input() text = false;
    @Input() disabled = false;
    @Input() loading = false;
    @Input() type: 'button' | 'submit' | 'reset' = 'button';
    @Input() badge?: string;
    @Input() badgeSeverity?: 'success' | 'info' | 'warn' | 'danger';

    @Output() clicked = new EventEmitter<Event>();

    handleClick(event: Event): void {
        if (!this.disabled && !this.loading) {
            this.clicked.emit(event);
        }
    }
}
