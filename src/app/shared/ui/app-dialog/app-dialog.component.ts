import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';

/**
 * Wrapper for PrimeNG Dialog component
 * Provides consistent modal styling and behavior
 */
@Component({
    selector: 'app-dialog',
    standalone: true,
    imports: [CommonModule, DialogModule],
    template: `
    <p-dialog
      [(visible)]="visible"
      (visibleChange)="handleVisibleChange($event)"
      [header]="header"
      [modal]="modal"
      [closable]="closable"
      [dismissableMask]="dismissableMask"
      [draggable]="draggable"
      [resizable]="resizable"
      [position]="position"
      [styleClass]="customClass"
      [maximizable]="maximizable"
      [blockScroll]="blockScroll"
      [closeOnEscape]="closeOnEscape"
      (onHide)="handleHide()">

      <ng-template pTemplate="header" *ngIf="headerTemplate">
        <ng-content select="[header]"></ng-content>
      </ng-template>

      <ng-content></ng-content>

      <ng-template pTemplate="footer" *ngIf="footerTemplate">
        <ng-content select="[footer]"></ng-content>
      </ng-template>
    </p-dialog>
  `,
    styles: [`
    :host {
      display: contents;
    }
  `]
})
export class AppDialogComponent {
    @Input() visible = false;
    @Input() header?: string;
    @Input() modal = true;
    @Input() closable = true;
    @Input() dismissableMask = false;
    @Input() draggable = false;
    @Input() resizable = false;
    @Input() position: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright' = 'center';
    @Input() customClass = '';
    @Input() maximizable = false;
    @Input() blockScroll = true;
    @Input() closeOnEscape = true;
    @Input() headerTemplate = false;
    @Input() footerTemplate = false;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() hide = new EventEmitter<void>();

    handleVisibleChange(value: boolean): void {
        this.visible = value;
        this.visibleChange.emit(value);
    }

    handleHide(): void {
        this.hide.emit();
    }
}
