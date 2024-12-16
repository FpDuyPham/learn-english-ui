import { Component, forwardRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-my-input-number',
  standalone: true,
  imports: [CommonModule, FormsModule, InputNumberModule],
  template: `
    <p-inputNumber
      [ngModel]="value"
      (ngModelChange)="onChange($event)"
      [disabled]="disabled"
      [min]="min"
      [max]="max"
      [mode]="mode"
      [step]="step"
    ></p-inputNumber>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MyInputNumberComponent),
      multi: true,
    },
  ],
})
export class MyInputNumberComponent implements ControlValueAccessor {
  @Input() min: number;
  @Input() max: number;
  @Input() mode: string = 'decimal';
  @Input() step: number = 1;

  value: number;
  disabled: boolean;

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: number): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
