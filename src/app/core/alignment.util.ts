import { compareTwoStrings } from 'string-similarity';

/**
 * Represents a word with timestamp from Vosk recognition
 */
export interface VoskWord {
    word: string;
    start: number;
    end: number;
    conf: number;
}

/**
 * Represents a lesson segment with text and timing
 */
export interface Segment {
    id: string;
    text: string;
    start: number;
    end: number;
}

/**
 * Configuration for alignment algorithm
 */
export interface AlignmentConfig {
    fuzzyMatchThreshold: number; // Minimum similarity score (0-1) to consider a match
    sentenceEndMarkers: string; // Regex pattern for sentence endings
    minConfidence: number; // Minimum confidence to trust a Vosk word
}

/**
 * Default configuration for alignment
 */
const DEFAULT_CONFIG: AlignmentConfig = {
    fuzzyMatchThreshold: 0.6, // 60% similarity
    sentenceEndMarkers: '[.!?]+',
    minConfidence: 0.3
};

/**
 * Split text into sentences using line breaks or punctuation
 * Detects dialogue format (line-break based) vs paragraph format (punctuation based)
 */
export function splitIntoSentences(text: string): string[] {
    // Check if text uses line-break based dialogue format
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

    // If we have many short lines (avg < 100 chars), likely dialogue format
    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
    const isDialogueFormat = lines.length > 5 && avgLineLength < 100;

    if (isDialogueFormat) {
        // Use line breaks as segment boundaries
        console.log('Detected dialogue format - using line breaks for segmentation');
        return lines;
    }

    // Otherwise, use sentence-ending punctuation
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const matches = text.match(sentenceRegex);

    if (!matches) {
        // If no punctuation and no line breaks, treat entire text as one sentence
        return [text.trim()];
    }

    console.log('Detected paragraph format - using punctuation for segmentation');
    return matches.map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Normalize text for comparison (lowercase, remove punctuation)
 */
export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[.,!?;:'"…]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Calculate fuzzy match score between two words
 * @returns Similarity score from 0 to 1
 */
export function fuzzyMatchWord(word1: string, word2: string): number {
    const norm1 = normalizeText(word1);
    const norm2 = normalizeText(word2);

    // Exact match
    if (norm1 === norm2) {
        return 1.0;
    }

    // Use string-similarity library
    return compareTwoStrings(norm1, norm2);
}

/**
 * Find the best matching Vosk word for a script word
 */
function findBestMatch(
    scriptWord: string,
    voskWords: VoskWord[],
    startIndex: number,
    config: AlignmentConfig
): { index: number; score: number } | null {
    let bestMatch: { index: number; score: number } | null = null;

    // Search within a reasonable window (next 10 words)
    const searchWindow = Math.min(startIndex + 10, voskWords.length);

    for (let i = startIndex; i < searchWindow; i++) {
        const voskWord = voskWords[i];
        const score = fuzzyMatchWord(scriptWord, voskWord.word);

        if (score >= config.fuzzyMatchThreshold) {
            if (!bestMatch || score > bestMatch.score) {
                bestMatch = { index: i, score };
            }

            // If we found an exact match, stop searching
            if (score === 1.0) {
                break;
            }
        }
    }

    return bestMatch;
}

/**
 * Align a single sentence with Vosk words
 */
function alignSentence(
    sentence: string,
    voskWords: VoskWord[],
    voskStartIndex: number,
    config: AlignmentConfig
): { segment: Segment; endIndex: number } | null {
    const words = normalizeText(sentence).split(/\s+/).filter(w => w.length > 0);

    if (words.length === 0) {
        return null;
    }

    // Find first word match
    const firstMatch = findBestMatch(words[0], voskWords, voskStartIndex, config);
    if (!firstMatch) {
        console.warn('Could not find match for first word:', words[0]);
        return null;
    }

    // Find last word match
    let lastMatch = firstMatch;
    let currentVoskIndex = firstMatch.index + 1;

    for (let i = 1; i < words.length; i++) {
        const match = findBestMatch(words[i], voskWords, currentVoskIndex, config);
        if (match) {
            lastMatch = match;
            currentVoskIndex = match.index + 1;
        } else {
            // If we can't find a match, try to continue from current position
            console.warn('Could not find match for word:', words[i]);
        }
    }

    // Create segment with timestamps
    const startTime = voskWords[firstMatch.index].start;
    const endTime = voskWords[lastMatch.index].end;

    return {
        segment: {
            id: `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: sentence,
            start: startTime,
            end: endTime
        },
        endIndex: lastMatch.index + 1
    };
}

/**
 * Main alignment function: Aligns script sentences with Vosk word timestamps
 * 
 * @param script The correct script text
 * @param voskWords Array of recognized words with timestamps
 * @param config Optional configuration for alignment
 * @returns Array of segments with aligned timestamps
 */
export function alignSegments(
    script: string,
    voskWords: VoskWord[],
    config: Partial<AlignmentConfig> = {}
): Segment[] {
    const finalConfig: AlignmentConfig = { ...DEFAULT_CONFIG, ...config };

    // Handle edge case: no Vosk results
    if (!voskWords || voskWords.length === 0) {
        console.warn('No Vosk words provided for alignment');
        return [];
    }

    // Split script into sentences/lines
    const sentences = splitIntoSentences(script);
    console.log(`Split script into ${sentences.length} segments`);

    if (sentences.length === 0) {
        console.warn('No sentences found in script');
        return [];
    }

    const segments: Segment[] = [];
    let currentVoskIndex = 0;

    for (const sentence of sentences) {
        const result = alignSentence(sentence, voskWords, currentVoskIndex, finalConfig);

        if (result) {
            segments.push(result.segment);
            currentVoskIndex = result.endIndex;
        } else {
            console.warn('Failed to align sentence:', sentence);

            // Try to create a segment with estimated timing
            if (segments.length > 0 && currentVoskIndex < voskWords.length) {
                const lastSegment = segments[segments.length - 1];
                const estimatedStart = lastSegment.end;
                const estimatedEnd = currentVoskIndex < voskWords.length
                    ? voskWords[currentVoskIndex].end
                    : estimatedStart + 2.0; // Estimate 2 seconds

                segments.push({
                    id: `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    text: sentence,
                    start: estimatedStart,
                    end: estimatedEnd
                });
            }
        }
    }

    console.log(`Generated ${segments.length} aligned segments`);
    return segments;
}

/**
 * Utility function to convert Vosk result to VoskWord array
 */
export function extractVoskWords(voskResult: any): VoskWord[] {
    if (!voskResult || !voskResult.result) {
        return [];
    }

    const words: VoskWord[] = [];

    for (const item of voskResult.result) {
        if (item.word && item.start !== undefined && item.end !== undefined) {
            words.push({
                word: item.word,
                start: item.start,
                end: item.end,
                conf: item.conf || 0
            });
        }
    }

    return words;
}
