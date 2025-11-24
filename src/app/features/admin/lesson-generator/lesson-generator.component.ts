import { Component, OnInit, OnDestroy, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/plugins/regions';
import type { Region } from 'wavesurfer.js/plugins/regions';
import { VoskService } from '../../../core/vosk.service';
import { alignSegments, extractVoskWords, Segment } from '../../../core/alignment.util';
import { MenuItem } from 'primeng/api';
import { StepsModule } from 'primeng/steps';
import { CardModule } from 'primeng/card';
import { FileUpload, FileSelectEvent } from 'primeng/fileupload';
import { InputTextarea } from 'primeng/inputtextarea';
import { ButtonDirective } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { ToolbarModule } from 'primeng/toolbar';
import { TableModule } from 'primeng/table';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';
import { Tooltip } from 'primeng/tooltip';

interface ProcessingState {
    isProcessing: boolean;
    currentStep: string;
    progress: number;
}

@Component({
    selector: 'app-lesson-generator',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        StepsModule,
        CardModule,
        FileUpload,
        InputTextarea,
        ButtonDirective,
        PanelModule,
        ToolbarModule,
        TableModule,
        InputNumber,
        InputText,
        FloatLabel,
        Tooltip
    ],
    templateUrl: './lesson-generator.component.html',
    styleUrls: ['./lesson-generator.component.scss']
})
export class LessonGeneratorComponent implements OnInit, OnDestroy {
    items: MenuItem[] = [];
    activeIndex: number = 0;

    audioFile: File | null = null;
    script = '';
    segments = signal<Segment[]>([]);
    activeSegmentId: string | null = null;
    alignmentWarnings: string[] = []; // Track words that couldn't be aligned

    processingState: ProcessingState = {
        isProcessing: false,
        currentStep: '',
        progress: 0
    };

    wavesurfer: WaveSurfer | null = null;
    private regionsPlugin: RegionsPlugin | null = null;
    private audioContext: AudioContext | null = null;

    constructor(private voskService: VoskService) { }

    ngOnInit(): void {
        this.items = [
            {
                label: 'Upload & Configure',
                command: (event: any) => this.activeIndex = 0
            },
            {
                label: 'Waveform & Visualization',
                command: (event: any) => this.activeIndex = 1
            },
            {
                label: 'Edit Segments',
                command: (event: any) => this.activeIndex = 2
            }
        ];
    }

    ngOnDestroy(): void {
        this.cleanup();
    }

    private initializeWavesurfer(): void {
        const container = document.querySelector('#waveform');
        if (!container) {
            console.warn('Waveform container not found');
            return;
        }

        // Destroy existing instance if any
        if (this.wavesurfer) {
            this.wavesurfer.destroy();
        }

        this.regionsPlugin = RegionsPlugin.create();

        this.wavesurfer = WaveSurfer.create({
            container: container as HTMLElement,
            waveColor: '#4F46E5',
            progressColor: '#818CF8',
            cursorColor: '#312E81',
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 128,
            normalize: true,
            plugins: [this.regionsPlugin]
        });
        this.regionsPlugin.on('region-clicked', (region: Region, e: MouseEvent) => {
            e.stopPropagation();
            this.playRegion(region);
        });

        this.regionsPlugin.on('region-updated', (region: Region) => {
            this.onRegionUpdated(region);
        });

        this.wavesurfer.on('audioprocess', () => {
            const currentTime = this.wavesurfer?.getCurrentTime() || 0;
            this.updateActiveSegment(currentTime);
        });

        this.wavesurfer.on('ready', () => {
            console.log('Wavesurfer ready event fired');
            console.log('Duration:', this.wavesurfer?.getDuration());

            // Re-create regions now that audio is loaded and duration is known
            const currentSegments = this.segments();
            if (currentSegments.length > 0) {
                console.log('Creating regions from segments on ready event');
                this.createRegionsFromSegments(currentSegments);
            }
        });

        // Load audio if available
        if (this.audioFile) {
            console.log('Loading audio blob into wavesurfer...');
            this.wavesurfer.loadBlob(this.audioFile);
        }
    }

    onAudioSelect(event: FileSelectEvent): void {
        if (event.files && event.files.length > 0) {
            this.audioFile = event.files[0];
            console.log('Audio file selected:', this.audioFile.name);
            // Don't load immediately, wait for generation or next step
        }
    }

