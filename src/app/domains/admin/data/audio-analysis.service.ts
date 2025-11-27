import { Injectable } from '@angular/core';
import * as Pitchfinder from 'pitchfinder';

@Injectable({
    providedIn: 'root'
})
export class AudioAnalysisService {

    constructor() { }

    /**
     * Extracts pitch (frequency) from an AudioBuffer and normalizes it.
     * @param audioBuffer The audio buffer to analyze.
     * @returns An array of normalized pitch values (0-1).
     */
    extractPitch(audioBuffer: AudioBuffer): number[] {
        const float32Array = audioBuffer.getChannelData(0); // Get the first channel
        const sampleRate = audioBuffer.sampleRate;

        // 1. Detect Pitch using YIN algorithm
        // YIN is generally more accurate for speech than AMDF
        const detectPitch = Pitchfinder.YIN({ sampleRate: sampleRate });

        // We need to process the audio in small windows to get a pitch contour
        // A window size of around 20-50ms is typical for speech analysis.
        // Let's use 1024 samples which is ~23ms at 44.1kHz, or ~21ms at 48kHz.
        const windowSize = 1024;
        const hopSize = windowSize / 4; // Overlap for smoother results

        const frequencies: number[] = [];

        for (let i = 0; i < float32Array.length - windowSize; i += hopSize) {
            const chunk = float32Array.slice(i, i + windowSize);
            const frequency = detectPitch(chunk);
            // frequency is null if no pitch is detected (unvoiced or silence)
            frequencies.push(frequency || 0);
        }

        // 2. Normalize Data
        // Human voice range: Men ~85-180Hz, Women ~165-255Hz.
        // We'll take a slightly broader range to cover outliers: 70Hz - 300Hz.
        // Anything outside this might be noise or unvoiced.
        const minFreq = 70;
        const maxFreq = 300;

        const normalized = frequencies.map(freq => {
            if (freq <= 0 || freq < minFreq || freq > maxFreq) {
                return -1; // Mark as silence/unvoiced for now
            }
            // Normalize to 0-1
            return (freq - minFreq) / (maxFreq - minFreq);
        });

        // 3. Smooth Data (Simple Moving Average)
        return this.smoothArray(normalized, 5);
    }

    private smoothArray(data: number[], windowSize: number): number[] {
        const smoothed: number[] = [];
        for (let i = 0; i < data.length; i++) {
            // If current point is silence/invalid, keep it as -1 (or 0 for drawing)
            // However, for a continuous line, we might want to interpolate or just skip.
            // Let's treat -1 as a break in the line in the UI, but here we just return it.
            if (data[i] === -1) {
                smoothed.push(-1);
                continue;
            }

            let sum = 0;
            let count = 0;

            for (let j = i - Math.floor(windowSize / 2); j <= i + Math.floor(windowSize / 2); j++) {
                if (j >= 0 && j < data.length && data[j] !== -1) {
                    sum += data[j];
                    count++;
                }
            }

            if (count > 0) {
                smoothed.push(sum / count);
            } else {
                smoothed.push(data[i]);
            }
        }
        return smoothed;
    }
}
