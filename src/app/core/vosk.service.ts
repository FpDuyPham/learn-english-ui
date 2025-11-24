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
    // Use absolute URL to ensure proper loading
    private modelUrl = window.location.origin + '/vosk-model-small-en-us-0.15.zip';

    constructor() { }

    async loadModel(): Promise<void> {
        if (this.model) return;

        try {
            console.log('Loading Vosk model from:', this.modelUrl);
            // vosk-browser's createModel can load from a URL.
            this.model = await createModel(this.modelUrl);
            console.log('Vosk model loaded successfully');
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

    /**
     * Prepare a sentence for shadowing by creating a focused grammar array
     * This restricts Vosk vocabulary to only the words in the sentence + [unk]
     * @param text The sentence to practice
     * @returns Array of words for grammar constraint
     */
    prepareSentence(text: string): string[] {
        // 1. Convert to lowercase and clean
        const cleaned = text.toLowerCase().trim();

        // 2. Split into words (handle punctuation)
        const words = cleaned
            .replace(/[.,!?;:'"]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 0);

        // 3. Remove duplicates and add [unk] for unknown words
        const grammar = [...new Set(words), '[unk]'];

        console.log('Prepared grammar for sentence:', text);
        console.log('Grammar array:', grammar);

        return grammar;
    }

    /**
     * Start shadowing practice with dynamic grammar based on sentence
     * @param sentence The sentence to practice
     * @param onResult Callback for final recognition result
     * @param onPartial Callback for partial recognition results
     * @param onAnalyser Optional callback for audio analyser
     * @returns Cleanup function to stop recording
     */
    async startShadowingPractice(
        sentence: string,
        onResult: (result: VoskResult) => void,
        onPartial: (text: string) => void,
        onAnalyser?: (analyser: AnalyserNode) => void,
        onAudioChunk?: (buffer: AudioBuffer) => void
    ): Promise<() => void> {
        // Prepare grammar from sentence
        const grammar = this.prepareSentence(sentence);
        const recognizer = await this.createRecognizer(grammar);

        // Event-based API for vosk-browser
        recognizer.on('result', (message: any) => {
            if (message.result) {
                // Extract full result with confidence scores
                const voskResult: VoskResult = {
                    text: message.result.text || '',
                    result: message.result.result || []
                };
                onResult(voskResult);
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

        // Create Analyser for visualization
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.5;

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

            // Pass the buffer to the consumer if requested
            if (onAudioChunk) {
                // We need to clone the buffer because it's reused
                const newBuffer = audioContext.createBuffer(
                    inputBuffer.numberOfChannels,
                    inputBuffer.length,
                    inputBuffer.sampleRate
                );
                for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
                    newBuffer.copyToChannel(inputBuffer.getChannelData(channel), channel);
                }
                onAudioChunk(newBuffer);
            }

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
