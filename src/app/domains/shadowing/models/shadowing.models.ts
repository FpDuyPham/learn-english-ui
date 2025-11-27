/**
 * Models and interfaces for Shadowing & Fluency Checker feature
 */

export interface Article {
    id: string;
    title: string;
    content: string;
    level: 1 | 2 | 3;
    category?: string;
    sentences: Sentence[];
    createdAt: Date;
    updatedAt?: Date;
}

export interface SentencePack extends Article {
    // Alias for Article to support new naming convention
}

export interface Sentence {
    id: string;
    text: string;
    articleId: string;
    order: number;
    ipa?: string;
    ipaSoundsCovered?: string[];
}

export interface WordFeedback {
    word: string;
    status: 'correct' | 'wrong' | 'missing' | 'low-confidence';
    confidence?: number;
    position: number;
    ipa?: string;
    userIpa?: string;
}

export interface PronunciationError {
    word: string;
    expectedIpa: string;
    actualIpa: string;
    type: 'vowel' | 'consonant' | 'stress' | 'missing' | 'unknown';
    explanation: string;
}

export interface DetailedFeedback extends ShadowingFeedback {
    fluencyScore: number;
    rhythmScore: number;
    intonationScore: number;
    pronunciationErrors: PronunciationError[];
    overallComment: string;
}

export interface ShadowingFeedback {
    accuracy: number;
    wrongWords: string[];
    missingWords: string[];
    lowConfidenceWords: WordFeedback[];
    wordFeedbacks: WordFeedback[];
}

export interface UserShadowingProgress {
    articleId: string;
    completedSentences: number;
    totalSentences: number;
    averageAccuracy: number;
    xpEarned: number;
    lastPracticed: Date;
    status: 'not_started' | 'in_progress' | 'completed';
    sentenceAccuracies: { [sentenceId: string]: number };
}

export interface LevelProgress {
    level: 1 | 2 | 3;
    articlesCompleted: number;
    totalArticles: number;
    totalXP: number;
    averageAccuracy: number;
    xpEarned: number;
}

export interface ShadowingSessionResult {
    articleId: string;
    sentencesCompleted: number;
    totalSentences: number;
    averageAccuracy: number;
    xpEarned: number;
    completedAt: Date;
}
