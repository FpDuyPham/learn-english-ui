import { Injectable } from '@angular/core';
// @ts-ignore
import pronouncing from 'pronouncing/build/pronouncing-browser';

export interface WordData {
    targetWord: string;
    targetIPA: string;
    ipaSymbols: string[];
    phonemes: string[];
    grammarList: string[];
}

@Injectable({
    providedIn: 'root'
})
export class PhoneticService {

    // ARPABET to IPA Map
    private readonly arpabetToIpa: { [key: string]: string } = {
        'AA': 'ɑ', 'AA0': 'ɑ', 'AA1': 'ɑ', 'AA2': 'ɑ',
        'AE': 'æ', 'AE0': 'æ', 'AE1': 'æ', 'AE2': 'æ',
        'AH': 'ʌ', 'AH0': 'ə', 'AH1': 'ʌ', 'AH2': 'ʌ',
        'AO': 'ɔ', 'AO0': 'ɔ', 'AO1': 'ɔ', 'AO2': 'ɔ',
        'AW': 'aʊ', 'AW0': 'aʊ', 'AW1': 'aʊ', 'AW2': 'aʊ',
        'AY': 'aɪ', 'AY0': 'aɪ', 'AY1': 'aɪ', 'AY2': 'aɪ',
        'B': 'b',
        'CH': 'tʃ',
        'D': 'd',
        'DH': 'ð',
        'EH': 'ɛ', 'EH0': 'ɛ', 'EH1': 'ɛ', 'EH2': 'ɛ',
        'ER': 'ɝ', 'ER0': 'ɚ', 'ER1': 'ɝ', 'ER2': 'ɝ',
        'EY': 'eɪ', 'EY0': 'eɪ', 'EY1': 'eɪ', 'EY2': 'eɪ',
        'F': 'f',
        'G': 'g',
        'HH': 'h',
        'IH': 'ɪ', 'IH0': 'ɪ', 'IH1': 'ɪ', 'IH2': 'ɪ',
        'IY': 'i', 'IY0': 'i', 'IY1': 'i', 'IY2': 'i',
        'JH': 'dʒ',
        'K': 'k',
        'L': 'l',
        'M': 'm',
        'N': 'n',
        'NG': 'ŋ',
        'OW': 'oʊ', 'OW0': 'oʊ', 'OW1': 'oʊ', 'OW2': 'oʊ',
        'OY': 'ɔɪ', 'OY0': 'ɔɪ', 'OY1': 'ɔɪ', 'OY2': 'ɔɪ',
        'P': 'p',
        'R': 'r',
        'S': 's',
        'SH': 'ʃ',
        'T': 't',
        'TH': 'θ',
        'UH': 'ʊ', 'UH0': 'ʊ', 'UH1': 'ʊ', 'UH2': 'ʊ',
        'UW': 'u', 'UW0': 'u', 'UW1': 'u', 'UW2': 'u',
        'V': 'v',
        'W': 'w',
        'Y': 'j',
        'Z': 'z',
        'ZH': 'ʒ'
    };

    constructor() { }

    /**
     * Get phonetic data for a target word
     * @param targetWord The word to analyze
     */
    getWordData(targetWord: string): WordData {
        const upperWord = targetWord.toUpperCase();
        const phonesStr = pronouncing.phonesForWord(upperWord)[0]; // Get first pronunciation

        if (!phonesStr) {
            // Handle unknown words gracefully
            return {
                targetWord,
                targetIPA: '/?/',
                ipaSymbols: [],
                phonemes: [],
                grammarList: []
            };
        }

        const phonemes = phonesStr.split(' ');
        const ipaSymbols = phonemes.map((p: string) => this.arpabetToIpa[p] || p);
        const targetIPA = '/' + ipaSymbols.join('') + '/';

        // Generate grammar with phonetically similar words
        const grammarList = this.generateSmartGrammar(targetWord, phonemes);

        console.log('Target:', targetWord, 'Phonemes:', phonemes, 'IPA:', targetIPA, 'Grammar:', grammarList);

        return {
            targetWord,
            targetIPA,
            ipaSymbols,
            phonemes,
            grammarList
        };
    }

    /**
     * Generate smart grammar based on phoneme similarity
     */
    private generateSmartGrammar(word: string, phonemes: string[]): string[] {
        const grammar = new Set<string>();
        grammar.add(word.toLowerCase());

        // Add common variations based on first phoneme for better recognition
        const commonConfusions: { [key: string]: string[] } = {
            'mask': ['mass', 'mas', 'mast', 'ask', 'task', 'bass', 'pass', 'fast'],
            'think': ['sink', 'thing', 'tin', 'thin', 'sing', 'ting', 'pink'],
            'the': ['de', 'zee', 'tea', 'see', 'thee'],
            'this': ['dis', 'these', 'tis', 'tiss'],
            'that': ['dat', 'fat', 'tat', 'bat', 'cat', 'hat'],
            'three': ['tree', 'free', 'thee'],
            'thank': ['tank', 'sank', 'ank'],
        };

        // Add known confusions if available
        const lowerWord = word.toLowerCase();
        if (commonConfusions[lowerWord]) {
            commonConfusions[lowerWord].forEach(w => grammar.add(w));
        }

        return Array.from(grammar).slice(0, 20); // Limit to 20 words
    }

    /**
     * @returns Array of indices in the target phonemes that were mismatched
     */
    analyzePronunciation(targetWord: string, recognizedWord: string): number[] {
        if (!targetWord || !recognizedWord) return [];
        if (targetWord.toLowerCase() === recognizedWord.toLowerCase()) return [];

        const targetPhonesStr = pronouncing.phonesForWord(targetWord.toUpperCase())[0];
        const recognizedPhonesStr = pronouncing.phonesForWord(recognizedWord.toUpperCase())[0];

        if (!targetPhonesStr || !recognizedPhonesStr) return [];

        const targetPhones = targetPhonesStr.split(' ');
        const recognizedPhones = recognizedPhonesStr.split(' ');

        // Simple comparison: check for mismatches
        // This is a basic implementation. For more advanced alignment, we'd need Needleman-Wunsch.
        const mismatches: number[] = [];
        const len = Math.min(targetPhones.length, recognizedPhones.length);

        for (let i = 0; i < len; i++) {
            if (targetPhones[i] !== recognizedPhones[i]) {
                mismatches.push(i);
            }
        }

        // If target is longer, mark remaining as missed
        for (let i = len; i < targetPhones.length; i++) {
            mismatches.push(i);
        }

        return mismatches;
    }
}
