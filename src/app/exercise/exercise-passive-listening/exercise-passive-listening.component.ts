import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import { ExerciseService } from '../../core/exercise.service';
import {Exercise, Sentence} from '../../core/db-schema';
import {forkJoin, from, Observable, Subscription, switchMap} from 'rxjs';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {SentenceService} from '../../core/setence.service';
import {DomSanitizer} from '@angular/platform-browser';
import {MyInputNumberComponent} from '../../ui/my-input-number/my-input-number.component';
import {CheckboxModule} from 'primeng/checkbox';
import {TooltipModule} from 'primeng/tooltip';
import {InputNumberModule} from 'primeng/inputnumber';

@Component({
  standalone: true,
  selector: 'app-exercise-passive-listening',
  templateUrl: './exercise-passive-listening.component.html',
  styleUrls: ['./exercise-passive-listening.component.scss'],
  imports: [ReactiveFormsModule, CommonModule, RouterModule, ButtonModule, TableModule, FormsModule, MyInputNumberComponent, CheckboxModule, TooltipModule, InputNumberModule]
})
export class ExercisePassiveListeningComponent implements OnInit, OnDestroy {
  exerciseId: number;
  exercise: Exercise;
  sentences: Sentence[] = [];
  selectAll: boolean = false;
  globalRepetitions: number = 10; // Default value
  globalPauseDuration: number = 5; // Default value

  private routeSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private exerciseService: ExerciseService,
    private sentenceService: SentenceService
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.params
      .pipe(
        switchMap((params) => {
          this.exerciseId = +params['id'];
          return from(this.exerciseService.getExercise(this.exerciseId));
        }),
        switchMap((exercise: Exercise) => {
          this.exercise = exercise;
          const sentenceObservables = exercise.sentences.map((sentence) =>
            this.sentenceService.getSentence(sentence.id)
          );
          return forkJoin(sentenceObservables);
        })
      )
      .subscribe((sentences: Sentence[]) => {
        this.sentences = sentences.filter((s: Sentence) => s !== undefined)
          .map(sentence => ({
            ...sentence,
            selected: false,        // Initialize selected property
            repetitionCount: 10,             // Default repeat value: 10
            silentPauseDuration: 3               // Default pause value: 10
          }));
      });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  toggleSelectAll() {
    this.sentences.forEach(sentence => sentence.selected = this.selectAll);
  }

  isAnySentenceSelected(): boolean {
    return this.sentences.some(sentence => sentence.selected);
  }

  applyGlobalRepetitions() {
    this.sentences
      // .filter(sentence => sentence.selected)
      .forEach(sentence => sentence.repetitionCount = this.globalRepetitions);
  }

  applyGlobalPause() {
    this.sentences
      // .filter(sentence => sentence.selected)
      .forEach(sentence => sentence.silentPauseDuration = this.globalPauseDuration);
  }

  async audioBufferToWavBlob(audioBuffer: AudioBuffer): Promise<Blob> {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels * 2 + 44; // 44 is the WAV header size
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    this.writeUTFBytes(view, 0, 'RIFF');
    view.setUint32(4, length - 8, true); // File size minus RIFF identifier and size fields
    this.writeUTFBytes(view, 8, 'WAVE');

    // FMT sub-chunk
    this.writeUTFBytes(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Sub-chunk size (16 for PCM)
    view.setUint16(20, 1, true); // Audio format (1 for PCM)
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * 2 * numberOfChannels, true); // Byte rate
    view.setUint16(32, numberOfChannels * 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample

    // Data sub-chunk
    this.writeUTFBytes(view, 36, 'data');
    view.setUint32(40, audioBuffer.length * numberOfChannels * 2, true); // Data size

    // Write PCM data
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i];
        const pcmValue = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, pcmValue, true);
        offset += 2;
      }
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  writeUTFBytes(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  async generatePassiveListeningAudio() {
    const selectedSentences = this.sentences.filter(sentence => sentence.selected);

    if (selectedSentences.length === 0) {
      console.warn('No sentences selected.');
      return;
    }

    try {
      const audioContext = new AudioContext();
      const sampleRate = audioContext.sampleRate;
      let totalDuration = 0; // Keep track of the total duration

      // 1. Decode Audio and Create Silence
      const decodedAudioBuffers: AudioBuffer[] = [];
      for (const sentence of selectedSentences) {
        console.log('Processing sentence:', sentence.englishText, 'Repetitions:', sentence.repetitionCount);
        const audioBlob = sentence.audioBlob;

        // Decode the audio data
        const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());

        for (let i = 0; i < sentence.repetitionCount; i++) {
          decodedAudioBuffers.push(audioBuffer);
          totalDuration += audioBuffer.duration;

          if (sentence.silentPauseDuration > 0) {
            // Create a silent audio buffer
            const silenceBuffer = audioContext.createBuffer(
              1, // 1 channel for silence
              sentence.silentPauseDuration * sampleRate,
              sampleRate
            );
            // No need to fill with zeros, it's silent by default
            decodedAudioBuffers.push(silenceBuffer);
            totalDuration += sentence.silentPauseDuration;
          }
        }
      }

      // 2. Concatenate using OfflineAudioContext
      const offlineContext = new OfflineAudioContext(1, totalDuration * sampleRate, sampleRate);
      let currentTime = 0;
      for (const buffer of decodedAudioBuffers) {
        const source = offlineContext.createBufferSource();
        source.buffer = buffer;
        source.connect(offlineContext.destination);
        source.start(currentTime);
        currentTime += buffer.duration;
      }

      // Render the combined audio
      const renderedBuffer = await offlineContext.startRendering();

      // 3. Convert to Blob
      const audioWavBlob = await this.audioBufferToWavBlob(renderedBuffer);

      console.log('Combined audio blob size:', audioWavBlob.size, 'Type:', audioWavBlob.type);
      this.downloadBlob(audioWavBlob, `passive-listening-exercise-${this.exerciseId}.wav`);

    } catch (error) {
      console.error('Error generating passive listening audio:', error);
    }
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
