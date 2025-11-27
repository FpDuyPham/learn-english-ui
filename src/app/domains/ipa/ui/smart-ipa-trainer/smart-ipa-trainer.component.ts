import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { VoskService } from '../../../shadowing/data/vosk.service';
import { AudioWaveComponent } from '../../../../shared/components/audio-wave/audio-wave.component';
import { IpaWord } from '../../data/ipa-data.service';

@Component({
    selector: 'app-smart-ipa-trainer',
    standalone: true,
    imports: [CommonModule, ButtonModule, CardModule, AudioWaveComponent],
    templateUrl: './smart-ipa-trainer.component.html',
    styleUrls: ['./smart-ipa-trainer.component.scss']
})
export class SmartIpaTrainerComponent implements OnInit, OnDestroy, OnChanges {
    @Input() currentWord?: IpaWord;
    @Output() wordRecognized = new EventEmitter<{ correct: boolean, detected: string }>();

    isListening = false;
    feedback: {
        status: 'success' | 'error' | 'unknown' | 'idle';
        message: string;
        detectedWord?: string;
        detectedIpa?: string;
        highlightedTarget?: string;
    } = { status: 'idle', message: 'Press Start to practice.' };

    private stopListeningFn: (() => void) | null = null;

    constructor(private voskService: VoskService) { }

    ngOnInit(): void {
        this.voskService.loadModel().catch((err: any) => console.error('Failed to load model', err));
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['currentWord'] && !changes['currentWord'].firstChange) {
            if (this.isListening) {
                this.stopPractice();
            }
            this.feedback = { status: 'idle', message: 'Press Start to practice.' };
        }
    }

    ngOnDestroy(): void {
        this.stopPractice();
    }

    async togglePractice() {
        if (this.isListening) {
            this.stopPractice();
        } else {
            await this.startPractice();
        }
    }

    analyser: AnalyserNode | null = null;

    async startPractice() {
        if (!this.currentWord) {
            console.error('No current word set!');
            return;
        }
        this.isListening = true;
        this.feedback = { status: 'idle', message: 'Listening...' };

        const grammar = [
            this.currentWord.word,
            ...this.currentWord.confusions.map((c: any) => c.word),
            '[unk]'
        ];

        try {
            this.stopListeningFn = await this.voskService.startPractice(
                grammar,
                (text: string) => this.handleResult(text),
                (partial: string) => { },
                (analyser: AnalyserNode) => {
                    this.analyser = analyser;
                }
            );
        } catch (error) {
            console.error('Error starting practice:', error);
            this.isListening = false;
            this.feedback = { status: 'error', message: 'Could not start microphone. ' + error };
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
        if (!this.currentWord) return;

        console.log('Detected:', text);
        const detected = text.toLowerCase().trim();

        if (detected === this.currentWord.word) {
            this.playSound('success');
            this.feedback = {
                status: 'success',
                message: 'Perfect! You sounded like a native speaker.',
                detectedWord: detected,
                detectedIpa: this.currentWord.ipa,
                highlightedTarget: this.currentWord.word
            };
            this.wordRecognized.emit({ correct: true, detected });
            this.stopPractice();
        } else if (detected === '[unk]') {
            this.feedback = {
                status: 'unknown',
                message: 'Unclear, please try again.'
            };
        } else {
            const confusion = this.currentWord.confusions.find((c: any) => c.word === detected);
            if (confusion) {
                this.playSound('error');
                this.feedback = {
                    status: 'error',
                    message: confusion.explanation,
                    detectedWord: detected,
                    detectedIpa: confusion.ipa,
                    highlightedTarget: this.currentWord.word
                };
                this.wordRecognized.emit({ correct: false, detected });
            } else {
                this.feedback = {
                    status: 'unknown',
                    message: 'Heard something else: ' + detected
                };
            }
        }
    }

    playSound(type: 'success' | 'error') {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = audioContext.currentTime;

        if (type === 'success') {
            const notes = [523.25, 659.25, 783.99];
            notes.forEach((freq, index) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();

                osc.type = 'sine';
                osc.frequency.value = freq;

                osc.connect(gain);
                gain.connect(audioContext.destination);

                const startTime = now + (index * 0.1);
                const duration = 0.5;

                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

                osc.start(startTime);
                osc.stop(startTime + duration);
            });
        } else {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);

            osc.connect(gain);
            gain.connect(audioContext.destination);

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc.start(now);
            osc.stop(now + 0.3);
        }
    }

    highlightError(word: string, part: string): string {
        if (!part) return word;
        const regex = new RegExp(`(${part})`, 'i');
        return word.replace(regex, '<span class="error-highlight">$1</span>');
    }
}
