import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { StepsModule } from 'primeng/steps';
import { FileUploadModule } from 'primeng/fileupload';
import { TableModule } from 'primeng/table';
import { InputTextarea } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { WhisperService, WhisperOutput, WhisperProgress } from '../../data/whisper.service';
import { AlignmentUtil, Segment } from '../../../../core/utils/alignment.util';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

@Component({
    selector: 'app-lesson-generator',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        StepsModule,
        FileUploadModule,
        TableModule,
        InputTextarea,
        InputTextModule,
        ButtonModule,
        ProgressBarModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './lesson-generator.component.html',
    styleUrls: ['./lesson-generator.component.scss']
})
export class LessonGeneratorComponent implements OnInit, OnDestroy {
    @ViewChild('waveform', { static: false }) waveformContainer!: ElementRef;

    scriptText: string = '';
    selectedFile: File | null = null;
    isProcessing: boolean = false;
    progress: number = 0;
    progressStatus: string = '';

    wavesurfer: WaveSurfer | null = null;
    wsRegions: RegionsPlugin | null = null;
    segments: Segment[] = [];

    activeIndex: number = 0;
    steps: MenuItem[] = [
        { label: 'Upload & Configure' },
        { label: 'Waveform & Visualization' },
        { label: 'Edit Segments' }
    ];

    constructor(
        private whisperService: WhisperService,
        private messageService: MessageService
    ) { }

    ngOnInit() {
        this.whisperService.getProgress().subscribe((p: WhisperProgress) => {
            if (p.status === 'progress') {
                this.progress = p.progress;
                this.progressStatus = `Loading Model: ${Math.round(p.progress)}%`;
            } else if (p.status === 'ready') {
                this.progressStatus = 'Model Ready';
            }
        });
    }

    ngOnDestroy() {
        this.whisperService.terminate();
        if (this.wavesurfer) {
            this.wavesurfer.destroy();
        }
    }

    nextStep() {
        if (this.activeIndex < 2) {
            this.activeIndex++;
            if (this.activeIndex === 1) {
                setTimeout(() => {
                    if (this.selectedFile && !this.wavesurfer) {
                        this.initWavesurfer(this.selectedFile);
                    }
                    if (!this.segments.length && !this.isProcessing) {
                        this.generateLesson();
                    }
                }, 100);
            }
        }
    }

    prevStep() {
        if (this.activeIndex > 0) {
            this.activeIndex--;
        }
    }

    onActiveIndexChange(event: number) {
        if (event < this.activeIndex || (event === 1 && this.selectedFile && this.scriptText) || (event === 2 && this.segments.length > 0)) {
            this.activeIndex = event;
            setTimeout(() => {
                if (this.wavesurfer) {
                    this.wavesurfer.setTime(0);
                }
            }, 100);
        }
    }

    onFileSelect(event: any) {
        if (event.files && event.files.length > 0) {
            this.selectedFile = event.files[0];
            this.messageService.add({ severity: 'info', summary: 'File Selected', detail: this.selectedFile?.name });
        }
    }

    async initWavesurfer(file: File) {
        if (this.wavesurfer) {
            this.wavesurfer.destroy();
        }

        this.wsRegions = RegionsPlugin.create();

        this.wavesurfer = WaveSurfer.create({
            container: this.waveformContainer.nativeElement,
            waveColor: '#4F46E5',
            progressColor: '#818CF8',
            url: URL.createObjectURL(file),
            plugins: [this.wsRegions],
            height: 100,
        });

        this.wsRegions.on('region-clicked', (region, e) => {
            e.stopPropagation();
            region.play();
        });

        this.wsRegions.on('region-updated', (region) => {
            const index = parseInt(region.id);
            if (this.segments[index]) {
                this.segments[index].start = region.start;
                this.segments[index].end = region.end;
            }
        });
    }

    generateLesson() {
        if (!this.selectedFile || !this.scriptText) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please provide both script and audio file.' });
            return;
        }

        this.isProcessing = true;
        this.progressStatus = 'Transcribing...';
        this.progress = 0;

        this.whisperService.transcribe(this.selectedFile!).subscribe({
            next: (output: WhisperOutput) => {
                this.progressStatus = 'Aligning...';
                this.segments = AlignmentUtil.align(this.scriptText, output.chunks);
                this.drawRegions();
                this.isProcessing = false;
                this.progressStatus = 'Done';
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Lesson generated successfully!' });
            },
            error: (err: any) => {
                console.error(err);
                this.isProcessing = false;
                this.progressStatus = 'Error: ' + err;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Generation failed.' });
            }
        });
    }

    drawRegions() {
        this.wsRegions?.clearRegions();
        this.segments.forEach((segment, index) => {
            this.wsRegions?.addRegion({
                id: index.toString(),
                start: segment.start,
                end: segment.end,
                content: segment.text,
                color: 'rgba(79, 70, 229, 0.2)',
                drag: true,
                resize: true
            });
        });
    }

    exportJson() {
        console.log(JSON.stringify(this.segments, null, 2));
        this.messageService.add({ severity: 'success', summary: 'Exported', detail: 'Segments exported to console!' });
    }
}
