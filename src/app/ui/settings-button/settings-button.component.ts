import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { MyButtonComponent } from '../my-button/my-button.component';
import { CommonModule } from '@angular/common';

export interface SettingOption {
  label: string;
  value: any;
}

export interface Setting {
  label: string;
  options: SettingOption[];
  selected: any;
}

@Component({
  selector: 'app-settings-button',
  standalone: true,
  imports: [
    DialogModule,
    DropdownModule,
    FormsModule,
    CommonModule,
    TableModule,
    MyButtonComponent, // Add MyButtonComponent to imports
  ],
  template: `
    <app-my-button
      icon="pi pi-cog"
      label="Settings"
      (onClick)="showSettings = true"
      styleClass="p-button-text"
    ></app-my-button>

    <p-dialog
      header="Settings"
      [(visible)]="showSettings"
      [modal]="true"
      styleClass="settings-dialog"
      [style]="{ width: '550px' }"
      [baseZIndex]="10000"
      [draggable]="false"
      [resizable]="false"
    >
      <ng-container *ngIf="settings">
        <p-table [value]="settings" [tableStyle]="{ 'min-width': '200px' }">
          <ng-template pTemplate="header">
            <tr>
              <th>Label</th>
              <th>Value</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-setting>
            <tr>
              <td>{{ setting.label }}</td>
              <td>
                <p-dropdown
                  [options]="setting.options"
                  [(ngModel)]="setting.selected"
                  (onChange)="onSettingChange(setting)"
                  optionLabel="label"
                  [filter]="false"
                  [showClear]="false"
                  appendTo="body"
                ></p-dropdown>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </ng-container>

      <ng-template pTemplate="footer">
        <app-my-button
          icon="pi pi-check"
          label="Save"
          (onClick)="saveSettings.emit(settings); showSettings = false"
          styleClass="p-button-success"
        ></app-my-button>
        <app-my-button
          label="Close"
          (onClick)="showSettings = false"
          styleClass="p-button-text"
        ></app-my-button>
      </ng-template>
    </p-dialog>
  `,
  styleUrls: ['./settings-button.component.scss'],
})
export class SettingsButtonComponent {
  @Input() settings: Setting[] | null = null;
  @Output() saveSettings = new EventEmitter<Setting[]>();

  showSettings = false; // Controls the visibility of the settings dialog

  onSettingChange(setting: Setting) {
    console.log(`${setting.label} changed to:`, setting.selected);
  }
}
