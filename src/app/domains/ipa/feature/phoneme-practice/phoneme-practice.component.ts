import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { KnobModule } from 'primeng/knob';
import { MessageModule } from 'primeng/message';
import { PhoneticService } from '../../../../core/services/phonetic.service';
import type { WordData } from '../../../../core/services/phonetic.service';
import { VoskService } from '../../../shadowing/data/vosk.service';

@Component({
    standalone: true,
    selector: 'app-phoneme-practice',
    imports: [
        CommonModule,
        FormsModule,
        InputGroupModule,
        InputTextModule,
        ButtonModule,
        CardModule,
        KnobModule,
        MessageModule
    ],
    templateUrl: './phoneme-practice.component.html',
    styleUrls: ['./phoneme-practice.component.scss']
})

export class PhonemePracticeComponent implements OnInit, OnDestroy {
    targetWord: string = '';
    wordData: WordData | null = null;
    isListening: boolean = false;
    score: number = 0;
    feedbackMessage: string = '';
    recognizedWord: string = '';
    mismatchIndices: number[] = [];

    private stopListeningFn: (() => void) | null = null;

    constructor(
        private phoneticService: PhoneticService,
        private voskService: VoskService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        // Preload model
        this.voskService.loadModel().catch((err: any) => console.error('Error loading model:', err));
    }


    ngOnDestroy(): void {
        this.stopPractice();
    }

    onWordSubmit() {
        if (!this.targetWord.trim()) return;

        this.stopPractice();
        this.wordData = this.phoneticService.getWordData(this.targetWord);
        this.score = 0;
        this.feedbackMessage = '';
        this.recognizedWord = '';
        this.mismatchIndices = [];
    }

    async togglePractice() {
        if (this.isListening) {
            this.stopPractice();
        } else {
            await this.startPractice();
        }
    }

    async startPractice() {
        if (!this.wordData) return;

        this.isListening = true;
        this.feedbackMessage = 'Listening...';

        try {
            // Use smart grammar for better recognition accuracy
            this.stopListeningFn = await this.voskService.startPractice(
                this.wordData.grammarList,
                (text: string) => this.handleResult(text),
                (partial: string) => { /* Optional partial handling */ }
            );
        } catch (error: any) {
            console.error('Error starting practice:', error);
            this.isListening = false;
            this.feedbackMessage = 'Error accessing microphone.';
        }
    }

    stopPractice() {
        if (this.stopListeningFn) {
            this.stopListeningFn();
            this.stopListeningFn = null;
        }
        this.isListening = false;
    }

    handleResult(text: string) {
        if (!this.wordData) return;

        const detected = text.toLowerCase().trim();
        this.recognizedWord = detected;

        console.log('Vosk recognized:', detected, '| Target:', this.wordData.targetWord);

        if (detected === this.wordData.targetWord.toLowerCase()) {
            this.score = 100;
            this.feedbackMessage = 'Perfect!';
            this.mismatchIndices = [];
            this.stopPractice();
        } else if (detected === '[unk]') {
            this.feedbackMessage = 'Unclear, please try again.';
            this.score = 0;
        } else {
            // Analyze errors
            this.mismatchIndices = this.phoneticService.analyzePronunciation(
                this.wordData.targetWord,
                detected
            );

            // Calculate rough score based on mismatches
            const totalPhonemes = this.wordData.phonemes.length;
            const errors = this.mismatchIndices.length;
            this.score = Math.max(0, Math.round(((totalPhonemes - errors) / totalPhonemes) * 100));

            this.feedbackMessage = `You said "${detected}".`;
            this.stopPractice();
        }

        this.cdr.detectChanges();
    }

    isMismatch(index: number): boolean {
        return this.mismatchIndices.includes(index);
    }
}
