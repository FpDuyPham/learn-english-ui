import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';

/**
 * Wrapper for PrimeNG InputText component
 * Implements ControlValueAccessor for Angular Forms integration
 */
@Component({
    selector: 'app-input',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, FloatLabelModule],
    template: `
    <p-floatlabel *ngIf="label; else noLabel">
      <input
        pInputText
        [id]="inputId"
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [readonly]="readonly"
        [maxlength]="maxlength"
        [size]="size"
        [autocomplete]="autocomplete"
        [(ngModel)]="value"
        (ngModelChange)="onValueChange($event)"
        (blur)="onTouched()"
        [class.ng-invalid]="invalid"
        [class.ng-dirty]="dirty"
      />
      <label [for]="inputId">{{ label }}</label>
    </p-floatlabel>

    <ng-template #noLabel>
      <input
        pInputText
        [id]="inputId"
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [readonly]="readonly"
        [maxlength]="maxlength"
        [size]="size"
        [autocomplete]="autocomplete"
        [(ngModel)]="value"
        (ngModelChange)="onValueChange($event)"
        (blur)="onTouched()"
        [class.ng-invalid]="invalid"
        [class.ng-dirty]="dirty"
      />
    </ng-template>

    <small *ngIf="helperText && !invalid" class="p-text-secondary">
      {{ helperText }}
    </small>
    <small *ngIf="invalid && errorMessage" class="p-error">
      {{ errorMessage }}
    </small>
  `,
    styles: [`
    :host {
      display: block;
      width: 100%;
    }

    input {
      width: 100%;
    }

    small {
      display: block;
      margin-top: 0.25rem;
    }
  `],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AppInputComponent),
            multi: true
        }
    ]
})
export class AppInputComponent implements ControlValueAccessor {
    @Input() inputId = `app-input-${Math.random().toString(36).substr(2, 9)}`;
    @Input() label?: string;
    @Input() placeholder = '';
    @Input() type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' = 'text';
    @Input() disabled = false;
    @Input() readonly = false;
    @Input() maxlength?: number;
    @Input() size?: number;
    @Input() autocomplete = 'off';
    @Input() invalid = false;
    @Input() dirty = false;
    @Input() helperText?: string;
    @Input() errorMessage?: string;

    @Output() valueChange = new EventEmitter<string>();

    private _value = '';

    get value(): string {
        return this._value;
    }

    set value(val: string) {
        this._value = val;
        this.onChange(val);
    }

    // ControlValueAccessor implementation
    onChange: any = () => { };
    onTouched: any = () => { };

    writeValue(value: string): void {
        this._value = value || '';
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    onValueChange(value: string): void {
        this.valueChange.emit(value);
    }
}
