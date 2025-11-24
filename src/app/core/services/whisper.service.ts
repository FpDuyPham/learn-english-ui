import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface WhisperOutput {
    text: string;
    chunks: { text: string; timestamp: [number, number] }[];
}

export interface WhisperProgress {
    status: string;
    name: string;
    file: string;
    progress: number;
    loaded: number;
    total: number;
}

@Injectable({
    providedIn: 'root'
})
export class WhisperService {
    private worker: Worker | null = null;
    private progressSubject = new Subject<WhisperProgress>();

    constructor() {
        if (typeof Worker !== 'undefined') {
            this.worker = new Worker(new URL('./whisper.worker', import.meta.url), { type: 'module' });

            this.worker.onmessage = ({ data }) => {
                if (data.type === 'progress') {
                    this.progressSubject.next(data.data);
                }
            };
        } else {
            console.error('Web Workers are not supported in this environment.');
        }
    }

    /**
     * Transcribes audio using the Whisper model in a Web Worker.
     * @param audio The audio data (Float32Array or Blob).
     * @returns An Observable that resolves to the transcription result.
     */
    transcribe(audio: Float32Array | Blob | number[]): Observable<WhisperOutput> {
        return new Observable(observer => {
            if (!this.worker) {
                observer.error('Worker not initialized');
                return;
            }

            const messageHandler = ({ data }: MessageEvent) => {
                if (data.type === 'complete') {
                    observer.next(data.data);
                    observer.complete();
                    this.worker?.removeEventListener('message', messageHandler);
                } else if (data.type === 'error') {
                    observer.error(data.data);
                    this.worker?.removeEventListener('message', messageHandler);
                }
            };

            this.worker.addEventListener('message', messageHandler);
            this.worker.postMessage({ type: 'transcribe', audio });
        });
    }

    /**
     * Returns an observable of model loading progress.
     */
    getProgress(): Observable<WhisperProgress> {
        return this.progressSubject.asObservable();
    }

    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}
