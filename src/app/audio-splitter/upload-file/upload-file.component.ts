import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../core/audio.service';
import { MessageService } from 'primeng/api';
import { MessagesModule } from 'primeng/messages';
import {MyFileUploadComponent} from '../../ui/my-file-uploader/my-file-uploader.component';

@Component({
  selector: 'app-upload-file',
  standalone: true,
  imports: [CommonModule, MessagesModule, MyFileUploadComponent],
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.scss'],
})
export class UploadFileComponent {
  audioFile: File | null = null;
  jsonFile: File | null = null;
  messages: any[] = [];

  constructor(
    private audioService: AudioService,
    private messageService: MessageService
  ) {}

  onAudioFileSelected(file: any) {
    this.audioFile = file//event.target.files[0];
    if (this.audioFile) {
      this.audioService.setAudioFile(this.audioFile);
      this.messageService.add({
        severity: 'success',
        summary: 'File Loaded',
        detail: 'Audio file loaded successfully.',
      });
    }
  }

  onJsonFileSelected(file: any) {
    this.jsonFile = file//event.target.files[0];
    if (this.jsonFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result as string);
          this.audioService.setJsonData(jsonData);
          this.messageService.add({
            severity: 'success',
            summary: 'JSON File Loaded',
            detail: 'JSON file loaded successfully. Proceed to split audio',
          });
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Invalid JSON file format.',
          });
        }
      };
      reader.readAsText(this.jsonFile);
    }
  }
}
