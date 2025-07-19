import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ChangeDetectorRef, HostListener
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {SliderChangeEvent, SliderModule} from 'primeng/slider';
import { DropdownModule } from 'primeng/dropdown';
import { MyButtonComponent } from '../my-button/my-button.component';
import WaveSurfer from 'wavesurfer.js';
import {Setting} from '../settings-button/settings-button.component';

@Component({
  selector: 'app-audio-player',
  template: `
    <div class="audio-player">
      <div #waveform class="waveform"></div>

      <div class="audio-controls">
        <app-my-button
          icon="pi pi-play"
          styleClass="p-button-rounded p-button-text"
          (onClick)="playAudio()"
          [disabled]="!audioUrl"
        ></app-my-button>
        <app-my-button
          icon="pi pi-pause"
          styleClass="p-button-rounded p-button-text"
          (onClick)="pauseAudio()"
          [disabled]="!audioUrl"
        ></app-my-button>

        <p-slider
          [(ngModel)]="volume"
          [min]="0"
          [max]="100"
          [step]="1"
          (onChange)="onVolumeChange($event)"
          styleClass="volume-slider"
        ></p-slider>

        <p-dropdown
          [options]="speedOptions"
          [(ngModel)]="playbackSpeed"
          (onChange)="setPlaybackSpeed()"
          styleClass="speed-dropdown"
        ></p-dropdown>
      </div>

      <div class="progress-bar mb-16">
        <p-slider
          [ngModel]="audioCurrentTime"
          [max]="audioDuration"
          [disabled]="!audioUrl"
          (onChange)="onSeek($event)"
          styleClass="progress-slider"
        ></p-slider>
        <span class="time-label">{{ formatTime(audioCurrentTime) }}</span>
        <span class="time-label">/</span>
        <span class="time-label">{{ formatTime(audioDuration) }}</span>
      </div>
      <div class="zoom-controls">
        <p-slider
          [(ngModel)]="zoomLevel"
          [min]=""
          [max]="3000"
          [step]="200"
          (onChange)="onZoomChange($event)"
          styleClass="zoom-slider"
        ></p-slider>
        <div class="mt-16">Zoom Audio Wave</div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    FormsModule,
    SliderModule,
    DropdownModule,
    MyButtonComponent,
  ],
  styles: [
    `
      .audio-player {
        width: 400px; /* Adjust width as needed */
        padding: 15px;
        border: 1px solid #ccc;
        border-radius: 5px;
        background-color: #f8f8f8;
      }

      .audio-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }

      .progress-bar {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .volume-slider,
      .progress-slider,
      .zoom-slider {
        flex-grow: 1; /* Allow sliders to take available space */
      }

      .time-label {
        font-size: 0.8em;
        color: #555;
      }

      /* Customize PrimeNG components */
      .p-slider .p-slider-handle {
        background-color: #4caf50; /* Example: Change slider handle color */
      }

      .waveform {
        width: 100%;
        height: 100px; /* Adjust height as needed */
        margin-bottom: 10px;
      }
    `,
  ],
})
export class AudioPlayerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() audioUrl: string | null = null;
  @ViewChild('waveform') waveformRef: ElementRef;

  private wavesurfer: WaveSurfer | null = null;
  volume = 100; // Initial volume (0-100 scale)
  playbackSpeed = 1;
  audioCurrentTime = 0;
  audioDuration = 0;
  zoomLevel: number = 1;
  userSettings: Setting[] = [];

  speedOptions = [
    { label: '0.2x', value: 0.2 },
    { label: '0.3x', value: 0.3 },
    { label: '0.4x', value: 0.4 },
    { label: '0.5x', value: 0.5 },
    { label: '0.6x', value: 0.6 },
    { label: '0.7x', value: 0.7 },
    { label: '0.8x', value: 0.8 },
    { label: '1.0x', value: 1.0 }
  ];

  private audioBlob: Blob;

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    const storedSettings = localStorage.getItem('userSettings');
    if (storedSettings) {
      this.userSettings = JSON.parse(storedSettings);
    }

    this.wavesurfer = WaveSurfer.create({
      container: this.waveformRef.nativeElement,
      waveColor: '#D9DCFF',
      progressColor: '#4353FF',
      cursorColor: '#4353FF',
      barWidth: 3,
      barRadius: 3,
      cursorWidth: 1,
      height: 100,
      barGap: 3,
      dragToSeek: true,
    });

    this.wavesurfer.on('ready', () => {
      this.audioDuration = this.wavesurfer.getDuration();
      this.wavesurfer.setVolume(this.volume / 100);
      if (isNaN(this.audioDuration) || !isFinite(this.audioDuration)) {
        this.audioDuration = 0;
        console.warn('Invalid audio duration. Setting to 0.');
      }
    });

    this.wavesurfer.on('error', (error) => {
      console.error('Wavesurfer error:', error);
    });

    this.wavesurfer.on('audioprocess', () => {
      this.audioCurrentTime = this.wavesurfer.getCurrentTime();
    });

    this.wavesurfer.on('interaction', () => {
      this.wavesurfer.play();
    })

    this.wavesurfer.on('zoom', (level) => {
      this.zoomLevel = level;
    });

    this.wavesurfer.on('finish', () => {
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
      const autoReplay = this.userSettings.find(setting => setting.label === 'Auto Replay')?.selected.value;
      const replayDelaySetting = this.userSettings.find(setting => setting.label === 'Time between replays')?.selected.value;
      if (autoReplay) {
        delay(replayDelaySetting * 1000).then(() => {
          this.playAudio();
        });
      }
    });

    // this.wavesurfer.once('decode', () => {
    //   this.wavesurfer.zoom()
    // })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['audioUrl'] && this.audioUrl) {
      console.log('audioUrl changed:', this.audioUrl);
      if (this.wavesurfer) {
        this.wavesurfer.load(this.audioUrl);
      }
    }
  }

  onSeek(event: SliderChangeEvent) {
    const newTime = event.value as number;
    if (isFinite(newTime) && isFinite(this.audioDuration)) {
      const progress = newTime / this.audioDuration;
      this.wavesurfer.seekTo(progress);
    } else {
      console.warn('Cannot seek: Invalid time or duration.');
    }
  }

  onVolumeChange(event: SliderChangeEvent) {
    this.volume = event.value as number;
    this.wavesurfer.setVolume(this.volume / 100);
  }

  setPlaybackSpeed() {
    this.wavesurfer.setPlaybackRate(this.playbackSpeed);
  }

  playAudio() {
    this.wavesurfer.play();
  }

  pauseAudio() {
    this.wavesurfer.pause();
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedTime = `${minutes}:${
      remainingSeconds < 10 ? '0' : ''
    }${remainingSeconds}`;
    return formattedTime;
  }

  onZoomChange(event: SliderChangeEvent): void {
    this.zoomLevel = event.value as number;
    this.wavesurfer.zoom(this.zoomLevel);
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    if (this.wavesurfer) {
      this.wavesurfer.destroy();
    }
    if (this.audioBlob) {
      URL.revokeObjectURL(URL.createObjectURL(this.audioBlob));
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    const replayKey = this.userSettings.find(setting => setting.label === 'Replay Key')?.selected.value;
    if ((replayKey === 'ctrl' && event.ctrlKey) || (replayKey === 'shift' && event.shiftKey) || (replayKey === 'alt' && event.altKey)){
      this.playAudio();
    }
  }
}
