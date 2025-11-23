import { Injectable } from '@angular/core';
import { createModel, Model, KaldiRecognizer } from 'vosk-browser';

export interface VoskResult {
    text: string;
    result?: {
        conf: number;
        end: number;
        start: number;
        word: string;
    }[];
}

@Injectable({
    providedIn: 'root'
})
export class VoskService {
    private model: Model | null = null;
    private modelUrl = '/vosk-model-small-en-us-0.15.zip'; // Local path (served from public folder)

    constructor() { }

    async loadModel(): Promise<void> {
        if (this.model) return;

        try {
            // vosk-browser's createModel can load from a URL.
            this.model = await createModel(this.modelUrl);
            console.log('Vosk model loaded');
        } catch (error) {
            console.error('Error loading Vosk model:', error);
            throw error;
        }
    }

    async createRecognizer(grammar: string[]): Promise<KaldiRecognizer> {
        if (!this.model) {
            await this.loadModel();
        }

        const grammarStr = JSON.stringify(grammar);
        const recognizer = new this.model!.KaldiRecognizer(48000, grammarStr);
        return recognizer;
    }

    async startPractice(
        grammar: string[],
        onResult: (text: string) => void,
        onPartial: (text: string) => void,
        onAnalyser?: (analyser: AnalyserNode) => void
    ): Promise<() => void> {
        const recognizer = await this.createRecognizer(grammar);

        // Event-based API for vosk-browser
        recognizer.on('result', (message: any) => {
            // message is the JSON result from Vosk
            if (message.result && message.result.text) {
                onResult(message.result.text);
            }
        });

        recognizer.on('partialresult', (message: any) => {
            if (message.result && message.result.partial) {
                onPartial(message.result.partial);
            }
        });

        const stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                channelCount: 1,
                sampleRate: 48000
            }
        });

        const audioContext = new AudioContext({ sampleRate: 48000 });
        const source = audioContext.createMediaStreamSource(stream);

        // Create Analyser
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256; // Small FFT for fewer bars (128 bins)
        analyser.smoothingTimeConstant = 0.5;

        // Use a larger buffer size to avoid dropping frames if main thread is busy
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        // Graph: Source -> Analyser -> Processor -> Destination
        source.connect(analyser);
        analyser.connect(processor);
        processor.connect(audioContext.destination);

        if (onAnalyser) {
            onAnalyser(analyser);
        }

        processor.onaudioprocess = (event) => {
            const inputBuffer = event.inputBuffer;
            // acceptWaveform returns void in this version
            try {
                recognizer.acceptWaveform(inputBuffer);
            } catch (e) {
                console.error('Error processing audio:', e);
            }
        };

        return () => {
            stream.getTracks().forEach(track => track.stop());
            processor.disconnect();
            analyser.disconnect();
            source.disconnect();
            audioContext.close();
            recognizer.remove();
        };
    }
}