    onUploadHandler(event: any) {
        // Handle custom upload if needed, but we just want to select the file
        // This might be called if mode="advanced" and user clicks upload
        // For this use case, we might just want to use the selected file
    }

    generateSegments(): void {
        console.log('=== generateSegments() CALLED ===');
        console.log('audioFile:', this.audioFile);
        console.log('script:', this.script);

        if (!this.audioFile || !this.script.trim()) {
            alert('Please provide both an audio file and a script.');
            return;
        }

        console.log('Starting segment generation...', { audioFile: this.audioFile.name, scriptLength: this.script.length });

        this.processingState = {
            isProcessing: true,
            currentStep: 'Loading Vosk model...',
            progress: 10
        };

        this.voskService.loadModel()
            .then(() => {
                this.processingState.currentStep = 'Converting audio...';
                this.processingState.progress = 30;
                return this.convertAudioToBuffer(this.audioFile!);
            })
            .then((audioBuffer) => {
                console.log('Audio converted. Duration:', audioBuffer.duration);
                this.processingState.currentStep = 'Transcribing audio...';
                this.processingState.progress = 50;
                return this.transcribeAudio(audioBuffer);
            })
            .then((voskResult) => {
                this.processingState.currentStep = 'Aligning segments...';
                this.processingState.progress = 70;

                const voskWords = extractVoskWords(voskResult);

                // Clear previous warnings
                this.alignmentWarnings = [];

                // Capture console.warn calls to collect alignment warnings
                const originalWarn = console.warn;
                console.warn = (...args: any[]) => {
                    if (args[0] === 'Could not find match for word:' || args[0] === 'Could not find match for first word:') {
                        this.alignmentWarnings.push(args[1] || args[0]);
                    }
                    originalWarn.apply(console, args);
                };

                const alignedSegments = alignSegments(this.script, voskWords);

                // Restore original console.warn
                console.warn = originalWarn;

                console.log('Aligned segments:', alignedSegments);
                console.log('Alignment warnings:', this.alignmentWarnings.length, 'unmatched words');

                this.segments.set(alignedSegments);

                this.processingState.currentStep = 'Creating regions...';
                this.processingState.progress = 90;

                // Move to next step to show waveform
                console.log('Moving to step 2 (Waveform)... Current activeIndex:', this.activeIndex);
                this.activeIndex = 1;
                console.log('activeIndex set to:', this.activeIndex);

                // Give time for DOM to update before initializing wavesurfer
                setTimeout(() => {
                    console.log('Initializing wavesurfer...');
                    this.initializeWavesurfer();
                    this.createRegionsFromSegments(alignedSegments);

                    this.processingState.currentStep = 'Complete!';
                    this.processingState.progress = 100;

                    setTimeout(() => {
                        this.processingState.isProcessing = false;
                        console.log('Generation complete!');
                    }, 1000);
                }, 100);
            })
            .catch((error) => {
                console.error('Error generating segments:', error);
                alert('An error occurred during processing. Check console for details.');
                this.processingState.isProcessing = false;
            });
    }

    generateSegmentsV2() {
        console.log('=== generateSegments() CALLED ===');
        console.log('audioFile:', this.audioFile);
        console.log('script:', this.script);
    }

    private async convertAudioToBuffer(file: File): Promise<AudioBuffer> {
        const arrayBuffer = await file.arrayBuffer();

        if (!this.audioContext) {
            this.audioContext = new AudioContext({ sampleRate: 48000 });
        }

        return await this.audioContext.decodeAudioData(arrayBuffer);
    }

