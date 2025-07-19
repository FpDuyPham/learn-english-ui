import {
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../core/audio.service';
import { MyButtonComponent } from '../ui/my-button/my-button.component';
import { ButtonModule } from 'primeng/button';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError, Subscription, Observable } from 'rxjs';
import { MessageService } from 'primeng/api';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { UploadFileComponent } from './upload-file/upload-file.component';
import { CardModule } from 'primeng/card';
import { ActivatedRoute } from '@angular/router';
import { Exercise, Sentence, AppDBSchema } from '../core/db-schema';
import { ExerciseService } from '../core/exercise.service';
import { AppDB, db } from '../core/database.service';

export interface SegmentData {
  id?: number;
  englishText: string;
  vietnameseText: string;
  audio: AudioBuffer;
  audioBlob: Blob;
}

interface JsonDataItem {
  englishText: string;
  vietnameseText: string;
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
    ButtonModule,
    FileUploadModule,
    ToastModule,
    UploadFileComponent,
    CardModule,
  ],
  templateUrl: './audio-splitter.component.html',
  styleUrls: ['./audio-splitter.component.scss'],
  providers: [MessageService],
})
export class AudioSplitterComponent implements OnInit, OnDestroy {
  @ViewChild('fileUpload') fileUpload: FileUpload;

  audioBuffer: AudioBuffer | null = null;
  segments: SegmentData[] = [];
  selectedFile: File | null = null;
  audioUrl: string | null = null;
  private audioContext: AudioContext;
  exerciseId: number;
  exercise$: Observable<Exercise | undefined>;
  exercise: Exercise;
  private db: AppDB;

  private audioSubscription: Subscription;
  private jsonSubscription: Subscription;

  constructor(
    public audioService: AudioService,
    private http: HttpClient,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private exerciseService: ExerciseService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.db = db;
    this.exerciseId = +this.route.snapshot.paramMap.get('id');
    this.exercise$ = this.exerciseService.getExercise(this.exerciseId);
    this.exercise$.subscribe(async (exercise) => {
      this.exercise = exercise;
      if (this.exercise) {
        await this.loadSegmentsFromIndexedDB();
      }
    });

    this.audioSubscription = this.audioService.audioFile$.subscribe(
      async (file) => {
        if (file) {
          await this.onAudioFileSelected(file);
        }
      }
    );

    this.jsonSubscription = this.audioService.jsonData$.subscribe((data) => {
      if (data) {
        this.processJsonData(data);
      }
    });
  }

  ngOnDestroy() {
    if (this.audioSubscription) {
      this.audioSubscription.unsubscribe();
    }
    if (this.jsonSubscription) {
      this.jsonSubscription.unsubscribe();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  async onAudioFileSelected(file: File) {
    this.selectedFile = file;
    this.audioUrl = URL.createObjectURL(file);
    await this.loadAudioFile(file);
  }

  async loadAudioFile(file: File) {
    try {
      this.audioContext = new AudioContext();

      const arrayBuffer = await file.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.messageService.add({
        severity: 'success',
        summary: 'File Loaded',
        detail: 'Audio file loaded successfully.',
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load audio file.',
      });
      console.error('Error loading audio file:', error);
    }
  }

  async processJsonData(jsonData: JsonDataItem[]) {
    if (!this.audioBuffer) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Audio file not loaded.',
      });
      console.error('Audio file not loaded.');
      return;
    }

    this.segments = [];

