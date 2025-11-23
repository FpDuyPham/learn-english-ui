import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { VoskService } from '../../core/vosk.service';
import { AudioWaveComponent } from '../../shared/components/audio-wave/audio-wave.component';

interface Confusion {
    word: string;
    ipa: string;
    errorMsg: string;
    highlightPart: string; // The part of the TARGET word to highlight
}

interface WordPractice {
    targetWord: string;
    targetIpa: string;
    confusions: Confusion[];
}

@Component({
    selector: 'app-smart-ipa-trainer',
    standalone: true,
    imports: [CommonModule, ButtonModule, CardModule, AudioWaveComponent],
    templateUrl: './smart-ipa-trainer.component.html',
    styleUrls: ['./smart-ipa-trainer.component.scss']
})
export class SmartIpaTrainerComponent implements OnInit, OnDestroy {
    // Data Structure (The "Hack" Logic)
    practiceData: WordPractice = {
        targetWord: 'sheep',
        targetIpa: '/ʃiːp/',
        confusions: [
            {
                word: 'ship',
                ipa: '/ʃɪp/',
                errorMsg: 'You pronounced short /ɪ/ instead of long /iː/.',
                highlightPart: 'ee'
            },
            {
                word: 'sheet',
                ipa: '/ʃiːt/',
                errorMsg: 'You pronounced /t/ instead of /p/.',
                highlightPart: 'p'
            }
        ]
    };

    isListening = false;
    feedback: {
        status: 'success' | 'error' | 'unknown' | 'idle';
        message: string;
        detectedWord?: string;
        detectedIpa?: string;
        highlightedTarget?: string; // HTML string with highlighting
    } = { status: 'idle', message: 'Press Start to practice.' };

    private stopListeningFn: (() => void) | null = null;

    constructor(private voskService: VoskService) { }

    ngOnInit(): void {
        // Preload model if possible?
        this.voskService.loadModel().catch(err => console.error('Failed to load model', err));
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
        this.isListening = true;
        this.feedback = { status: 'idle', message: 'Listening...' };

        // Construct Grammar: Target + Confusions + [unk]
        const grammar = [
            this.practiceData.targetWord,
            ...this.practiceData.confusions.map(c => c.word),
            '[unk]'
        ];

        try {
            this.stopListeningFn = await this.voskService.startPractice(
                grammar,
                (text: string) => this.handleResult(text),
                (partial: string) => { /* Optional: Show partial results */ },
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
        console.log('Detected:', text);

        // Normalize
        const detected = text.toLowerCase().trim();

        if (detected === this.practiceData.targetWord) {
            // Success
            this.playSound('success');
            this.feedback = {
                status: 'success',
                message: 'Perfect! You sounded like a native speaker.',
                detectedWord: detected,
                detectedIpa: this.practiceData.targetIpa,
                highlightedTarget: this.practiceData.targetWord // No red highlights
            };
            // Optional: Stop after success? Or keep listening?
            // Let's keep listening for repeated practice or stop.
            // this.stopPractice(); 
        } else if (detected === '[unk]') {
            this.feedback = {
                status: 'unknown',
                message: 'Unclear, please try again.'
            };
        } else {
            // Check confusions
            const confusion = this.practiceData.confusions.find(c => c.word === detected);
            if (confusion) {
                // Error Logic
                this.playSound('error');
                this.feedback = {
                    status: 'error',
                    message: confusion.errorMsg,
                    detectedWord: detected,
                    detectedIpa: confusion.ipa,
                    highlightedTarget: this.highlightError(this.practiceData.targetWord, confusion.highlightPart)
                };
            } else {
                // Should not happen if grammar is strict, but just in case
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
            // Success: Major Chord Arpeggio (C5 - E5 - G5)
            const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
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
            // Error: Descending "Bonk" (Triangle wave)
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
        // Simple replace for demo. Be careful if part appears multiple times.
        // For "sheep" and "ee", it works.
        // We wrap the part in a span with class 'text-red-500'
        if (!part) return word;
        const regex = new RegExp(`(${part})`, 'i');
        return word.replace(regex, '<span class="error-highlight">$1</span>');
    }
}
