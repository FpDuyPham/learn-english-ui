import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class TtsService {
    private synthesis = window.speechSynthesis;
    private voices: SpeechSynthesisVoice[] = [];
    private preferredVoice: SpeechSynthesisVoice | null = null;

    constructor() {
        this.loadVoices();
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = () => this.loadVoices();
        }
    }

    private loadVoices() {
        this.voices = this.synthesis.getVoices();
        // Prefer Google US English, then Microsoft US English, then any English
        this.preferredVoice = this.voices.find(v => v.name.includes('Google US English')) ||
            this.voices.find(v => v.name.includes('Microsoft David')) ||
            this.voices.find(v => v.lang.startsWith('en-US')) ||
            this.voices.find(v => v.lang.startsWith('en')) ||
            null;
    }

    speak(text: string, rate: number = 1.0, volume: number = 1.0): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.synthesis.speaking) {
                this.synthesis.cancel();
            }

            const utterance = new SpeechSynthesisUtterance(text);
            if (this.preferredVoice) {
                utterance.voice = this.preferredVoice;
            }

            utterance.rate = rate;
            utterance.pitch = 1.0;
            utterance.volume = volume;

            utterance.onend = () => {
                resolve();
            };

            utterance.onerror = (event) => {
                reject(event);
            };

            this.synthesis.speak(utterance);
        });
    }

    stop() {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
    }

    isSpeaking(): boolean {
        return this.synthesis.speaking;
    }
}
