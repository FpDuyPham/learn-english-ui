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

interface ScriptToken {
    word: string;
    sentenceIndex: number;
    originalIndex: number;
}

/**
 * Perform Global Alignment using Needleman-Wunsch algorithm
 * Maps each script token to a Vosk word index (or null)
 */
function performGlobalAlignment(scriptTokens: ScriptToken[], voskWords: VoskWord[], config: AlignmentConfig): (number | null)[] {
    const n = scriptTokens.length;
    const m = voskWords.length;

    // DP Matrix: score[i][j]
    // We use a flat array to represent 2D matrix for slightly better memory layout, 
    // but array-of-arrays is easier to debug. Let's use array of arrays.
    // Dimensions: (n+1) x (m+1)
    const score: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));
    const direction: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));
    // Directions: 0=Stop, 1=Diagonal(Match), 2=Up(Gap in Vosk), 3=Left(Gap in Script)

    // Penalties
    const GAP_PENALTY = -1;
    const MISMATCH_PENALTY = -2;
    const MATCH_BONUS = 5;

    // Initialize boundaries
    for (let i = 0; i <= n; i++) {
        score[i][0] = i * GAP_PENALTY;
        direction[i][0] = 2; // Up
    }
    for (let j = 0; j <= m; j++) {
        score[0][j] = j * GAP_PENALTY;
        direction[0][j] = 3; // Left
    }

    // Fill Matrix
    // Optimization: We can limit the search band (j must be close to i * ratio)
    // But for N, M < 5000, full matrix is ~25M entries, might be heavy for browser.
    // Let's implement a simple banded check if N*M > 10,000,000

    const ratio = m / n;
    const bandSize = Math.max(50, m * 0.2); // 20% buffer or 50 words

    for (let i = 1; i <= n; i++) {
        const centerJ = Math.floor(i * ratio);
        const startJ = Math.max(1, centerJ - bandSize);
        const endJ = Math.min(m, centerJ + bandSize);

        for (let j = startJ; j <= endJ; j++) {
            const scriptWord = scriptTokens[i - 1].word;
            const voskWord = voskWords[j - 1].word;

            const similarity = fuzzyMatchWord(scriptWord, voskWord);
            const isMatch = similarity >= config.fuzzyMatchThreshold;

            const matchScore = isMatch
                ? MATCH_BONUS * similarity
                : MISMATCH_PENALTY;

            const diagonal = score[i - 1][j - 1] + matchScore;
            const up = score[i - 1][j] + GAP_PENALTY;
            const left = score[i][j - 1] + GAP_PENALTY;

            if (diagonal >= up && diagonal >= left) {
                score[i][j] = diagonal;
                direction[i][j] = 1;
            } else if (up >= left) {
                score[i][j] = up;
                direction[i][j] = 2;
            } else {
                score[i][j] = left;
                direction[i][j] = 3;
            }
        }
    }

    // Traceback
    const mapping: (number | null)[] = new Array(n).fill(null);
    let i = n;
    let j = m;

    while (i > 0 && j > 0) {
        // If we are outside the computed band (due to band logic), just go diagonally or greedy
        // But our initialization handles 0-indices, so we just need to be careful if we hit uncomputed cells (0)
        // Since we initialized with 0 and valid scores are likely non-zero or negative, 
        // uncomputed cells might be an issue. 
        // Ideally we should initialize with -Infinity.
        // For now, assuming the band covered the optimal path.

        const dir = direction[i][j];

        if (dir === 1) { // Diagonal (Match or Mismatch)
            // Only map if it was actually a good match
            const scriptWord = scriptTokens[i - 1].word;
            const voskWord = voskWords[j - 1].word;
            if (fuzzyMatchWord(scriptWord, voskWord) >= config.fuzzyMatchThreshold) {
                mapping[i - 1] = j - 1;
            }
            i--;
            j--;
        } else if (dir === 2) { // Up (Gap in Vosk / Script word skipped)
            i--;
        } else if (dir === 3) { // Left (Gap in Script / Vosk word skipped)
            j--;
        } else {
            // Should not happen if logic is correct, but if we hit boundary
            if (i > 0) i--;
            else if (j > 0) j--;
        }
    }

    return mapping;
}

