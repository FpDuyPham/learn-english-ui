import { Injectable } from '@angular/core';
import { VoskResult } from './vosk.service';
import { ShadowingFeedback, WordFeedback } from './models/shadowing.models';

/**
 * Service for calculating Levenshtein distance and scoring pronunciation accuracy
 */
@Injectable({
    providedIn: 'root'
})
export class LevenshteinService {

    constructor() { }

    /**
     * Calculate Levenshtein distance between two strings
     * @param str1 First string
     * @param str2 Second string
     * @returns The minimum number of single-character edits required to change str1 into str2
     */
    calculateDistance(str1: string, str2: string): number {
        const len1 = str1.length;
        const len2 = str2.length;

        // Create 2D array for dynamic programming
        const dp: number[][] = Array(len1 + 1)
            .fill(null)
            .map(() => Array(len2 + 1).fill(0));

        // Initialize first row and column
        for (let i = 0; i <= len1; i++) {
            dp[i][0] = i;
        }
        for (let j = 0; j <= len2; j++) {
            dp[0][j] = j;
        }

        // Fill the dp table
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.min(
                        dp[i - 1][j] + 1,      // deletion
                        dp[i][j - 1] + 1,      // insertion
                        dp[i - 1][j - 1] + 1   // substitution
                    );
                }
            }
        }

        return dp[len1][len2];
    }

    /**
     * Calculate scoring and feedback for a shadowing attempt
     * @param original The original sentence text
     * @param recognized The Vosk recognition result
     * @returns Detailed feedback with accuracy and word-level analysis
     */
    calculateScore(original: string, recognized: VoskResult): ShadowingFeedback {
        // Normalize and split into words
        const originalWords = this.normalizeText(original).split(/\s+/).filter(w => w.length > 0);
        const recognizedWords = this.normalizeText(recognized.text).split(/\s+/).filter(w => w.length > 0);
        const resultWords = recognized.result || [];

        const wordFeedbacks: WordFeedback[] = [];
        const wrongWords: string[] = [];
        const missingWords: string[] = [];
        const lowConfidenceWords: WordFeedback[] = [];
        let correctCount = 0;

        // Word-by-word comparison with position alignment
        const maxLength = Math.max(originalWords.length, recognizedWords.length);

        for (let i = 0; i < originalWords.length; i++) {
            const originalWord = originalWords[i];
            const recognizedWord = recognizedWords[i];
            const resultWord = resultWords.find(r => r.word.toLowerCase() === originalWord);

            if (!recognizedWord) {
                // Word is missing
                wordFeedbacks.push({
                    word: originalWord,
                    status: 'missing',
                    position: i
                });
                missingWords.push(originalWord);
            } else if (originalWord === recognizedWord) {
                // Word matches - check confidence
                const conf = resultWord?.conf || 1.0;

                if (conf < 0.7) {
                    const feedback: WordFeedback = {
                        word: originalWord,
                        status: 'low-confidence',
                        confidence: conf,
                        position: i
                    };
                    wordFeedbacks.push(feedback);
                    lowConfidenceWords.push(feedback);
                } else {
                    wordFeedbacks.push({
                        word: originalWord,
                        status: 'correct',
                        confidence: conf,
                        position: i
                    });
                    correctCount++;
                }
            } else {
                // Word is wrong
                wordFeedbacks.push({
                    word: originalWord,
                    status: 'wrong',
                    position: i
                });
                wrongWords.push(originalWord);
            }
        }

        // Calculate accuracy percentage
        const accuracy = originalWords.length > 0
            ? Math.round((correctCount / originalWords.length) * 100)
            : 0;

        return {
            accuracy,
            wordFeedbacks,
            wrongWords,
            missingWords,
            lowConfidenceWords
        };
    }

    /**
     * Normalize text by converting to lowercase and removing punctuation
     * @param text Text to normalize
     * @returns Normalized text
     */
    private normalizeText(text: string): string {
        return text
            .toLowerCase()
            .replace(/[.,!?;:'"]/g, '')
            .trim();
    }

    /**
     * Highlight differences between original and recognized text
     * @param original Original sentence
     * @param recognized Recognized sentence
     * @returns Array of word feedbacks showing differences
     */
    highlightDifferences(original: string, recognized: string): WordFeedback[] {
        const originalWords = this.normalizeText(original).split(/\s+/).filter(w => w.length > 0);
        const recognizedWords = this.normalizeText(recognized).split(/\s+/).filter(w => w.length > 0);

        const feedbacks: WordFeedback[] = [];

        for (let i = 0; i < originalWords.length; i++) {
            const originalWord = originalWords[i];
            const recognizedWord = recognizedWords[i];

            if (!recognizedWord) {
                feedbacks.push({
                    word: originalWord,
                    status: 'missing',
                    position: i
                });
            } else if (originalWord === recognizedWord) {
                feedbacks.push({
                    word: originalWord,
                    status: 'correct',
                    position: i
                });
            } else {
                feedbacks.push({
                    word: originalWord,
                    status: 'wrong',
                    position: i
                });
            }
        }

        return feedbacks;
    }
}
