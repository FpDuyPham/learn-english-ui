import { Component, forwardRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SliderModule } from 'primeng/slider';

@Component({
  selector: 'app-my-slider',
  standalone: true,
  imports: [CommonModule, FormsModule, SliderModule],
  template: `
    <p-slider
      [ngModel]="value"
      (ngModelChange)="onChange($event)"
      [disabled]="disabled"
      [min]="min"
      [max]="max"
      [step]="step"
      [style]="style"
    ></p-slider>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MySliderComponent),
      multi: true,
    },
  ],
})
export class MySliderComponent implements ControlValueAccessor {
  @Input() min: number;
  @Input() max: number;
  @Input() step: number = 1;
  @Input() style: any;

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