/**
 * Main alignment function: Aligns script sentences with Vosk word timestamps
 * Uses Global Alignment for robustness.
 */
export function alignSegments(
    script: string,
    voskWords: VoskWord[],
    config: Partial<AlignmentConfig> = {}
): Segment[] {
    const finalConfig: AlignmentConfig = { ...DEFAULT_CONFIG, ...config };

    if (!voskWords || voskWords.length === 0) {
        console.warn('No Vosk words provided for alignment');
        return [];
    }

    // 1. Prepare Script Tokens
    const sentences = splitIntoSentences(script);
    const scriptTokens: ScriptToken[] = [];

    sentences.forEach((sentence, sIdx) => {
        const words = normalizeText(sentence).split(/\s+/).filter(w => w.length > 0);
        words.forEach(word => {
            scriptTokens.push({
                word,
                sentenceIndex: sIdx,
                originalIndex: scriptTokens.length
            });
        });
    });

    if (scriptTokens.length === 0) {
        return [];
    }

    console.log(`Starting Global Alignment: ${scriptTokens.length} script words vs ${voskWords.length} audio words`);

    // 2. Run Global Alignment
    const mapping = performGlobalAlignment(scriptTokens, voskWords, finalConfig);

    // 3. Construct Segments
    const segments: Segment[] = [];

    // Group tokens by sentence
    for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
        const sentenceTokens = scriptTokens.filter(t => t.sentenceIndex === sIdx);
        if (sentenceTokens.length === 0) continue;

        // Find matched Vosk words for this sentence
        const matchedVoskIndices = sentenceTokens
            .map(t => mapping[t.originalIndex])
            .filter(idx => idx !== null) as number[];

        if (matchedVoskIndices.length > 0) {
            // We have matches!
            const startVoskIdx = Math.min(...matchedVoskIndices);
            const endVoskIdx = Math.max(...matchedVoskIndices);

            segments.push({
                id: `seg_${Date.now()}_${sIdx}`,
                text: sentences[sIdx],
                start: voskWords[startVoskIdx].start,
                end: voskWords[endVoskIdx].end
            });
        } else {
            // No matches for this sentence (Gap)
            // We will fill this in Step 4
            segments.push({
                id: `seg_${Date.now()}_${sIdx}`,
                text: sentences[sIdx],
                start: -1, // Marker for interpolation
                end: -1
            });
        }
    }

    // 4. Interpolate Gaps
    // We have some segments with -1 start/end. We need to fill them.

    for (let i = 0; i < segments.length; i++) {
        if (segments[i].start === -1) {
            // Find previous valid segment
            let prevValidIdx = i - 1;
            while (prevValidIdx >= 0 && segments[prevValidIdx].start === -1) {
                prevValidIdx--;
            }

            // Find next valid segment
            let nextValidIdx = i + 1;
            while (nextValidIdx < segments.length && segments[nextValidIdx].start === -1) {
                nextValidIdx++;
            }

            const prevEnd = prevValidIdx >= 0 ? segments[prevValidIdx].end : 0;
            const nextStart = nextValidIdx < segments.length ? segments[nextValidIdx].start : (voskWords[voskWords.length - 1].end);

            // How many gaps to fill?
            const gapCount = nextValidIdx - prevValidIdx - 1;
            const totalGapDuration = nextStart - prevEnd;
            const durationPerSegment = Math.max(0.5, totalGapDuration / gapCount); // At least 0.5s

            // Fill current gap and subsequent gaps in this block
            let currentStart = prevEnd;
            for (let k = prevValidIdx + 1; k < nextValidIdx; k++) {
                segments[k].start = parseFloat(currentStart.toFixed(2));
                segments[k].end = parseFloat((currentStart + durationPerSegment).toFixed(2));
                currentStart += durationPerSegment;
            }

            // Skip outer loop to end of this block
            i = nextValidIdx - 1;
        }
    }

    console.log(`Generated ${segments.length} globally aligned segments`);
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
