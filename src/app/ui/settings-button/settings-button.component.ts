import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
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
          (onClick)="onSaveSettings(settings); showSettings = false"
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
export class SettingsButtonComponent implements OnInit {
  settings: Setting[] = [
    {
      label: 'Replay Key',
      options: [
        { label: 'Ctrl', value: 'ctrl' },
        { label: 'Shift', value: 'shift' },
        { label: 'Alt', value: 'alt' },
      ],
      selected: { label: 'Ctrl', value: 'ctrl' },
    },
    {
      label: 'Auto Replay',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
      selected: { label: 'No', value: false },
    },
    {
      label: 'Time between replays',
      options: [
        { label: '0.5 seconds', value: 0.5 },
        { label: '1 second', value: 1 },
        { label: '2 seconds', value: 2 },
        { label: '3 seconds', value: 3 },
        { label: '4 seconds', value: 4 },
        { label: '5 seconds', value: 5 },
        { label: '10 seconds', value: 10 },
        { label: '20 seconds', value: 20 },
      ],
      selected: { label: '0.5 seconds', value: 0.5 },
    },
  ];
  showSettings = false; // Controls the visibility of the settings dialog

  ngOnInit(): void {
    const storedSettings = localStorage.getItem('userSettings');
    if (storedSettings) {
      this.settings = JSON.parse(storedSettings);
    }
  }

  onSettingChange(setting: Setting) {
    console.log(`${setting.label} changed to:`, setting.selected);
  }

  onSaveSettings(updatedSettings: Setting[]) {
    console.log('Saving settings:', updatedSettings);
    // this.userSettings = updatedSettings;
    localStorage.setItem('userSettings', JSON.stringify(this.settings));
  }
}
