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
import { SliderChangeEvent, SliderModule } from 'primeng/slider';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import WaveSurfer from 'wavesurfer.js';
import { Setting } from '../../../../shared/settings-button/settings-button.component';

@Component({
  selector: 'app-audio-player',
  template: `
    <div class="audio-player-container surface-card p-3 border-round shadow-2">
      <div #waveform class="waveform mb-3 border-round overflow-hidden bg-blue-50"></div>

      <div class="flex flex-column gap-3">
        <!-- Controls Row -->
        <div class="flex justify-content-center align-items-center gap-3">
            <p-button 
                icon="pi pi-replay" 
                (onClick)="skip(-5)" 
                [rounded]="true" 
                [text]="true" 
                severity="secondary" 
                pTooltip="-5s">
            </p-button>

            <p-button 
                [icon]="isPlaying ? 'pi pi-pause' : 'pi pi-play'" 
                (onClick)="togglePlay()" 
                [rounded]="true" 
                size="large"
                [disabled]="!audioUrl"
                styleClass="play-button w-4rem h-4rem text-2xl">
            </p-button>

            <p-button 
                icon="pi pi-forward" 
                (onClick)="skip(5)" 
                [rounded]="true" 
                [text]="true" 
                severity="secondary" 
                pTooltip="+5s">
            </p-button>
        </div>

        <!-- Progress Row -->
        <div class="flex align-items-center gap-3">
            <span class="text-sm font-medium text-600 w-3rem text-right">{{ formatTime(audioCurrentTime) }}</span>
            <div class="flex-grow-1">
                <p-slider 
                    [ngModel]="audioCurrentTime" 
                    [max]="audioDuration" 
                    [disabled]="!audioUrl" 
                    (onChange)="onSeek($event)"
                    styleClass="w-full">
                </p-slider>
            </div>
            <span class="text-sm font-medium text-600 w-3rem">{{ formatTime(audioDuration) }}</span>
        </div>

        <!-- Settings Row (Volume, Speed, Zoom) -->
        <div class="flex flex-wrap justify-content-between align-items-center gap-3 surface-ground p-2 border-round">
            <div class="flex align-items-center gap-2">
                <i class="pi pi-volume-up text-600"></i>
                <p-slider 
                    [(ngModel)]="volume" 
                    (onChange)="onVolumeChange($event)" 
                    [style]="{'width': '100px'}"
                    styleClass="volume-slider">
                </p-slider>
            </div>

            <div class="flex align-items-center gap-2">
                <span class="text-sm font-medium text-600">Speed:</span>
                <p-dropdown 
                    [options]="speedOptions" 
                    [(ngModel)]="playbackSpeed" 
                    (onChange)="setPlaybackSpeed()" 
                    [style]="{'minWidth': '80px'}"
                    size="small">
                </p-dropdown>
            </div>
            
             <div class="flex align-items-center gap-2">
                <span class="text-sm font-medium text-600">Zoom:</span>
                <p-slider 
                    [(ngModel)]="zoomLevel" 
                    [min]="1" 
                    [max]="1000" 
                    (onChange)="onZoomChange($event)"
                    [style]="{'width': '80px'}">
                </p-slider>
            </div>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    FormsModule,
    SliderModule,
    DropdownModule,
    ButtonModule,
    TooltipModule,
    CommonModule
  ],
  styles: [
    `
      .audio-player-container {
        width: 100%;
      }
      
      .waveform {
        height: 120px;
        width: 100%;
      }

      :host ::ng-deep .play-button {
        background: var(--primary-color);
        border: none;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        transition: transform 0.1s;
      }

      :host ::ng-deep .play-button:active {
        transform: scale(0.95);
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
  isPlaying = false;

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
  ) { }

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
      this.playAudio();
    });

    this.wavesurfer.on('play', () => {
      this.isPlaying = true;
    });

    this.wavesurfer.on('pause', () => {
      this.isPlaying = false;
    });

    this.wavesurfer.on('zoom', (level) => {
      this.zoomLevel = level;
    });

    this.wavesurfer.on('finish', () => {
      this.isPlaying = false;
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
      const autoReplay = this.userSettings.find(setting => setting.label === 'Auto Replay')?.selected.value;
      const replayDelaySetting = this.userSettings.find(setting => setting.label === 'Time between replays')?.selected.value;
      if (autoReplay) {
        delay(replayDelaySetting * 1000).then(() => {
          this.playAudio();
        });
      }
    });
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

  togglePlay() {
    if (this.isPlaying) {
      this.pauseAudio();
    } else {
      this.playAudio();
    }
  }

  skip(seconds: number) {
    this.wavesurfer.skip(seconds);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedTime = `${minutes}:${remainingSeconds < 10 ? '0' : ''
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
    if ((replayKey === 'ctrl' && event.ctrlKey) || (replayKey === 'shift' && event.shiftKey) || (replayKey === 'alt' && event.altKey)) {
      this.togglePlay();
    }
  }
}
