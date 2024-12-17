import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../core/audio.service';
import {MyButtonComponent} from '../ui/my-button/my-button.component';
import {UploadFileComponent} from './upload-file/upload-file.component';
import {ButtonModule} from 'primeng/button';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {catchError, throwError} from 'rxjs';

interface SegmentData {
  text: string;
  audio: string; // base64 encoded audio
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
  imports: [CommonModule, MyButtonComponent, UploadFileComponent, ButtonModule],
  templateUrl: './audio-splitter.component.html',
  styleUrls: ['./audio-splitter.component.scss'],
  providers: [
  ]
})
export class AudioSplitterComponent implements OnInit {
  audioBuffer: AudioBuffer | null = null;
  segments: { text: string; audio: AudioBuffer }[] = [];
  silenceThreshold = -45;
  minSilenceDuration = 0.5;

  private audioContext: AudioContext;

  constructor(protected audioService: AudioService, private http: HttpClient) {
    this.audioContext = new AudioContext();
  }

  ngOnInit() {
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

    this.loadSegmentsFromLocalStorage();
  }

  processJsonData(jsonData: JsonDataItem[]) {
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

    this.saveSegmentsToLocalStorage();
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

  async saveSegmentsToLocalStorage() {
    const segmentsData: SegmentData[] = [];
    for (const segment of this.segments) {
      const audioBase64 = await this.audioBufferToWavBase64(segment.audio);
      segmentsData.push({ text: segment.text, audio: audioBase64 });
    }
    localStorage.setItem('audioSegments', JSON.stringify(segmentsData));
  }

  loadSegmentsFromLocalStorage() {
    const segmentsDataString = localStorage.getItem('audioSegments');
    if (segmentsDataString) {
      try {
        const segmentsData: SegmentData[] = JSON.parse(segmentsDataString);
        this.segments = segmentsData.map((item: SegmentData) => ({
          text: item.text,
          audio: this.base64ToAudioBuffer(item.audio),
        }));
      } catch (error) {
        console.error('Error parsing segments data from local storage:', error);
      }
    }
  }

  async audioBufferToWavBase64(audioBuffer: AudioBuffer): Promise<string> {
    const wav = this.audioBufferToWav(audioBuffer);
    const blob = new Blob([wav], { type: 'audio/wav' });

    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/wav;base64,")
        const base64 = base64data.split(',')[1];
        resolve(base64);
      };
    });
  }

  base64ToAudioBuffer(base64: string): AudioBuffer {
    const base64WithoutPrefix = base64.startsWith('data:audio/wav;base64,')
      ? base64.substring(22) // Remove the prefix
      : base64;

    const byteString = atob(base64WithoutPrefix);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }

    const dataView = new DataView(arrayBuffer);
    const sampleRate = dataView.getUint32(24, true); // Assuming little-endian, common in WAV
    const numChannels = dataView.getUint16(22, true); // Assuming little-endian

    // Assuming 16-bit PCM format for simplicity
    const audioDataStart = 44; // Common WAV header size
    const audioDataLength = arrayBuffer.byteLength - audioDataStart;

    const audioBuffer = this.audioContext.createBuffer(
      numChannels,
      audioDataLength / (2 * numChannels), // 2 bytes per sample for 16-bit PCM
      sampleRate,
    );

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      let sampleIndex = 0;
      for (let i = audioDataStart + channel * 2; i < arrayBuffer.byteLength; i += numChannels * 2) {
        // Convert 16-bit PCM to float
        const sample = dataView.getInt16(i, true); // Little-endian
        channelData[sampleIndex++] = sample / 32768.0; // Normalize to -1.0 to 1.0
      }
    }

    return audioBuffer;
  }

  audioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels * 2 + 44; // 44 is the size of a standard WAV header
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    this.writeUTFBytes(view, 0, 'RIFF');
    view.setUint32(4, length - 8, true); // file length - 8
    this.writeUTFBytes(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeUTFBytes(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // format chunk length
    view.setUint16(20, 1, true); // sample format (1 = PCM)
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(
      28,
      audioBuffer.sampleRate * numberOfChannels * 2,
      true,
    ); // byte rate
    view.setUint16(32, numberOfChannels * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample

    // data sub-chunk
    this.writeUTFBytes(view, 36, 'data');
    view.setUint32(40, audioBuffer.length * numberOfChannels * 2, true);

    // write the PCM samples
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }

    return buffer;
  }

  private writeUTFBytes(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