    for (const item of jsonData) {
      const start = item.audio.start;
      const end = item.audio.end;

      if (end > this.audioBuffer.duration) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `End time ${end} is beyond audio duration ${this.audioBuffer.duration}.`,
        });
        console.error(
          `End time ${end} is beyond audio duration ${this.audioBuffer.duration}.`,
        );
        continue;
      }

      const segmentBuffer = this.createSegmentFromFile(
        this.audioBuffer,
        start,
        end
      );

      const audioBlob = new Blob([this.createWavFile(segmentBuffer)], {
        type: 'audio/wav',
      });

      this.segments.push({
        englishText: item.englishText,
        vietnameseText: item.vietnameseText,
        audio: segmentBuffer,
        audioBlob: audioBlob,
      });
    }

    // Save segments to IndexedDB and show success message
    try {
      await this.saveSegmentsToIndexedDB();
      this.messageService.add({
        severity: 'success',
        summary: 'JSON Processed',
        detail: 'JSON data processed, segments created and saved to IndexedDB.',
      });
    } catch (error) {
      console.error('Error saving segments to IndexedDB:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save segments to IndexedDB.',
      });
    }
  }

  createSegmentFromFile(
    buffer: AudioBuffer,
    start: number,
    end: number
  ): AudioBuffer {
    const sampleRate = buffer.sampleRate;
    const startSample = Math.floor(start * sampleRate);
    const endSample = Math.floor(end * sampleRate);
    const segmentLength = Math.max(0, endSample - startSample);

    const segmentBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      segmentLength,
      sampleRate
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

  async saveSegmentsToIndexedDB() {
    if (!this.db) {
      console.error('IndexedDB not initialized.');
      return;
    }

    try {
      console.log('track: save to:', this.exerciseId)

      // Use Dexie's transaction for atomic operations
      await this.db.transaction('rw', this.db.sentences, async () => {
        // Clear existing sentences for this exercise
        const existingSentences = await this.db.sentences
          .where('exerciseId')
          .equals(this.exerciseId)
          .toArray();
        const existingSentenceIds = existingSentences.map(s => s.id!);
        await this.db.sentences.bulkDelete(existingSentenceIds);

        // Prepare new segments to be added
        const newSegments = this.segments.map(segment => ({
          exerciseId: this.exerciseId,
          englishText: segment.englishText,
          vietnameseText: segment.vietnameseText,
          audioBlob: segment.audioBlob,
        }));

        // Add new segments in bulk
        await this.db.sentences.bulkAdd(newSegments);
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Segments Saved',
        detail: 'Segments saved to IndexedDB.',
      });
    } catch (error) {
      console.error('Error saving segments to IndexedDB:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save segments to IndexedDB.',
      });
    }
  }

  async loadSegmentsFromIndexedDB() {
    if (!this.exercise) {
      console.error('Exercise not available.');
      return;
    }

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    try {
      // Fetch sentences for the current exercise from IndexedDB
      const segmentsData: Sentence[] = await this.db.sentences
        .where('exerciseId')
        .equals(this.exerciseId)
        .toArray();

      this.segments = await Promise.all(
        segmentsData.map(async (item: Sentence) => {
          try {
            const arrayBuffer = await item.audioBlob.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            return {
              englishText: item.englishText,
              vietnameseText: item.vietnameseText,
              audio: audioBuffer,
              audioBlob: item.audioBlob,
            };
          } catch (error: any) {
            console.error('Error processing segment:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to process segment: ${error.message || error}`,
            });
            return null; // or handle the error as appropriate for your application
          }
        })
      );

      // Filter out any null segments that failed to decode or process
      this.segments = this.segments.filter((segment) => segment !== null);

      if (this.segments.length > 0) {
        this.messageService.add({
          severity: 'info',
          summary: 'Segments Loaded',
          detail: 'Segments loaded from IndexedDB.',
        });
      }
    } catch (error) {
      console.error('Error loading segments from IndexedDB:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load segments from IndexedDB.',
      });
    }
  }

  async saveSegmentsToExercise() {
    if (!this.exercise || !this.exercise.id) {
      console.error('Exercise not loaded or invalid exercise ID.');
      return;
    }

    // Map the segments to sentences, including only necessary properties
    const newSentences = this.segments.map((segment) => ({
      exerciseId: this.exercise.id, // Ensure exerciseId is set
      englishText: segment.englishText,
      vietnameseText: segment.vietnameseText,
      audio: segment.audioBlob,
    }));

    // Update the exercise in the database
    this.exerciseService
      .updateExercise({
        ...this.exercise,
        sentences: newSentences,
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Exercise Updated',
            detail: 'Exercise sentences saved successfully.',
          });
        },
        error: (error) => {
          console.error('Error updating exercise:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update exercise.',
          });
        },
      });
  }

  clearFile() {
    if (this.fileUpload) {
      this.fileUpload.clear();
    }
    this.selectedFile = null;
    this.audioUrl = null;
    this.audioBuffer = null;
    this.segments = [];
    this.messageService.add({
      severity: 'info',
      summary: 'File Cleared',
      detail: 'Audio file and segments cleared.',
    });
  }

  async playSegment(segment: SegmentData) {
    if (!segment || !segment.audio) {
      console.error('Cannot play segment: audio is undefined');
      return;
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = segment.audio;
    source.connect(this.audioContext.destination);
    source.start();
  }

  downloadSegment(segment: SegmentData, index: number) {
    const url = URL.createObjectURL(segment.audioBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `segment_${index + 1}.wav`;
    link.click();

    URL.revokeObjectURL(url);
  }

  audioBufferToArrayBuffer(audioBuffer: AudioBuffer): ArrayBuffer {
    const numChannels = audioBuffer.numberOfChannels;
    const numSamples = audioBuffer.length;
    const bufferLength = numChannels * numSamples * 2; // 2 bytes per sample (16-bit)
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    let offset = 0;
    for (let i = 0; i < numSamples; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(
          -1,
          Math.min(1, audioBuffer.getChannelData(channel)[i])
        );
        view.setInt16(
          offset,
          sample < 0 ? sample * 0x8000 : sample * 0x7FFF,
          true
        ); // Little-endian
        offset += 2;
      }
    }

    return arrayBuffer;
  }

  createWavFile(audioBuffer: AudioBuffer): Uint8Array {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const bitsPerSample = 16; // Assuming 16-bit audio
    const numSamples = audioBuffer.length;
    const bufferLength = numChannels * numSamples * (bitsPerSample / 8);
    const headerLength = 44;
    const fileLength = headerLength + bufferLength;

    const wav = new Uint8Array(fileLength);
    const view = new DataView(wav.buffer);

    // RIFF chunk descriptor
    view.setUint32(0, 0x52494646, false); // 'RIFF'
    view.setUint32(4, fileLength - 8, true); // File size - 8 bytes for RIFF and size
    view.setUint32(8, 0x57415645, false); // 'WAVE'

    // fmt sub-chunk
    view.setUint32(12, 0x666d7420, false); // 'fmt '
    view.setUint32(16, 16, true); // Sub-chunk size (16 for PCM)
    view.setUint16(20, 1, true); // Audio format (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // Byte rate
    view.setUint16(32, numChannels * (bitsPerSample / 8), true); // Block align
    view.setUint16(34, bitsPerSample, true); // Bits per sample

    // data sub-chunk
    view.setUint32(36, 0x64617461, false); // 'data'
    view.setUint32(40, bufferLength, true); // Data size

    // Write the audio data
    let offset = headerLength;
    for (let i = 0; i < numSamples; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(
          -1,
          Math.min(1, audioBuffer.getChannelData(channel)[i])
        );
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true); // Little-endian
        offset += 2;
      }
    }

    return wav;
  }
}
