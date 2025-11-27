import { Injectable } from '@angular/core';
import { VoskResult } from './vosk.service';
import { IpaPhonemeService } from '../../ipa/ipa.api';
import { DetailedFeedback, PronunciationError, WordFeedback } from '../models/shadowing.models';
import { LevenshteinService } from './levenshtein.service';

@Injectable({
    providedIn: 'root'
})
export class SpeechAnalysisService {

    constructor(
        private ipaService: IpaPhonemeService,
        private levenshteinService: LevenshteinService
    ) { }

    /**
     * Analyze speech and generate detailed feedback
     * @param targetText Original sentence
     * @param voskResult Recognition result
     * @returns Detailed feedback object
     */
    analyzeSpeech(targetText: string, voskResult: VoskResult): DetailedFeedback {
        // 1. Basic accuracy (Levenshtein)
        const basicFeedback = this.levenshteinService.calculateScore(targetText, voskResult);

        // 2. Calculate fluency score
        const fluencyScore = this.calculateFluencyScore(basicFeedback, voskResult);

        // 3. Calculate rhythm score (based on timing)
        const rhythmScore = this.calculateRhythmScore(voskResult);

        // 4. Calculate intonation score (estimated from confidence)
        const intonationScore = this.calculateIntonationScore(voskResult);

        // 5. Generate pronunciation errors
        const pronunciationErrors = this.identifyPronunciationErrors(basicFeedback);

        // 6. Generate overall comment
        const overallComment = this.generateOverallComment(fluencyScore, pronunciationErrors.length);

        return {
            ...basicFeedback,
            fluencyScore,
            rhythmScore,
            intonationScore,
            pronunciationErrors,
            overallComment
        };
    }

    private calculateFluencyScore(feedback: any, result: VoskResult): number {
        // Base score is accuracy
        let score = feedback.accuracy;

        // Adjust based on confidence of correct words
        const correctWords = feedback.wordFeedbacks.filter((w: any) => w.status === 'correct');
        if (correctWords.length > 0) {
            const avgConfidence = correctWords.reduce((sum: number, w: any) => sum + (w.confidence || 0), 0) / correctWords.length;
            // Boost score if confidence is high, penalize if low
            score = (score * 0.7) + (avgConfidence * 100 * 0.3);
        }

        return Math.round(Math.min(100, Math.max(0, score)));
    }

    private calculateRhythmScore(result: VoskResult): number {
        // Estimate rhythm based on word spacing
        if (!result.result || result.result.length < 2) return 100;

        let totalPauseDuration = 0;
        let pauseCount = 0;

        for (let i = 0; i < result.result.length - 1; i++) {
            const currentEnd = result.result[i].end;
            const nextStart = result.result[i + 1].start;
            const pause = nextStart - currentEnd;

            if (pause > 0.5) {
                totalPauseDuration += pause;
                pauseCount++;
            }
        }

        const penalty = (pauseCount * 5) + (totalPauseDuration * 2);
        return Math.round(Math.max(0, 100 - penalty));
    }

    private calculateIntonationScore(result: VoskResult): number {
        if (!result.result || result.result.length === 0) return 0;

        const confidences = result.result.map(w => w.conf);
        const avg = confidences.reduce((a, b) => a + b, 0) / confidences.length;

        return Math.round(avg * 100);
    }

    private identifyPronunciationErrors(feedback: any): PronunciationError[] {
        const errors: PronunciationError[] = [];

        feedback.wordFeedbacks.forEach((w: WordFeedback) => {
            if (w.status === 'wrong' || w.status === 'low-confidence') {
                const expectedIpa = this.ipaService.getIpaForWord(w.word);

                errors.push({
                    word: w.word,
                    expectedIpa,
                    actualIpa: '?',
                    type: w.status === 'wrong' ? 'unknown' : 'stress',
                    explanation: w.status === 'wrong'
                        ? 'Word was not recognized correctly.'
                        : 'Pronunciation was unclear (low confidence).'
                });
            }
        });

        return errors;
    }

    private generateOverallComment(score: number, errorCount: number): string {
        if (score >= 90) return 'Excellent work! Your pronunciation is very clear and natural.';
        if (score >= 80) return 'Great job! You are speaking clearly. Keep practicing to perfect your rhythm.';
        if (score >= 70) return 'Good effort. Focus on the highlighted words to improve your accuracy.';
        if (score >= 50) return 'You are getting there. Try listening to the native audio again and speak slowly.';
        return 'Keep practicing. Break the sentence into smaller parts and try again.';
    }
}
