import * as DMP from 'diff-match-patch';

export interface WhisperChunk {
    text: string;
    timestamp: [number, number];
}

export interface Segment {
    text: string;
    start: number;
    end: number;
}

interface AlignedWord {
    word: string;
    start: number | null;
    end: number | null;
}

export class AlignmentUtil {

    static align(script: string, whisperChunks: WhisperChunk[]): Segment[] {
        const dmp = new DMP.diff_match_patch();

        // 1. Normalize inputs
        const scriptWords = this.tokenize(script);
        const whisperWords = whisperChunks.map(c => c.text.toLowerCase().trim());

        // 2. Convert words to characters for diff-match-patch (Word-level diff hack)
        const wordMap = new Map<string, string>();
        const invWordMap = new Map<string, string>();
        let charCode = 2000; // Start with a safe unicode range

        const getCharForWord = (word: string) => {
            if (!wordMap.has(word)) {
                const char = String.fromCharCode(charCode++);
                wordMap.set(word, char);
                invWordMap.set(char, word);
            }
            return wordMap.get(word)!;
        };

        const scriptString = scriptWords.map(w => getCharForWord(w.toLowerCase())).join('');
        const whisperString = whisperWords.map(w => getCharForWord(w)).join('');

        // 3. Compute Diff
        const diffs = dmp.diff_main(whisperString, scriptString);
        dmp.diff_cleanupSemantic(diffs);

        // 4. Map Timestamps
        let whisperIndex = 0;
        const alignedWords: AlignedWord[] = [];

        for (const [operation, text] of diffs) {
            for (const char of text) {
                const originalWord = invWordMap.get(char);

                if (operation === 0) { // EQUAL
                    if (whisperIndex < whisperChunks.length) {
                        const chunk = whisperChunks[whisperIndex];
                        alignedWords.push({
                            word: originalWord!,
                            start: chunk.timestamp[0],
                            end: chunk.timestamp[1]
                        });
                        whisperIndex++;
                    }
                } else if (operation === -1) { // DELETE
                    whisperIndex++;
                } else if (operation === 1) { // INSERT
                    alignedWords.push({
                        word: originalWord!,
                        start: null,
                        end: null
                    });
                }
            }
        }

        const finalAlignedWords = alignedWords.map((aw, i) => ({
            ...aw,
            word: scriptWords[i]
        }));

        // 5. Gap Filling
        this.fillGaps(finalAlignedWords);

        // 6. Reconstruction
        return this.groupIntoSentences(script, finalAlignedWords);
    }

    private static tokenize(text: string): string[] {
        return text.trim().split(/\s+/);
    }

    private static fillGaps(words: AlignedWord[]) {
        for (let i = 0; i < words.length; i++) {
            if (words[i].start === null) {
                let prevEnd = 0;
                if (i > 0) {
                    let j = i - 1;
                    while (j >= 0 && words[j].end === null) j--;
                    if (j >= 0) prevEnd = words[j].end!;
                }

                let nextStart = prevEnd + 1;
                let j = i + 1;
                while (j < words.length && words[j].start === null) j++;
                if (j < words.length) nextStart = words[j].start!;

                let k = i;
                while (k < words.length && words[k].start === null) k++;
                const missingCount = k - i;
                const duration = nextStart - prevEnd;
                const step = duration / (missingCount + 1);

                for (let m = 0; m < missingCount; m++) {
                    words[i + m].start = prevEnd + step * m;
                    words[i + m].end = prevEnd + step * (m + 1);
                }

                i = k - 1;
            }
        }
    }

    private static groupIntoSentences(originalScript: string, alignedWords: AlignedWord[]): Segment[] {
        const segments: Segment[] = [];
        let currentSegment: Segment = { text: '', start: 0, end: 0 };
        let isNewSegment = true;

        for (const wordObj of alignedWords) {
            if (isNewSegment) {
                currentSegment = {
                    text: wordObj.word,
                    start: wordObj.start || 0,
                    end: wordObj.end || 0
                };
                isNewSegment = false;
            } else {
                currentSegment.text += ' ' + wordObj.word;
                currentSegment.end = wordObj.end || currentSegment.end;
            }

            if (/[.!?]$/.test(wordObj.word)) {
                segments.push(currentSegment);
                isNewSegment = true;
            }
        }

        if (!isNewSegment) {
            segments.push(currentSegment);
        }

        return segments;
    }
}
