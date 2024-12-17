import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {MessageService} from 'primeng/api';
import {FileSelectEvent, FileUpload, FileUploadModule} from 'primeng/fileupload';
import {MessagesModule} from 'primeng/messages';

@Component({
  selector: 'app-my-file-uploader',
  standalone: true,
  imports: [MessagesModule, FileUploadModule],
  templateUrl: './my-file-uploader.component.html',
  styleUrl: './my-file-uploader.component.scss',
  providers: [MessageService],
})
export class MyFileUploadComponent implements OnInit, OnDestroy {
  @Input() accept: string = '';
  @Input() label: string = 'Choose File';
  @Input() multiple: boolean = false;
  @Input() customUpload: boolean = false;

  @Output() fileSelect: EventEmitter<File | File[]> = new EventEmitter<
    File | File[]
    >();
  @Output() uploadComplete: EventEmitter<any> = new EventEmitter<any>();

  messages: any[] = [];
  inputId: string = '';

  private static nextId: number = 0;
  private uniqueId: string = `my-file-upload-${MyFileUploadComponent.nextId++}`;

  constructor(private messageService: MessageService) {}

  ngOnInit() {
    this.inputId = this.uniqueId;
  }

  onFileSelected(event: FileSelectEvent, fileUpload: FileUpload) {
    if (this.multiple) {
      this.fileSelect.emit(event.files);
    } else {
      this.fileSelect.emit(event.files[0]);
    }

    if (!this.customUpload) {
      this.messageService.add({
        severity: 'info',
        summary: 'File Selected',
        detail: `File uploaded.`,
      });
    }
    fileUpload.clear();
  }

  onUploadHandler(event: any) {
    this.uploadComplete.emit(event.originalEvent.body);
    this.messageService.add({
      severity: 'info',
      summary: 'File Uploaded',
      detail: '',
    });
  }

  onError(event: any) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'File upload failed.',
    });
  }

  ngOnDestroy() {
    MyFileUploadComponent.nextId--;
  }
}
