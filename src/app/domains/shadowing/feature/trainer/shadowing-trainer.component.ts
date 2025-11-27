import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';

import { ShadowingDataService } from '../../data/shadowing-data.service';
import { VoskService, VoskResult } from '../../data/vosk.service';
import { TtsService } from '../../data/tts.service';
import { SpeechAnalysisService } from '../../data/speech-analysis.service';
import { IpaPhonemeService } from '../../../ipa/ipa.api';
import { AudioAnalysisService } from '../../../admin/data/audio-analysis.service';
import { AudioWaveComponent } from '../../../../shared/components/audio-wave/audio-wave.component';

import {
    SentencePack,
    Sentence,
    DetailedFeedback,
    WordFeedback
} from '../../models/shadowing.models';

@Component({
    selector: 'app-shadowing-trainer',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ButtonModule,
        CardModule,
        ProgressBarModule,
        BadgeModule,
        DropdownModule,
        AudioWaveComponent,
        TooltipModule,
        DialogModule,
        DividerModule
    ],
    templateUrl: './shadowing-trainer.component.html',
    styleUrls: ['./shadowing-trainer.component.scss']
})
export class ShadowingTrainerComponent implements OnInit, OnDestroy {
    @ViewChild('pitchCanvas') pitchCanvas!: ElementRef<HTMLCanvasElement>;

    article?: SentencePack;
    currentSentenceIndex = 0;
    isRecording = false;
    partialText = '';
    feedback: DetailedFeedback | null = null;
    canMoveNext = false;
    sessionComplete = false;
    showHelp = false;

    // Session stats
    sessionResults = {
        sentencesCompleted: 0,
        totalSentences: 0,
        totalXP: 0,
        averageAccuracy: 0,
        accuracies: [] as number[]
    };

    // TTS & Audio
    playbackSpeed = 1.0;
    playbackOptions = [
        { label: '1.0x (Normal)', value: 1.0 },
        { label: '0.8x (Slow)', value: 0.8 },
        { label: '0.6x (Very Slow)', value: 0.6 }
    ];
    isPlayingTarget = false;

    // Recording & Visualization
    analyser: AnalyserNode | null = null;
    private stopRecordingFn?: () => void;

    // Pitch Analysis
    audioChunks: AudioBuffer[] = [];
    difficulty: 'easy' | 'medium' | 'hard' = 'easy';

    // Auto-stop
    private silenceTimer: any;
    private lastSpeechTime = 0;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private shadowingService: ShadowingDataService,
        private voskService: VoskService,
        private ttsService: TtsService,
        private speechAnalysisService: SpeechAnalysisService,
        private audioAnalysisService: AudioAnalysisService,
        private ipaService: IpaPhonemeService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        const articleId = this.route.snapshot.paramMap.get('articleId');
        if (articleId) {
            this.article = this.shadowingService.getArticle(articleId);
            if (this.article) {
                this.sessionResults.totalSentences = this.article.sentences.length;
            }
        }

