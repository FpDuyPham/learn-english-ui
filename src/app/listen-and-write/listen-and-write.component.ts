import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AudioService } from '../core/audio.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessagesModule } from 'primeng/messages';
import { MessageService } from 'primeng/api';
import {NewAudioService} from '../core/new-audio.service';

interface SegmentData {
  id?: number;
  text: string;
  audio: ArrayBuffer;
}

interface UserProgress {
  segmentIndex: number;
  userInput: string;
  isCorrect: boolean;
}

@Component({
  selector: 'app-listen-and-write',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    MessagesModule
  ],
  templateUrl: './listen-and-write.component.html',
  styleUrls: ['./listen-and-write.component.scss'],
  providers: [MessageService],
})
export class ListenAndWriteComponent implements OnInit, AfterViewInit {
  @ViewChild('audioPlayer') audioPlayer: ElementRef<HTMLAudioElement>;
  segments: SegmentData[] = [];
  userInput: string = '';
  isCorrect: boolean | null = null;
  currentSegmentIndex: number | null = null;
  audioContext: AudioContext;
  userProgress: UserProgress[] = [];
  showText: boolean = false;
  maskedText: string = '';

  constructor(
    private audioService: NewAudioService,
    private messageService: MessageService,
  ) {
    this.audioContext = new AudioContext();
  }

  async ngOnInit() {
    this.segments = await this.audioService.getSegments();
    this.loadProgress();
    if (this.currentSegmentIndex === null && this.segments.length > 0) {
      this.currentSegmentIndex = 0; // Start with the first segment
    }
    this.updateMaskedText();
  }

  ngAfterViewInit(): void {
    if (this.audioPlayer) {
      this.audioPlayer.nativeElement.addEventListener('keydown', (event) => {
        if (event.ctrlKey) {
          event.preventDefault();
          this.playCurrentAudioSegment();
        }
      });
    }
  }

  playCurrentAudioSegment() {
    if (this.currentSegmentIndex !== null) {
      this.playAudio(this.segments[this.currentSegmentIndex].audio);
    }
  }

  selectSegment(index: number) {
    this.currentSegmentIndex = index;
    this.isCorrect = null;
    this.userInput = '';
    this.updateMaskedText();
  }

  playAudio(audioBuffer: ArrayBuffer) {
    const audioSource = this.audioContext.createBufferSource();
    const buffer = this.audioContext.createBuffer(
      2, // Assuming stereo. Change if you have mono audio.
      audioBuffer.byteLength / 4, // 4 bytes per float32 sample
      this.audioContext.sampleRate,
    );

    const channelData = new Float32Array(audioBuffer);
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const nowBuffering = buffer.getChannelData(channel);
      const segmentSize = channelData.length / buffer.numberOfChannels;
      for (let i = 0; i < segmentSize; i++) {
        nowBuffering[i] = channelData[i * buffer.numberOfChannels + channel];
      }
    }

    audioSource.buffer = buffer;
    audioSource.connect(this.audioContext.destination);
    audioSource.start();
  }

  checkUserInput() {
    if (this.currentSegmentIndex !== null) {
      const correctText = this.segments[
        this.currentSegmentIndex
        ].text.trim().toLowerCase();
      const userInput = this.userInput.trim().toLowerCase();
      this.isCorrect = userInput === correctText;

      if (this.isCorrect) {
        this.messageService.add({
          severity: 'success',
          summary: 'Correct',
          detail: 'Well done!',
        });
        this.updateProgress(true);
        this.currentSegmentIndex++;
        this.userInput = '';
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Incorrect',
          detail: 'Try again.',
        });
      }
    }
  }

  nextSegment() {
    if (this.currentSegmentIndex !== null) {
      this.currentSegmentIndex++;
      this.userInput = '';
      this.isCorrect = null;
      this.updateMaskedText();
      if (this.currentSegmentIndex >= this.segments.length) {
        this.currentSegmentIndex = null; // Or handle end of segments
      }
    }
  }

  skipSegment() {
    if (this.currentSegmentIndex !== null) {
      this.updateProgress(false); // Mark as skipped (incorrect)
      this.nextSegment();
    }
  }

  updateProgress(isCorrect: boolean) {
    if (this.currentSegmentIndex !== null) {
      this.userProgress.push({
        segmentIndex: this.currentSegmentIndex,
        userInput: this.userInput,
        isCorrect: isCorrect,
      });
      this.saveProgress();
    }
  }

  saveProgress() {
    localStorage.setItem('userProgress', JSON.stringify(this.userProgress));
  }

  loadProgress() {
    const progressString = localStorage.getItem('userProgress');
    if (progressString) {
      this.userProgress = JSON.parse(progressString);
      // Find the last incomplete segment
      const lastProgress = this.userProgress[this.userProgress.length - 1];
      if (lastProgress && !lastProgress.isCorrect) {
        this.currentSegmentIndex = lastProgress.segmentIndex;
      } else if (lastProgress && lastProgress.isCorrect) {
        this.currentSegmentIndex = lastProgress.segmentIndex + 1;
      }
      if (this.currentSegmentIndex >= this.segments.length) {
        this.currentSegmentIndex = null; // All segments completed
      }
    }
  }

  toggleTextVisibility() {
    this.showText = !this.showText;
  }

  updateMaskedText() {
    if (this.currentSegmentIndex !== null) {
      this.maskedText = this.segments[this.currentSegmentIndex].text
        .split(' ')
        .map((word) => '*'.repeat(word.length))
        .join(' ');
    } else {
      this.maskedText = '';
    }
  }
}
