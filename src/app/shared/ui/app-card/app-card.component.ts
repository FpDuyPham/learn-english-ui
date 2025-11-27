import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

/**
 * Wrapper for PrimeNG Card component
 * Provides consistent card styling across the application
 */
@Component({
    selector: 'app-card',
    standalone: true,
    imports: [CommonModule, CardModule],
    template: `
    <p-card
      [header]="header"
      [subheader]="subheader"
      [styleClass]="customClass">
      <ng-template pTemplate="header" *ngIf="headerTemplate">
        <ng-content select="[header]"></ng-content>
      </ng-template>

      <ng-content></ng-content>

      <ng-template pTemplate="footer" *ngIf="footerTemplate">
        <ng-content select="[footer]"></ng-content>
      </ng-template>
    </p-card>
  `,
    styles: [`
    :host {
      display: block;
    }
  `]
})
export class AppCardComponent {
    @Input() header?: string;
    @Input() subheader?: string;
    @Input() customClass = '';
    @Input() headerTemplate = false;
    @Input() footerTemplate = false;
}
