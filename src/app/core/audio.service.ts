import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import audiobufferToWav from 'audiobuffer-to-wav';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audioContext: AudioContext | null = null;
  private audioBufferSubject: BehaviorSubject<AudioBuffer | null> =
    new BehaviorSubject<AudioBuffer | null>(null);
  private jsonDataSource = new BehaviorSubject<any>(null);
  public jsonData$ = this.jsonDataSource.asObservable();

  audioBuffer$: Observable<AudioBuffer | null> =
    this.audioBufferSubject.asObservable();

  constructor() {}

  initializeAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
  }

  setAudioFile(file: File) {
    this.initializeAudioContext();
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target) {
        this.audioContext?.decodeAudioData(
          e.target.result as ArrayBuffer,
          (buffer) => {
            this.audioBufferSubject.next(buffer);
          }
        );
      } else {
        console.error('Error reading file: e.target is null');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  setJsonData(data: any) {
    this.jsonDataSource.next(data);
  }

  getAudioBuffer(): AudioBuffer | null {
    return this.audioBufferSubject.value;
  }

  playSegment(segment: AudioBuffer) {
    this.initializeAudioContext();
    const source = this.audioContext?.createBufferSource();
    source.buffer = segment;
    source.connect(this.audioContext.destination);
    source.start();
  }

  downloadSegment(event: { segment: AudioBuffer; index: number }) {
    this.initializeAudioContext();
    const wav = audiobufferToWav(event.segment);
    const blob = new Blob([wav], { type: 'audio/wav' });
    saveAs(blob, `segment-${event.index + 1}.wav`);
  }
}