    private async transcribeAudio(audioBuffer: AudioBuffer): Promise<any> {
        console.warn('Using mock Vosk data - generating realistic timings from script');

        // Generate mock word timings based on the script
        const words = this.script.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .split(/\s+/)
            .filter(w => w.length > 0);

        const audioDuration = audioBuffer.duration;
        const mockWords = [];
        let currentTime = 0.5; // Start at 0.5 seconds

        for (const word of words) {
            // Vary word duration based on word length - longer words take more time
            const wordLength = word.length;
            const baseDuration = Math.max(0.5, wordLength * 0.08); // 0.5s minimum, ~0.08s per character
            const wordDuration = baseDuration + (Math.random() * 0.3 - 0.15); // Add variation ±0.15s
            const gapDuration = 0.15 + (Math.random() * 0.1); // 0.15-0.25s gap between words

            mockWords.push({
                word: word,
                start: parseFloat(currentTime.toFixed(2)),
                end: parseFloat((currentTime + wordDuration).toFixed(2)),
                conf: 0.85 + Math.random() * 0.15 // 0.85-1.0 confidence
            });

            currentTime += wordDuration + gapDuration;

            // Stop if we exceed audio duration
            if (currentTime > audioDuration - 0.5) {
                console.warn(`Stopping word generation at ${currentTime.toFixed(2)}s (audio duration: ${audioDuration.toFixed(2)}s)`);
                break;
            }
        }

        console.log(`Generated ${mockWords.length} mock words from ${words.length} script words`);
        console.log(`Total estimated duration: ${currentTime.toFixed(2)}s of ${audioDuration.toFixed(2)}s`);

        return {
            result: mockWords
        };
    }

    private createRegionsFromSegments(segments: Segment[]): void {
        console.log('createRegionsFromSegments called with', segments.length, 'segments');
        if (!this.regionsPlugin) {
            console.warn('Regions plugin not initialized');
            return;
        }

        const duration = this.wavesurfer?.getDuration() || 0;
        console.log('Current wavesurfer duration:', duration);

        this.regionsPlugin.clearRegions();

        segments.forEach((segment, index) => {
            const color = this.getRegionColor(index);

            // Ensure we don't add regions if duration is 0 (audio not loaded)
            // They will be added when 'ready' event fires
            if (duration > 0) {
                console.log(`Adding region ${segment.id}: ${segment.start}-${segment.end}`);
                this.regionsPlugin!.addRegion({
                    id: segment.id,
                    start: segment.start,
                    end: segment.end,
                    color: color,
                    drag: true,
                    resize: true
                });
            } else {
                console.warn(`Skipping region creation for ${segment.id} because duration is 0`);
            }
        });
    }

    private getRegionColor(index: number): string {
        const colors = [
            'rgba(79, 70, 229, 0.2)',
            'rgba(16, 185, 129, 0.2)',
            'rgba(245, 158, 11, 0.2)',
            'rgba(239, 68, 68, 0.2)',
            'rgba(168, 85, 247, 0.2)',
            'rgba(59, 130, 246, 0.2)',
        ];
        return colors[index % colors.length];
    }

