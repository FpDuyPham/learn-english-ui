import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../core/audio.service';
import { MyButtonComponent } from '../ui/my-button/my-button.component';
import { UploadFileComponent } from './upload-file/upload-file.component';
import { ButtonModule } from 'primeng/button';
import {
  HttpClient,
  provideHttpClient,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { openDB, IDBPDatabase } from 'idb';

interface SegmentData {
  id?: number; // Optional ID for IndexedDB
  text: string;
  audio: ArrayBuffer; // Store audio data as ArrayBuffer
}

interface JsonDataItem {
  text: string;
  audio: {
    start: number;
    end: number;
  };
}

@Component({
  selector: 'app-audio-splitter',
  standalone: true,
  imports: [
    CommonModule,
    MyButtonComponent,
    UploadFileComponent,
    ButtonModule,
  ],
  templateUrl: './audio-splitter.component.html',
  styleUrls: ['./audio-splitter.component.scss'],
  providers: [MessageService],
})
export class AudioSplitterComponent implements OnInit {
  audioBuffer: AudioBuffer | null = null;
  segments: { text: string; audio: AudioBuffer }[] = [];
  silenceThreshold = -45;
  minSilenceDuration = 0.5;

  private audioContext: AudioContext;
  private db: IDBPDatabase;

  constructor(protected audioService: AudioService, private http: HttpClient) {
    this.audioContext = new AudioContext();
  }

  async ngOnInit() {
    await this.initIndexedDB();

    this.audioService.audioBuffer$
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error loading audio file:', error);
          return throwError(() => error);
        }),
      )
      .subscribe((buffer) => {
        this.audioBuffer = buffer;
      });

    this.audioService.jsonData$
      .pipe(
        catchError((error: any) => {
          console.error('Error loading JSON data:', error);
          return throwError(() => error);
        }),
      )
      .subscribe((jsonData) => {
        if (jsonData) {
          this.processJsonData(jsonData);
        }
      });

    await this.loadSegmentsFromIndexedDB();
  }

  async processJsonData(jsonData: JsonDataItem[]) {
    if (!this.audioBuffer) {
      console.error('Audio file not loaded.');
      return;
    }

    this.segments = jsonData.map((item) => {
      const start = item.audio.start;
      const end = item.audio.end;
      const segmentBuffer = this.createSegmentFromFile(
        this.audioBuffer,
        start,
        end,
      );

      return { text: item.text, audio: segmentBuffer };
    });

    await this.saveSegmentsToIndexedDB();
  }

  createSegmentFromFile(
    buffer: AudioBuffer,
    start: number,
    end: number,
  ): AudioBuffer {
    const sampleRate = buffer.sampleRate;
    const startSample = Math.floor(start * sampleRate);
    const endSample = Math.floor(end * sampleRate);
    const segmentLength = endSample - startSample;

    const segmentBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      segmentLength,
      sampleRate,
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      const segmentChannelData = segmentBuffer.getChannelData(channel);

      for (let i = 0; i < segmentLength; i++) {
        segmentChannelData[i] = channelData[startSample + i];
      }
    }

    return segmentBuffer;
  }

  async initIndexedDB() {
    this.db = await openDB('audio-splitter-db', 1, {
      upgrade(db) {
        db.createObjectStore('segments', {
          keyPath: 'id',
          autoIncrement: true,
        });
      },
    });
  }

  async saveSegmentsToIndexedDB() {
    if (!this.db) {
      await this.initIndexedDB();
    }

    const tx = this.db.transaction('segments', 'readwrite');
    const store = tx.objectStore('segments');
    await store.clear();

    for (const segment of this.segments) {
      // Convert AudioBuffer to ArrayBuffer for storage
      const audioData = this.audioBufferToArrayBuffer(segment.audio);
      await store.add({ text: segment.text, audio: audioData });
    }

    await tx.done;
  }

  async loadSegmentsFromIndexedDB() {
    if (!this.db) {
      await this.initIndexedDB();
    }

    const tx = this.db.transaction('segments', 'readonly');
    const store = tx.objectStore('segments');
    const segmentsData: SegmentData[] = await store.getAll();

    this.segments = segmentsData.map((item: SegmentData) => ({
      text: item.text,
      audio: this.arrayBufferToAudioBuffer(item.audio),
    }));
  }

  audioBufferToArrayBuffer(audioBuffer: AudioBuffer): ArrayBuffer {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels * 2; // 16-bit PCM
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);

    let offset = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true); // Little-endian
        offset += 2;
      }
    }

    return arrayBuffer;
  }

  arrayBufferToAudioBuffer(arrayBuffer: ArrayBuffer): AudioBuffer {
    const dataView = new DataView(arrayBuffer);
    const audioDataLength = arrayBuffer.byteLength;

    // Assume 16-bit PCM, stereo for simplicity
    const numChannels = 2; // Modify if you have a different number of channels
    const audioBuffer = this.audioContext.createBuffer(
      numChannels,
      audioDataLength / (2 * numChannels),
      this.audioContext.sampleRate
    );

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      let sampleIndex = 0;
      for (let i = channel * 2; i < arrayBuffer.byteLength; i += numChannels * 2) {
        const sample = dataView.getInt16(i, true); // Little-endian
        channelData[sampleIndex++] = sample / 32768.0; // Normalize to -1.0 to 1.0
      }
    }

    return audioBuffer;
  }
}
