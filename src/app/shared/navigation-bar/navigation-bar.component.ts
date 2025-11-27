import { Component, Input, Output, EventEmitter } from '@angular/core';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navigation-bar',
  standalone: true,
  imports: [CommonModule, ButtonModule, InputNumberModule, ProgressBarModule, FormsModule],
  template: `
    <div class="flex flex-column gap-3 w-full">
      <!-- Progress Bar -->
      <div class="w-full">
        <div class="flex justify-content-between mb-1">
            <span class="text-sm text-600 font-medium">Progress</span>
            <span class="text-sm font-bold text-900">{{ current }} / {{ total }}</span>
        </div>
        <p-progressBar [value]="(current / total) * 100" [showValue]="false" styleClass="h-1rem"></p-progressBar>
      </div>

      <!-- Navigation Controls -->
      <div class="flex justify-content-between align-items-center surface-card p-2 border-round shadow-1">
        <p-button 
            icon="pi pi-arrow-left" 
            (onClick)="previous.emit()" 
            [disabled]="current === 1" 
            [rounded]="true" 
            [text]="true" 
            label="Prev">
        </p-button>

        <div class="flex align-items-center gap-2">
            <span class="text-sm font-medium hidden sm:inline">Go to:</span>
            <p-inputNumber 
                [(ngModel)]="current" 
                [min]="1" 
                [max]="total" 
                [showButtons]="true" 
                buttonLayout="horizontal" 
                inputStyleClass="w-3rem text-center p-0"
                decrementButtonClass="p-button-secondary p-button-text"
                incrementButtonClass="p-button-secondary p-button-text"
                incrementButtonIcon="pi pi-plus"
                decrementButtonIcon="pi pi-minus">
            </p-inputNumber>
            <p-button 
                icon="pi pi-arrow-right" 
                (onClick)="move.emit(current)" 
                [rounded]="true" 
                [text]="true"
                pTooltip="Go">
            </p-button>
        </div>

        <p-button 
            label="Next" 
            icon="pi pi-arrow-right" 
            iconPos="right" 
            (onClick)="next.emit()" 
            [disabled]="current === total" 
            [rounded]="true" 
            [text]="true">
        </p-button>
      </div>
    </div>
  `
})
export class NavigationBarComponent {
  @Input() current: number;
  @Input() total: number;
  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() move = new EventEmitter<number>();
}
