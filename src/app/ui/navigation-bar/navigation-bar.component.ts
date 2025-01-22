import { Component, Input, Output, EventEmitter } from '@angular/core';
import {MyButtonComponent} from '../my-button/my-button.component';
import {InputNumberModule} from 'primeng/inputnumber';
import {MyInputNumberComponent} from '../my-input-number/my-input-number.component';
import {CheckboxModule} from 'primeng/checkbox';
import {TooltipModule} from 'primeng/tooltip';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-navigation-bar',
  template: `
    <div>
      <div class="navigation-bar">
        <app-my-button
          icon="pi pi-angle-left"
          styleClass="p-button-rounded p-button-text"
          [disabled]="current === 1"
          (click)="previous.emit()"
        ></app-my-button>
        <span class="page-info">{{ current }} / {{ total }}</span>
        <app-my-button
          icon="pi pi-angle-right"
          styleClass="p-button-rounded p-button-text"
          [disabled]="current === total"
          (click)="next.emit()"
        ></app-my-button>
      </div>
      <div>
        <p-inputNumber [(ngModel)]="current" [min]="1" [showButtons]="true" mode="decimal"></p-inputNumber>
        <app-my-button
          icon="pi pi-play"
          styleClass="p-button-text"
          [raised]="false"
          (click)="move.emit(current)"
        ></app-my-button>
      </div>
    </div>
  `,
  standalone: true,
  imports: [MyButtonComponent, InputNumberModule, MyInputNumberComponent, FormsModule],
  styles: [
    `
      .navigation-bar {
        display: flex;
        align-items: center;
        gap: 10px; /* Spacing between elements */
        padding: 10px;
        /*background-color: #f8f9fa; !* Light background *!*/
        /*border: 1px solid #ddd;*/
        border-radius: 5px;
      }

      .page-info {
        font-weight: bold;
      }
    `,
  ],
})
export class NavigationBarComponent {
  @Input() current: number;
  @Input() total: number;
  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() move = new EventEmitter<number>();
}
