import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../core/audio.service';
import {MyButtonComponent} from '../ui/my-button/my-button.component';
import {UploadFileComponent} from './upload-file/upload-file.component';
import {ButtonModule} from 'primeng/button';

interface SegmentData {
  text: string;
  audio: string; // base64 encoded audio
}

@Component({
  selector: 'app-audio-splitter',
  standalone: true,
  imports: [CommonModule, MyButtonComponent, UploadFileComponent, ButtonModule ],
  templateUrl: './audio-splitter.component.html',
  styleUrls: ['./audio-splitter.component.scss'],
})
export class AudioSplitterComponent implements OnInit {
  audioBuffer: AudioBuffer | null = null;
  segments: { text: string; audio: AudioBuffer }[] = [];
  silenceThreshold = -45;
  minSilenceDuration = 0.5;

  constructor(protected audioService: AudioService) {}

  ngOnInit() {
    this.audioService.audioBuffer$.subscribe((buffer) => {
      this.audioBuffer = buffer;
    });

    this.audioService.jsonData$.subscribe((jsonData) => {
      if (jsonData) {
        this.processJsonData(jsonData);
      }
    });

    this.loadSegmentsFromLocalStorage();
  }

  processJsonData(jsonData: any[]) {
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
        end
      );

      return { text: item.text, audio: segmentBuffer };
    });

    this.saveSegmentsToLocalStorage();
  }

  createSegmentFromFile(
    buffer: AudioBuffer,
    start: number,
    end: number
  ): AudioBuffer {
    const sampleRate = buffer.sampleRate;
    const startSample = Math.floor(start * sampleRate);
    const endSample = Math.floor(end * sampleRate);
    const segmentLength = endSample - startSample;

    const segmentBuffer = new AudioContext().createBuffer(
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

  saveSegmentsToLocalStorage() {
    const segmentsData = this.segments.map((segment) => ({
      text: segment.text,
      audio: this.audioBufferToBase64(segment.audio),
    }));

    localStorage.setItem('audioSegments', JSON.stringify(segmentsData));
  }

  loadSegmentsFromLocalStorage() {
    const segmentsDataString = localStorage.getItem('audioSegments');
    if (segmentsDataString) {
      const segmentsData: SegmentData[] = JSON.parse(segmentsDataString);
      this.segments = segmentsData.map((item: SegmentData) => ({
        text: item.text,
        audio: this.base64ToAudioBuffer(item.audio),
      }));
    }
  }

  audioBufferToBase64(buffer: AudioBuffer): string {
    const float32Array = buffer.getChannelData(0);
    return btoa(String.fromCharCode(...new Uint8Array(float32Array.buffer)));
  }

  base64ToAudioBuffer(base64: string): AudioBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const audioContext = new AudioContext();
    const buffer = audioContext.createBuffer(
      1,
      bytes.length,
      audioContext.sampleRate
    );
    buffer.copyToChannel(new Float32Array(bytes.buffer), 0);

    return buffer;
  }
}
