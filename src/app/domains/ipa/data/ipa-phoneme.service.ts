import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class IpaPhonemeService {

    // Basic dictionary of common words to IPA
    // In a real app, this would be a much larger database or external API
    private ipaDictionary: { [word: string]: string } = {
        'the': 'ðə', 'be': 'biː', 'to': 'tuː', 'of': 'əv', 'and': 'ænd',
        'a': 'ə', 'in': 'ɪn', 'that': 'ðæt', 'have': 'hæv', 'i': 'aɪ',
        'it': 'ɪt', 'for': 'fɔːr', 'not': 'nɒt', 'on': 'ɒn', 'with': 'wɪð',
        'he': 'hiː', 'as': 'æz', 'you': 'juː', 'do': 'duː', 'at': 'æt',
        'this': 'ðɪs', 'but': 'bʌt', 'his': 'hɪz', 'by': 'baɪ', 'from': 'frɒm',
        'they': 'ðeɪ', 'we': 'wiː', 'say': 'seɪ', 'her': 'hɜːr', 'she': 'ʃiː',
        'or': 'ɔːr', 'an': 'æn', 'will': 'wɪl', 'my': 'maɪ', 'one': 'wʌn',
        'all': 'ɔːl', 'would': 'wʊd', 'there': 'ðeər', 'their': 'ðeər', 'what': 'wɒt',
        'so': 'səʊ', 'up': 'ʌp', 'out': 'aʊt', 'if': 'ɪf', 'about': 'əˈbaʊt',
        'who': 'huː', 'get': 'ɡet', 'which': 'wɪtʃ', 'go': 'ɡəʊ', 'me': 'miː',
        'when': 'wen', 'make': 'meɪk', 'can': 'kæn', 'like': 'laɪk', 'time': 'taɪm',
        'no': 'nəʊ', 'just': 'dʒʌst', 'him': 'hɪm', 'know': 'nəʊ', 'take': 'teɪk',
        'people': 'ˈpiːpl', 'into': 'ˈɪntuː', 'year': 'jɪər', 'your': 'jɔːr', 'good': 'ɡʊd',
        'some': 'sʌm', 'could': 'kʊd', 'them': 'ðem', 'see': 'siː', 'other': 'ˈʌðər',
        'than': 'ðæn', 'then': 'ðen', 'now': 'naʊ', 'look': 'lʊk', 'only': 'ˈəʊnli',
        'come': 'kʌm', 'its': 'ɪts', 'over': 'ˈəʊvər', 'think': 'θɪŋk', 'also': 'ˈɔːlsəʊ',
        'back': 'bæk', 'after': 'ˈɑːftər', 'use': 'juːz', 'two': 'tuː', 'how': 'haʊ',
        'our': 'aʊər', 'work': 'wɜːrk', 'first': 'fɜːrst', 'well': 'wel', 'way': 'weɪ',
        'even': 'ˈiːvn', 'new': 'njuː', 'want': 'wɒnt', 'because': 'bɪˈkɒz', 'any': 'ˈeni',
        'these': 'ðiːz', 'give': 'ɡɪv', 'day': 'deɪ', 'most': 'məʊst', 'us': 'ʌs',
        'sheep': 'ʃiːp', 'eating': 'ˈiːtɪŋ', 'grass': 'ɡrɑːs', 'is': 'ɪz',
        'weather': 'ˈweðər', 'getting': 'ˈɡetɪŋ', 'better': 'ˈbetər', 'today': 'təˈdeɪ',
        'need': 'niːd', 'figure': 'ˈfɪɡər', 'manage': 'ˈmænɪdʒ', 'schedule': 'ˈskedʒuːl',
        'effectively': 'ɪˈfektɪvli', 'hello': 'həˈləʊ', 'fine': 'faɪn', 'thank': 'θæŋk',
        'nice': 'naɪs', 'meet': 'miːt', 'later': 'ˈleɪtər', 'name': 'neɪm',
        'john': 'dʒɒn', 'canada': 'ˈkænədə', 'student': 'ˈstjuːdnt', 'reading': 'ˈriːdɪŋ',
        'books': 'bʊks', 'english': 'ˈɪŋɡlɪʃ', 'fun': 'fʌn', 'learn': 'lɜːrn',
        'coffee': 'ˈkɒfi', 'menu': 'ˈmenjuː', 'please': 'pliːz', 'delicious': 'dɪˈlɪʃəs',
        'much': 'mʌtʃ', 'meal': 'miːl', 'movies': 'ˈmuːviz', 'weekend': 'ˌwiːkˈend',
        'great': 'ɡreɪt', 'idea': 'aɪˈdɪə', 'cinema': 'ˈsɪnəmə', 'seven': 'ˈsevn',
        'clock': 'klɒk', 'looking': 'ˈlʊkɪŋ', 'forward': 'ˈfɔːrwərd', 'usually': 'ˈjuːʒuəli',
        'wake': 'weɪk', 'morning': 'ˈmɔːrnɪŋ', 'breakfast': 'ˈbrekfəst', 'bus': 'bʌs',
        'lunch': 'lʌntʃ', 'colleagues': 'ˈkɒliːɡz', 'evening': 'ˈiːvnɪŋ', 'relax': 'rɪˈlæks',
        'watch': 'wɒtʃ', 'television': 'ˈtelɪvɪʒn', 'bed': 'bed', 'around': 'əˈraʊnd',
        'eleven': 'ɪˈlevn', 'night': 'naɪt', 'excuse': 'ɪkˈskjuːs', 'find': 'faɪnd',
        'nearest': 'ˈnɪərɪst', 'bank': 'bæŋk', 'straight': 'streɪt', 'ahead': 'əˈhed',
        'blocks': 'blɒks', 'turn': 'tɜːrn', 'left': 'left', 'traffic': 'ˈtræfɪk',
        'lights': 'laɪts', 'right': 'raɪt', 'side': 'saɪd', 'miss': 'mɪs',
        'opinion': 'əˈpɪnjən', 'languages': 'ˈlæŋɡwɪdʒɪz', 'opens': 'ˈəʊpənz', 'many': 'ˈmeni',
        'opportunities': 'ˌɒpəˈtjuːnətiz', 'however': 'haʊˈevər', 'requires': 'rɪˈkwaɪərz',
        'consistent': 'kənˈsɪstənt', 'practice': 'ˈpræktɪs', 'dedication': 'ˌdedɪˈkeɪʃn',
        'grammar': 'ˈɡræmər', 'challenging': 'ˈtʃælɪndʒɪŋ', 'while': 'waɪl', 'others': 'ˈʌðərz',
        'struggle': 'ˈstrʌɡl', 'pronunciation': 'prəˌnʌnsiˈeɪʃn', 'nevertheless': 'ˌnevəðəˈles',
        'benefits': 'ˈbenɪfɪts', 'far': 'fɑːr', 'outweigh': 'ˌaʊtˈweɪ', 'difficulties': 'ˈdɪfɪkəltiz',
        'studying': 'ˈstʌdiɪŋ', 'three': 'θriː', 'years': 'jɪərz', 'goal': 'ɡəʊl',
        'become': 'bɪˈkʌm', 'fluent': 'ˈfluːənt', 'within': 'wɪˈðɪn', 'next': 'nekst',
        'achieve': 'əˈtʃiːv', 'speaking': 'ˈspiːkɪŋ', 'every': 'ˈevri', 'subtitles': 'ˈsʌbtaɪtlz',
        'approach': 'əˈprəʊtʃ', 'significantly': 'sɪɡˈnɪfɪkəntli', 'improved': 'ɪmˈpruːvd',
        'comprehension': 'ˌkɒmprɪˈhenʃn', 'skills': 'skɪlz', 'climate': 'ˈklaɪmət',
        'change': 'tʃeɪndʒ', 'pressing': 'ˈpresɪŋ', 'issues': 'ˈɪʃuːz', 'must': 'mʌst',
        'action': 'ˈækʃn', 'reduce': 'rɪˈdjuːs', 'carbon': 'ˈkɑːrbən', 'emissions': 'iˈmɪʃnz',
        'renewable': 'rɪˈnjuːəbl', 'energy': 'ˈenərdʒi', 'sources': 'ˈsɔːrsɪz', 'offer': 'ˈɒfər',
        'sustainable': 'səˈsteɪnəbl', 'alternatives': 'ɔːlˈtɜːrnətɪvz', 'individual': 'ˌɪndɪˈvɪdʒuəl',
        'choices': 'ˈtʃɔɪsɪz', 'such': 'sʌtʃ', 'recycling': 'ˌriːˈsaɪklɪŋ', 'conserving': 'kənˈsɜːrvɪŋ',
        'water': 'ˈwɔːtər', 'difference': 'ˈdɪfrəns', 'together': 'təˈɡeðər', 'create': 'kriˈeɪt',
        'future': 'ˈfjuːtʃər', 'generations': 'ˌdʒenəˈreɪʃnz'
    };

    constructor() { }

    /**
     * Convert text to IPA
     * @param text English text
     * @returns IPA transcription
     */
    getIpaForText(text: string): string {
        const words = text.toLowerCase()
            .replace(/[.,!?;:'"]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 0);

        return words.map(word => this.getIpaForWord(word)).join(' ');
    }

    /**
     * Get IPA for a single word
     * @param word English word
     * @returns IPA string
     */
    getIpaForWord(word: string): string {
        const lower = word.toLowerCase();
        if (this.ipaDictionary[lower]) {
            return this.ipaDictionary[lower];
        }
        // Fallback for unknown words: return word in brackets
        return `[${word}]`;
    }

    /**
     * Get list of IPA sounds present in a sentence
     * @param text Sentence text
     * @returns Array of IPA symbols
     */
    getIpaSoundsInSentence(text: string): string[] {
        const ipa = this.getIpaForText(text);
        const sounds: Set<string> = new Set();

        // Common IPA symbols to look for
        const symbols = [
            'iː', 'ɪ', 'e', 'æ', 'ɑː', 'ɒ', 'ɔː', 'ʊ', 'uː', 'ʌ', 'ɜː', 'ə',
            'eɪ', 'aɪ', 'ɔɪ', 'əʊ', 'aʊ', 'ɪə', 'eə', 'ʊə',
            'p', 'b', 't', 'd', 'k', 'ɡ', 'f', 'v', 'θ', 'ð', 's', 'z', 'ʃ', 'ʒ', 'h',
            'm', 'n', 'ŋ', 'l', 'r', 'j', 'w', 'tʃ', 'dʒ'
        ];

        symbols.forEach(symbol => {
            if (ipa.includes(symbol)) {
                sounds.add(symbol);
            }
        });

        return Array.from(sounds);
    }

    /**
     * Compare target IPA with user's estimated IPA
     * @param targetWord Target word
     * @param userWord User's recognized word
     * @returns Comparison result
     */
    compareIpa(targetWord: string, userWord: string): { match: boolean, expected: string, actual: string } {
        const expected = this.getIpaForWord(targetWord);
        const actual = this.getIpaForWord(userWord);

        return {
            match: targetWord.toLowerCase() === userWord.toLowerCase(),
            expected,
            actual
        };
    }
}