    private playRegion(region: Region): void {
        console.log('=== playRegion called ===');
        console.log('Region:', region);
        console.log('Wavesurfer exists:', !!this.wavesurfer);

        if (!this.wavesurfer) {
            console.error('Wavesurfer not initialized!');
            return;
        }

        console.log('Wavesurfer duration:', this.wavesurfer.getDuration());
        console.log('Wavesurfer current time:', this.wavesurfer.getCurrentTime());
        console.log('Wavesurfer is playing:', this.wavesurfer.isPlaying());

        this.activeSegmentId = region.id;

        // Stop any current playback first
        if (this.wavesurfer.isPlaying()) {
            console.log('Stopping current playback...');
            this.wavesurfer.pause();
        }

        // Set time and play
        console.log('Setting time to:', region.start);
        this.wavesurfer.setTime(region.start);

        console.log('Starting playback...');
        const playPromise = this.wavesurfer.play();
        console.log('Play promise:', playPromise);

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('✓ Playback started successfully');
                    const duration = (region.end - region.start) * 1000;
                    console.log('Will stop after:', duration, 'ms');

                    setTimeout(() => {
                        console.log('Timeout reached, stopping playback');
                        if (this.wavesurfer && this.wavesurfer.isPlaying()) {
                            this.wavesurfer.pause();
                            console.log('✓ Playback stopped');
                        }
                    }, duration);
                })
                .catch(error => {
                    console.error('✗ Playback error:', error);
                    // Play was prevented or interrupted - silently ignore AbortError
                    if (error.name !== 'AbortError') {
                        console.error('Non-abort playback error:', error);
                    }
                });
        } else {
            console.warn('Play promise is undefined!');
        }
    }

    private onRegionUpdated(region: Region): void {
        const segments = this.segments();
        const index = segments.findIndex(s => s.id === region.id);

        if (index !== -1) {
            const updatedSegments = [...segments];
            updatedSegments[index] = {
                ...updatedSegments[index],
                start: region.start,
                end: region.end
            };
            this.segments.set(updatedSegments);
        }
    }

    private updateActiveSegment(currentTime: number): void {
        const segments = this.segments();
        const activeSegment = segments.find(s => currentTime >= s.start && currentTime <= s.end);
        this.activeSegmentId = activeSegment?.id || null;
    }

    playSegment(segmentId: string): void {
        console.log('=== playSegment called ===');
        console.log('Segment ID:', segmentId);
        console.log('Regions plugin:', this.regionsPlugin);

        const regions = this.regionsPlugin?.getRegions();
        console.log('All regions:', regions);

        const region = regions?.find((r: Region) => r.id === segmentId);
        console.log('Found region:', region);

        if (region) {
            console.log('Region details:', {
                id: region.id,
                start: region.start,
                end: region.end,
                duration: region.end - region.start
            });
            this.playRegion(region);
        } else {
            console.error('Region not found for segment ID:', segmentId);
        }
    }

    togglePlayPause(): void {
        if (this.wavesurfer) {
            this.wavesurfer.playPause();
        }
    }

    zoomIn(): void {
        if (this.wavesurfer) {
            this.wavesurfer.zoom(this.wavesurfer.options.minPxPerSec * 1.5);
        }
    }

    zoomOut(): void {
        if (this.wavesurfer) {
            this.wavesurfer.zoom(this.wavesurfer.options.minPxPerSec / 1.5);
        }
    }

    updateSegmentText(segmentId: string, newText: string): void {
        const segments = this.segments();
        const index = segments.findIndex(s => s.id === segmentId);

        if (index !== -1) {
            const updatedSegments = [...segments];
            updatedSegments[index] = {
                ...updatedSegments[index],
                text: newText
            };
            this.segments.set(updatedSegments);
        }
    }

    updateSegmentTiming(segmentId: string, start: number, end: number): void {
        const segments = this.segments();
        const index = segments.findIndex(s => s.id === segmentId);

        if (index !== -1) {
            const updatedSegments = [...segments];
            updatedSegments[index] = {
                ...updatedSegments[index],
                start,
                end
            };
            this.segments.set(updatedSegments);

            const region = this.regionsPlugin?.getRegions().find((r: Region) => r.id === segmentId);
            if (region) {
                region.setOptions({ start, end });
            }
        }
    }

    deleteSegment(segmentId: string): void {
        const segments = this.segments();
        const updatedSegments = segments.filter(s => s.id !== segmentId);
        this.segments.set(updatedSegments);

        const region = this.regionsPlugin?.getRegions().find((r: Region) => r.id === segmentId);
        if (region) {
            region.remove();
        }
    }

    addNewSegment(): void {
        const segments = this.segments();
        const lastSegment = segments[segments.length - 1];
        const newStart = lastSegment ? lastSegment.end + 0.5 : 0;
        const newEnd = newStart + 2.0;

        const newSegment: Segment = {
            id: crypto.randomUUID(),
            text: 'New Segment',
            start: newStart,
            end: newEnd
        };

        this.segments.set([...segments, newSegment]);

        // Add region
        if (this.regionsPlugin) {
            this.regionsPlugin.addRegion({
                id: newSegment.id,
                start: newSegment.start,
                end: newSegment.end,
                color: this.getRegionColor(segments.length),
                drag: true,
                resize: true
            });
        }
    }

    exportJSON(): void {
        const segments = this.segments();

        if (segments.length === 0) {
            alert('No segments to export. Please generate segments first.');
            return;
        }

        const data = {
            metadata: {
                audioFile: this.audioFile?.name || 'unknown',
                script: this.script,
                totalSegments: segments.length,
                generatedAt: new Date().toISOString()
            },
            segments: segments
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `lesson_${Date.now()}.json`;
        link.click();

        URL.revokeObjectURL(url);
    }

    private cleanup(): void {
        if (this.wavesurfer) {
            this.wavesurfer.destroy();
            this.wavesurfer = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}