        // Load Vosk model
        this.voskService.loadModel().catch((err: any) => {
            console.error('Failed to load Vosk model:', err);
        });
    }

    ngOnDestroy() {
        this.stopRecordingManual();
        this.ttsService.stop();
    }

    get currentSentence(): Sentence | undefined {
        if (!this.article) return undefined;
        return this.article.sentences[this.currentSentenceIndex];
    }

    get progressPercent(): number {
        if (!this.article) return 0;
        return ((this.currentSentenceIndex + 1) / this.article.sentences.length) * 100;
    }

    // --- Difficulty / Ghost Mode ---
    setDifficulty(level: 'easy' | 'medium' | 'hard') {
        this.difficulty = level;
    }

    // --- Audio Playback ---

    async playTargetAudio() {
        if (!this.currentSentence || this.isPlayingTarget) return;

        this.isPlayingTarget = true;
        // Clear canvas when playing target (optional, or maybe we want to keep user's attempt?)
        // For now, let's keep it.

        const volume = this.difficulty === 'hard' ? 0 : (this.difficulty === 'medium' ? 0.5 : 1.0);

        try {
            await this.ttsService.speak(this.currentSentence.text, this.playbackSpeed, volume);
        } catch (error) {
            console.error('TTS Error:', error);
        } finally {
            this.isPlayingTarget = false;
            this.cdr.detectChanges();
        }
    }

    stopAudio() {
        this.ttsService.stop();
        this.isPlayingTarget = false;
    }

    // --- Recording ---

    async startRecording() {
        if (!this.currentSentence || this.isRecording) return;

        this.isRecording = true;
        this.feedback = null;
        this.partialText = '';
        this.analyser = null;
        this.audioChunks = []; // Reset chunks

        // Clear canvas
        this.clearCanvas();

        try {
            this.stopRecordingFn = await this.voskService.startShadowingPractice(
                this.currentSentence.text,
                (result: VoskResult) => this.handleRecognitionResult(result),
                (partial: string) => this.handlePartialResult(partial),
                (analyser: AnalyserNode) => {
                    this.analyser = analyser;
                    this.cdr.detectChanges();
                },
                (buffer: AudioBuffer) => {
                    this.audioChunks.push(buffer);
                }
            );

            // Reset silence detection
            this.lastSpeechTime = Date.now();
            this.startSilenceDetection();

        } catch (error) {
            console.error('Failed to start recording:', error);
            this.isRecording = false;
            alert('Failed to start recording. Please check microphone permissions.');
        }
    }

    stopRecordingManual() {
        if (this.stopRecordingFn) {
            this.stopRecordingFn();
            this.stopRecordingFn = undefined;
        }
        this.stopSilenceDetection();
        this.isRecording = false;
        this.analyser = null;

        // Process Audio for Pitch
        if (this.audioChunks.length > 0) {
            this.processPitch();
        }

        this.cdr.detectChanges();
    }

    private processPitch() {
        try {
            // We need a temporary AudioContext to create the buffer
            const tempCtx = new AudioContext({ sampleRate: 48000 });
            const fullBuffer = this.concatenateAudioBuffers(this.audioChunks, tempCtx);
            const pitchData = this.audioAnalysisService.extractPitch(fullBuffer);

            this.drawPitchCurve(pitchData, '#F97316'); // Orange-500

            tempCtx.close();
        } catch (e) {
            console.error('Error processing pitch:', e);
        }
    }

    private concatenateAudioBuffers(buffers: AudioBuffer[], audioContext: AudioContext): AudioBuffer {
        if (buffers.length === 0) return audioContext.createBuffer(1, 1, 48000);

        const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
        const result = audioContext.createBuffer(buffers[0].numberOfChannels, totalLength, buffers[0].sampleRate);

        let offset = 0;
        for (const buffer of buffers) {
            for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
                result.copyToChannel(buffer.getChannelData(channel), channel, offset);
            }
            offset += buffer.length;
        }
        return result;
    }

    private clearCanvas() {
        if (this.pitchCanvas && this.pitchCanvas.nativeElement) {
            const canvas = this.pitchCanvas.nativeElement;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }

    private drawPitchCurve(points: number[], color: string) {
        if (!this.pitchCanvas || !this.pitchCanvas.nativeElement) return;

        const canvas = this.pitchCanvas.nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Ensure canvas dimensions match display size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const width = canvas.width;
        const height = canvas.height;

        // Filter out -1 (silence) and draw segments
        let isDrawing = false;

        for (let i = 0; i < points.length; i++) {
            const x = (i / points.length) * width;
            const y = (1 - points[i]) * height; // Invert Y (1 is top, 0 is bottom)

            if (points[i] === -1) {
                isDrawing = false;
                continue;
            }

            if (!isDrawing) {
                ctx.moveTo(x, y);
                isDrawing = true;
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
    }

    private handlePartialResult(partial: string) {
        this.partialText = partial;
        if (partial.trim().length > 0) {
            this.lastSpeechTime = Date.now();
        }
    }

    private startSilenceDetection() {
        this.stopSilenceDetection();
        this.silenceTimer = setInterval(() => {
            if (this.isRecording && Date.now() - this.lastSpeechTime > 2000 && this.partialText.length > 0) {
                this.stopRecordingManual();
            }
        }, 500);
    }

    private stopSilenceDetection() {
        if (this.silenceTimer) {
            clearInterval(this.silenceTimer);
            this.silenceTimer = null;
        }
    }

    // --- Analysis & Feedback ---

    handleRecognitionResult(result: VoskResult) {
        if (!this.currentSentence) return;

        // Use new speech analysis service
        this.feedback = this.speechAnalysisService.analyzeSpeech(
            this.currentSentence.text,
            result
        );

        // Record attempt
        if (this.article) {
            this.shadowingService.recordSentenceAttempt(
                this.article.id,
                this.currentSentence.id,
                this.feedback.accuracy
            );

            this.sessionResults.accuracies.push(this.feedback.accuracy);

            // Calculate XP based on fluency score if available, otherwise accuracy
            const score = this.feedback.fluencyScore || this.feedback.accuracy;
            const sentenceXP = score >= 90 ? 15 : score >= 70 ? 10 : 5;
            this.sessionResults.totalXP += sentenceXP;
        }

        this.canMoveNext = true;
        this.stopRecordingManual();
    }

    // --- Navigation ---

    nextSentence() {
        if (!this.canMoveNext || !this.article) return;

        this.stopAudio();
        this.sessionResults.sentencesCompleted++;
        this.currentSentenceIndex++;
        this.canMoveNext = false;
        this.feedback = null;
        this.partialText = '';
        this.clearCanvas();

        if (this.currentSentenceIndex >= this.article.sentences.length) {
            this.completeSession();
        }
    }

    previousSentence() {
        if (this.currentSentenceIndex > 0) {
            this.stopAudio();
            this.currentSentenceIndex--;
            this.canMoveNext = false;
            this.feedback = null;
            this.partialText = '';
            this.clearCanvas();
        }
    }

    skipSentence() {
        if (this.article && this.currentSentence) {
            this.shadowingService.recordSentenceAttempt(
                this.article.id,
                this.currentSentence.id,
                0
            );
            this.sessionResults.accuracies.push(0);
        }

        this.canMoveNext = true;
        this.feedback = {
            accuracy: 0,
            fluencyScore: 0,
            rhythmScore: 0,
            intonationScore: 0,
            wordFeedbacks: [],
            wrongWords: [],
            missingWords: [],
            lowConfidenceWords: [],
            pronunciationErrors: [],
            overallComment: 'Skipped'
        };
    }

    tryAgain() {
        this.feedback = null;
        this.partialText = '';
        this.canMoveNext = false;
        this.clearCanvas();
        // Don't advance index, just reset state
    }

    completeSession() {
        this.sessionComplete = true;
        if (this.sessionResults.accuracies.length > 0) {
            this.sessionResults.averageAccuracy = Math.round(
                this.sessionResults.accuracies.reduce((sum, acc) => sum + acc, 0) /
                this.sessionResults.accuracies.length
            );
        }
    }

    restartSession() {
        this.currentSentenceIndex = 0;
        this.canMoveNext = false;
        this.sessionComplete = false;
        this.feedback = null;
        this.partialText = '';
        this.clearCanvas();
        this.sessionResults = {
            sentencesCompleted: 0,
            totalSentences: this.article?.sentences.length || 0,
            totalXP: 0,
            averageAccuracy: 0,
            accuracies: []
        };
    }

    getSpeedLabel(value: number): string {
        const option = this.playbackOptions.find(o => o.value === value);
        return option ? option.label : `${value}x`;
    }

    goBack() {
        this.router.navigate(['/shadowing/articles']);
    }

    // --- UI Helpers ---

    getScoreColorClass(score: number): string {
        if (score >= 90) return 'text-green-500';
        if (score >= 70) return 'text-yellow-500';
        return 'text-red-500';
    }

    getWordStatusClass(word: WordFeedback): string {
        switch (word.status) {
            case 'correct': return 'word-correct';
            case 'wrong': return 'word-wrong';
            case 'missing': return 'word-missing';
            case 'low-confidence': return 'word-low-confidence';
            default: return '';
        }
    }
}
