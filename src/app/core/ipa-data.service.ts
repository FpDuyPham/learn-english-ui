import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Revised interfaces for level-based IPA learning
export interface IpaWord {
    word: string;
    ipa: string;
    confusions: {
        word: string;
        ipa: string;
        explanation: string;
    }[];
}

export interface IpaSound {
    symbol: string;
    level: 1 | 2 | 3;
    name: string;
    description: string;
    minimalPairs: string[];
    exampleWord: string;  // For list display
    words: IpaWord[];
}

export interface UserIpaProgress {
    symbol: string;
    level: number;
    wordsAttempted: number;
    wordsCorrect: number;
    accuracy: number;
    status: 'not_learned' | 'in_progress' | 'mastered';
    lastPracticed?: Date;
}

@Injectable({
    providedIn: 'root'
})
export class IpaDataService {

    // Level 1 - Beginner IPAs (6 most common)
    private ipaSounds: IpaSound[] = [
        // /iː/ - Long E
        {
            symbol: 'iː',
            level: 1,
            name: 'Long E',
            description: 'Spread your lips wide like a smile. Keep your tongue high and forward. This is the "ee" sound as in "see".',
            minimalPairs: ['sheep–ship', 'seat–sit', 'eat–it'],
            exampleWord: 'see',
            words: [
                { word: 'see', ipa: '/siː/', confusions: [{ word: 'sit', ipa: '/sɪt/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'sea', ipa: '/siː/', confusions: [{ word: 'sit', ipa: '/sɪt/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'tree', ipa: '/triː/', confusions: [{ word: 'trip', ipa: '/trɪp/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'free', ipa: '/friː/', confusions: [{ word: 'fridge', ipa: '/frɪdʒ/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'bee', ipa: '/biː/', confusions: [{ word: 'big', ipa: '/bɪɡ/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'three', ipa: '/θriː/', confusions: [{ word: 'thick', ipa: '/θɪk/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'green', ipa: '/ɡriːn/', confusions: [{ word: 'grin', ipa: '/ɡrɪn/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'sleep', ipa: '/sliːp/', confusions: [{ word: 'slip', ipa: '/slɪp/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'deep', ipa: '/diːp/', confusions: [{ word: 'dip', ipa: '/dɪp/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'keep', ipa: '/kiːp/', confusions: [{ word: 'kid', ipa: '/kɪd/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'feet', ipa: '/fiːt/', confusions: [{ word: 'fit', ipa: '/fɪt/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'meet', ipa: '/miːt/', confusions: [{ word: 'mit', ipa: '/mɪt/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'street', ipa: '/striːt/', confusions: [{ word: 'strict', ipa: '/strɪkt/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'sweet', ipa: '/swiːt/', confusions: [{ word: 'swift', ipa: '/swɪft/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'eat', ipa: '/iːt/', confusions: [{ word: 'it', ipa: '/ɪt/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'seat', ipa: '/siːt/', confusions: [{ word: 'sit', ipa: '/sɪt/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'heat', ipa: '/hiːt/', confusions: [{ word: 'hit', ipa: '/hɪt/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'beat', ipa: '/biːt/', confusions: [{ word: 'bit', ipa: '/bɪt/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'team', ipa: '/tiːm/', confusions: [{ word: 'tim', ipa: '/tɪm/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'dream', ipa: '/driːm/', confusions: [{ word: 'drip', ipa: '/drɪp/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'clean', ipa: '/kliːn/', confusions: [{ word: 'cling', ipa: '/klɪŋ/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'mean', ipa: '/miːn/', confusions: [{ word: 'min', ipa: '/mɪn/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'leaf', ipa: '/liːf/', confusions: [{ word: 'live', ipa: '/lɪv/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'beach', ipa: '/biːtʃ/', confusions: [{ word: 'bitch', ipa: '/bɪtʃ/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'teach', ipa: '/tiːtʃ/', confusions: [{ word: 'ditch', ipa: '/dɪtʃ/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'reach', ipa: '/riːtʃ/', confusions: [{ word: 'rich', ipa: '/rɪtʃ/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'each', ipa: '/iːtʃ/', confusions: [{ word: 'itch', ipa: '/ɪtʃ/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'peace', ipa: '/piːs/', confusions: [{ word: 'piss', ipa: '/pɪs/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'please', ipa: '/pliːz/', confusions: [{ word: 'bliss', ipa: '/blɪs/', explanation: 'You used short /ɪ/ instead of long /iː/' }] },
                { word: 'easy', ipa: '/ˈiːzi/', confusions: [{ word: 'dizzy', ipa: '/ˈdɪzi/', explanation: 'You used short /ɪ/ instead of long /iː/' }] }
            ]
        },
        // /ɪ/ - Short I
        {
            symbol: 'ɪ',
            level: 1,
            name: 'Short I',
            description: 'Relax your lips slightly. Tongue is high but lower than /iː/. Quick, short sound as in "sit".',
            minimalPairs: ['ship–sheep', 'sit–seat', 'it–eat'],
            exampleWord: 'sit',
            words: [
                { word: 'sit', ipa: '/sɪt/', confusions: [{ word: 'seat', ipa: '/siːt/', explanation: 'You used long /iː/ instead of short /ɪ/' }] },
                { word: 'it', ipa: '/ɪt/', confusions: [{ word: 'eat', ipa: '/iːt/', explanation: 'You used long /iː/ instead of short /ɪ/' }] },
                { word: 'ship', ipa: '/ʃɪp/', confusions: [{ word: 'sheep', ipa: '/ʃiːp/', explanation: 'You used long /iː/ instead of short /ɪ/' }] },
                { word: 'big', ipa: '/bɪɡ/', confusions: [{ word: 'bag', ipa: '/bæɡ/', explanation: 'You used /æ/ instead of /ɪ/' }] },
                { word: 'fish', ipa: '/fɪʃ/', confusions: [{ word: 'fresh', ipa: '/freʃ/', explanation: 'You used /e/ instead of /ɪ/' }] },
                { word: 'quick', ipa: '/kwɪk/', confusions: [{ word: 'quake', ipa: '/kweɪk/', explanation: 'You used /eɪ/ instead of /ɪ/' }] },
                { word: 'thin', ipa: '/θɪn/', confusions: [{ word: 'thing', ipa: '/θɪŋ/', explanation: 'Different ending sound' }] },
                { word: 'swim', ipa: '/swɪm/', confusions: [{ word: 'swam', ipa: '/swæm/', explanation: 'You used /æ/ instead of /ɪ/' }] },
                { word: 'milk', ipa: '/mɪlk/', confusions: [{ word: 'make', ipa: '/meɪk/', explanation: 'You used /eɪ/ instead of /ɪ/' }] },
                { word: 'pink', ipa: '/pɪŋk/', confusions: [{ word: 'peak', ipa: '/piːk/', explanation: 'You used long /iː/ instead of short /ɪ/' }] },
                { word: 'think', ipa: '/θɪŋk/', confusions: [{ word: 'thank', ipa: '/θæŋk/', explanation: 'You used /æ/ instead of /ɪ/' }] },
                { word: 'bring', ipa: '/brɪŋ/', confusions: [{ word: 'brang', ipa: '/bræŋ/', explanation: 'You used /æ/ instead of /ɪ/' }] },
                { word: 'king', ipa: '/kɪŋ/', confusions: [{ word: 'cane', ipa: '/keɪn/', explanation: 'You used /eɪ/ instead of /ɪ/' }] },
                { word: 'sing', ipa: '/sɪŋ/', confusions: [{ word: 'seen', ipa: '/siːn/', explanation: 'You used long /iː/ instead of short /ɪ/' }] },
                { word: 'miss', ipa: '/mɪs/', confusions: [{ word: 'mess', ipa: '/mes/', explanation: 'You used /e/ instead of /ɪ/' }] },
                { word: 'kid', ipa: '/kɪd/', confusions: [{ word: 'keyed', ipa: '/kiːd/', explanation: 'You used long /iː/ instead of short /ɪ/' }] },
                { word: 'bit', ipa: '/bɪt/', confusions: [{ word: 'beat', ipa: '/biːt/', explanation: 'You used long /iː/ instead of short /ɪ/' }] },
                { word: 'hit', ipa: '/hɪt/', confusions: [{ word: 'heat', ipa: '/hiːt/', explanation: 'You used long /iː/ instead of short /ɪ/' }] },
                { word: 'fit', ipa: '/fɪt/', confusions: [{ word: 'feet', ipa: '/fiːt/', explanation: 'You used long /iː/ instead of short /ɪ/' }] },
                { word: 'list', ipa: '/lɪst/', confusions: [{ word: 'least', ipa: '/liːst/', explanation: 'You used long /iː/ instead of short /ɪ/' }] },
                { word: 'live', ipa: '/lɪv/', confusions: [{ word: 'leave', ipa: '/liːv/', explanation: 'You used long /iː/ instead of short /ɪ/' }] },
                { word: 'give', ipa: '/ɡɪv/', confusions: [{ word: 'gave', ipa: '/ɡeɪv/', explanation: 'You used /eɪ/ instead of /ɪ/' }] },
                { word: 'win', ipa: '/wɪn/', confusions: [{ word: 'wean', ipa: '/wiːn/', explanation: 'You used long /iː/ instead of short /ɪ/' }] },
                { word: 'pin', ipa: '/pɪn/', confusions: [{ word: 'pain', ipa: '/peɪn/', explanation: 'You used /eɪ/ instead of /ɪ/' }] },
                { word: 'tin', ipa: '/tɪn/', confusions: [{ word: 'teen', ipa: '/tiːn/', explanation: 'You used long /iː/ instead of short /ɪ/' }] },
                { word: 'city', ipa: '/ˈsɪti/', confusions: [{ word: 'seat', ipa: '/siːt/', explanation: 'You used long /iː/ instead of short /ɪ/' }] },
                { word: 'fifty', ipa: '/ˈfɪfti/', confusions: [{ word: 'feat', ipa: '/fiːt/', explanation: 'You used long /iː/ instead of short /ɪ/' }] },
                { word: 'pretty', ipa: '/ˈprɪti/', confusions: [{ word: 'treaty', ipa: '/ˈtriːti/', explanation: 'You used long /iː/ instead of short /ɪ/' }] },
                { word: 'busy', ipa: '/ˈbɪzi/', confusions: [{ word: 'bees', ipa: '/biːz/', explanation: 'You used long /iː/ instead of short /ɪ/' }] },
                { word: 'build', ipa: '/bɪld/', confusions: [{ word: 'bead', ipa: '/biːd/', explanation: 'You used long /iː/ instead of short /ɪ/' }] }
            ]
        },
        // /æ/ - Short A (as in "cat")
        {
            symbol: 'æ',
            level: 1,
            name: 'Short A',
            description: 'Open your mouth wide. Drop your jaw. Make a flat, open sound as in "cat".',
            minimalPairs: ['cat–cut', 'bat–but', 'hat–hut'],
            exampleWord: 'cat',
            words: [
                { word: 'cat', ipa: '/kæt/', confusions: [{ word: 'cut', ipa: '/kʌt/', explanation: 'You used /ʌ/ instead of /æ/' }] },
                { word: 'bat', ipa: '/bæt/', confusions: [{ word: 'but', ipa: '/bʌt/', explanation: 'You used /ʌ/ instead of /æ/' }] },
                { word: 'hat', ipa: '/hæt/', confusions: [{ word: 'hut', ipa: '/hʌt/', explanation: 'You used /ʌ/ instead of /æ/' }] },
                { word: 'map', ipa: '/mæp/', confusions: [{ word: 'mop', ipa: '/mɒp/', explanation: 'You used /ɒ/ instead of /æ/' }] },
                { word: 'bad', ipa: '/bæd/', confusions: [{ word: 'bed', ipa: '/bed/', explanation: 'You used /e/ instead of /æ/' }] },
                { word: 'sad', ipa: '/sæd/', confusions: [{ word: 'said', ipa: '/sed/', explanation: 'You used /e/ instead of /æ/' }] },
                { word: 'man', ipa: '/mæn/', confusions: [{ word: 'men', ipa: '/men/', explanation: 'You used /e/ instead of /æ/' }] },
                { word: 'can', ipa: '/kæn/', confusions: [{ word: 'ken', ipa: '/ken/', explanation: 'You used /e/ instead of /æ/' }] },
                { word: 'bag', ipa: '/bæɡ/', confusions: [{ word: 'bug', ipa: '/bʌɡ/', explanation: 'You used /ʌ/ instead of /æ/' }] },
                { word: 'back', ipa: '/bæk/', confusions: [{ word: 'buck', ipa: '/bʌk/', explanation: 'You used /ʌ/ instead of /æ/' }] },
                { word: 'black', ipa: '/blæk/', confusions: [{ word: 'block', ipa: '/blɒk/', explanation: 'You used /ɒ/ instead of /æ/' }] },
                { word: 'hand', ipa: '/hænd/', confusions: [{ word: 'honed', ipa: '/həʊnd/', explanation: 'You used /əʊ/ instead of /æ/' }] },
                { word: 'stand', ipa: '/stænd/', confusions: [{ word: 'stoned', ipa: '/stəʊnd/', explanation: 'You used /əʊ/ instead of /æ/' }] },
                { word: 'plan', ipa: '/plæn/', confusions: [{ word: 'plan', ipa: '/plæn/', explanation: 'Correct!' }] },
                { word: 'fan', ipa: '/fæn/', confusions: [{ word: 'fun', ipa: '/fʌn/', explanation: 'You used /ʌ/ instead of /æ/' }] },
                { word: 'ran', ipa: '/ræn/', confusions: [{ word: 'run', ipa: '/rʌn/', explanation: 'You used /ʌ/ instead of /æ/' }] },
                { word: 'fast', ipa: '/fæst/', confusions: [{ word: 'fest', ipa: '/fest/', explanation: 'You used /e/ instead of /æ/' }] },
                { word: 'last', ipa: '/læst/', confusions: [{ word: 'lust', ipa: '/lʌst/', explanation: 'You used /ʌ/ instead of /æ/' }] },
                { word: 'class', ipa: '/klæs/', confusions: [{ word: 'close', ipa: '/kləʊz/', explanation: 'You used /əʊ/ instead of /æ/' }] },
                { word: 'pass', ipa: '/pæs/', confusions: [{ word: 'puss', ipa: '/pʊs/', explanation: 'You used /ʊ/ instead of /æ/' }] },
                { word: 'add', ipa: '/æd/', confusions: [{ word: 'odd', ipa: '/ɒd/', explanation: 'You used /ɒ/ instead of /æ/' }] },
                { word: 'dad', ipa: '/dæd/', confusions: [{ word: 'dead', ipa: '/ded/', explanation: 'You used /e/ instead of /æ/' }] },
                { word: 'mad', ipa: '/mæd/', confusions: [{ word: 'mud', ipa: '/mʌd/', explanation: 'You used /ʌ/ instead of /æ/' }] },
                { word: 'glad', ipa: '/ɡlæd/', confusions: [{ word: 'glide', ipa: '/ɡlaɪd/', explanation: 'You used /aɪ/ instead of /æ/' }] },
                { word: 'flat', ipa: '/flæt/', confusions: [{ word: 'flight', ipa: '/flaɪt/', explanation: 'You used /aɪ/ instead of /æ/' }] },
                { word: 'that', ipa: '/ðæt/', confusions: [{ word: 'the', ipa: '/ðə/', explanation: 'You used /ə/ instead of /æ/' }] },
                { word: 'have', ipa: '/hæv/', confusions: [{ word: 'heave', ipa: '/hiːv/', explanation: 'You used /iː/ instead of /æ/' }] },
                { word: 'happy', ipa: '/ˈhæpi/', confusions: [{ word: 'hippy', ipa: '/ˈhɪpi/', explanation: 'You used /ɪ/ instead of /æ/' }] },
                { word: 'carry', ipa: '/ˈkæri/', confusions: [{ word: 'curry', ipa: '/ˈkʌri/', explanation: 'You used /ʌ/ instead of /æ/' }] },
                { word: 'apple', ipa: '/ˈæpl/', confusions: [{ word: 'appal', ipa: '/əˈpɔːl/', explanation: 'You used /ɔː/ instead of /æ/' }] }
            ]
        },
        // /ʌ/ - Short U (as in "cup")
        {
            symbol: 'ʌ',
            level: 1,
            name: 'Short U',
            description: 'Relax your mouth. Mid-central sound. As in "cup" or "but".',
            minimalPairs: ['cut–cat', 'but–bat', 'cup–cap'],
            exampleWord: 'cup',
            words: [
                { word: 'cup', ipa: '/kʌp/', confusions: [{ word: 'cap', ipa: '/kæp/', explanation: 'You used /æ/ instead of /ʌ/' }] },
                { word: 'cut', ipa: '/kʌt/', confusions: [{ word: 'cat', ipa: '/kæt/', explanation: 'You used /æ/ instead of /ʌ/' }] },
                { word: 'but', ipa: '/bʌt/', confusions: [{ word: 'bat', ipa: '/bæt/', explanation: 'You used /æ/ instead of /ʌ/' }] },
                { word: 'run', ipa: '/rʌn/', confusions: [{ word: 'ran', ipa: '/ræn/', explanation: 'You used /æ/ instead of /ʌ/' }] },
                { word: 'sun', ipa: '/sʌn/', confusions: [{ word: 'son', ipa: '/sʌn/', explanation: 'Same pronunciation!' }] },
                { word: 'fun', ipa: '/fʌn/', confusions: [{ word: 'fan', ipa: '/fæn/', explanation: 'You used /æ/ instead of /ʌ/' }] },
                { word: 'gun', ipa: '/ɡʌn/', confusions: [{ word: 'gone', ipa: '/ɡɒn/', explanation: 'You used /ɒ/ instead of /ʌ/' }] },
                { word: 'bug', ipa: '/bʌɡ/', confusions: [{ word: 'bag', ipa: '/bæɡ/', explanation: 'You used /æ/ instead of /ʌ/' }] },
                { word: 'hug', ipa: '/hʌɡ/', confusions: [{ word: 'hag', ipa: '/hæɡ/', explanation: 'You used /æ/ instead of /ʌ/' }] },
                { word: 'rug', ipa: '/rʌɡ/', confusions: [{ word: 'rag', ipa: '/ræɡ/', explanation: 'You used /æ/ instead of /ʌ/' }] },
                { word: 'up', ipa: '/ʌp/', confusions: [{ word: 'ape', ipa: '/eɪp/', explanation: 'You used /eɪ/ instead of /ʌ/' }] },
                { word: 'us', ipa: '/ʌs/', confusions: [{ word: 'ace', ipa: '/eɪs/', explanation: 'You used /eɪ/ instead of /ʌ/' }] },
                { word: 'under', ipa: '/ˈʌndə/', confusions: [{ word: 'ander', ipa: '/ˈændə/', explanation: 'You used /æ/ instead of /ʌ/' }] },
                { word: 'number', ipa: '/ˈnʌmbə/', confusions: [{ word: 'number', ipa: '/ˈnʌmbə/', explanation: 'Correct!' }] },
                { word: 'summer', ipa: '/ˈsʌmə/', confusions: [{ word: 'simmer', ipa: '/ˈsɪmə/', explanation: 'You used /ɪ/ instead of /ʌ/' }] },
                { word: 'mother', ipa: '/ˈmʌðə/', confusions: [{ word: 'mather', ipa: '/ˈmæðə/', explanation: 'You used /æ/ instead of /ʌ/' }] },
                { word: 'brother', ipa: '/ˈbrʌðə/', confusions: [{ word: 'bra', ipa: '/brɑː/', explanation: 'You used /ɑː/ instead of /ʌ/' }] },
                { word: 'love', ipa: '/lʌv/', confusions: [{ word: 'leave', ipa: '/liːv/', explanation: 'You used /iː/ instead of /ʌ/' }] },
                { word: 'come', ipa: '/kʌm/', confusions: [{ word: 'comb', ipa: '/kəʊm/', explanation: 'You used /əʊ/ instead of /ʌ/' }] },
                { word: 'some', ipa: '/sʌm/', confusions: [{ word: 'same', ipa: '/seɪm/', explanation: 'You used /eɪ/ instead of /ʌ/' }] },
                { word: 'done', ipa: '/dʌn/', confusions: [{ word: 'dawn', ipa: '/dɔːn/', explanation: 'You used /ɔː/ instead of /ʌ/' }] },
                { word: 'son', ipa: '/sʌn/', confusions: [{ word: 'sun', ipa: '/sʌn/', explanation: 'Same pronunciation!' }] },
                { word: 'money', ipa: '/ˈmʌni/', confusions: [{ word: 'many', ipa: '/ˈmeni/', explanation: 'You used /e/ instead of /ʌ/' }] },
                { word: 'Monday', ipa: '/ˈmʌndeɪ/', confusions: [{ word: 'mend', ipa: '/mend/', explanation: 'You used /e/ instead of /ʌ/' }] },
                { word: 'month', ipa: '/mʌnθ/', confusions: [{ word: 'month', ipa: '/mʌnθ/', explanation: 'Correct!' }] },
                { word: 'front', ipa: '/frʌnt/', confusions: [{ word: 'frant', ipa: '/frænt/', explanation: 'You used /æ/ instead of /ʌ/' }] },
                { word: 'trust', ipa: '/trʌst/', confusions: [{ word: 'trast', ipa: '/træst/', explanation: 'You used /æ/ instead of /ʌ/' }] },
                { word: 'must', ipa: '/mʌst/', confusions: [{ word: 'mast', ipa: '/mæst/', explanation: 'You used /æ/ instead of /ʌ/' }] },
                { word: 'just', ipa: '/dʒʌst/', confusions: [{ word: 'jest', ipa: '/dʒest/', explanation: 'You used /e/ instead of /ʌ/' }] },
                { word: 'lunch', ipa: '/lʌntʃ/', confusions: [{ word: 'lynch', ipa: '/lɪntʃ/', explanation: 'You used /ɪ/ instead of /ʌ/' }] }
            ]
        },
        // /eɪ/ - Long A (diphthong, as in "day")
        {
            symbol: 'eɪ',
            level: 1,
            name: 'Long A',
            description: 'Glide from /e/ to /ɪ/. Your mouth starts slightly open, then closes. As in "day".',
            minimalPairs: ['day–die', 'say–sigh', 'pain–pine'],
            exampleWord: 'day',
            words: [
                { word: 'day', ipa: '/deɪ/', confusions: [{ word: 'die', ipa: '/daɪ/', explanation: 'You used /aɪ/ instead of /eɪ/' }] },
                { word: 'say', ipa: '/seɪ/', confusions: [{ word: 'sigh', ipa: '/saɪ/', explanation: 'You used /aɪ/ instead of /eɪ/' }] },
                { word: 'pay', ipa: '/peɪ/', confusions: [{ word: 'pie', ipa: '/paɪ/', explanation: 'You used /aɪ/ instead of /eɪ/' }] },
                { word: 'play', ipa: '/pleɪ/', confusions: [{ word: 'ply', ipa: '/plaɪ/', explanation: 'You used /aɪ/ instead of /eɪ/' }] },
                { word: 'may', ipa: '/meɪ/', confusions: [{ word: 'my', ipa: '/maɪ/', explanation: 'You used /aɪ/ instead of /eɪ/' }] },
                { word: 'way', ipa: '/weɪ/', confusions: [{ word: 'why', ipa: '/waɪ/', explanation: 'You used /aɪ/ instead of /eɪ/' }] },
                { word: 'stay', ipa: '/steɪ/', confusions: [{ word: 'sty', ipa: '/staɪ/', explanation: 'You used /aɪ/ instead of /eɪ/' }] },
                { word: 'make', ipa: '/meɪk/', confusions: [{ word: 'mike', ipa: '/maɪk/', explanation: 'You used /aɪ/ instead of /eɪ/' }] },
                { word: 'take', ipa: '/teɪk/', confusions: [{ word: 'tike', ipa: '/taɪk/', explanation: 'You used /aɪ/ instead of /eɪ/' }] },
                { word: 'lake', ipa: '/leɪk/', confusions: [{ word: 'like', ipa: '/laɪk/', explanation: 'You used /aɪ/ instead of /eɪ/' }] },
                { word: 'face', ipa: '/feɪs/', confusions: [{ word: 'fuss', ipa: '/fʌs/', explanation: 'You used /ʌ/ instead of /eɪ/' }] },
                { word: 'place', ipa: '/pleɪs/', confusions: [{ word: 'plus', ipa: '/plʌs/', explanation: 'You used /ʌ/ instead of /eɪ/' }] },
                { word: 'space', ipa: '/speɪs/', confusions: [{ word: 'spice', ipa: '/spaɪs/', explanation: 'You used /aɪ/ instead of /eɪ/' }] },
                { word: 'name', ipa: '/neɪm/', confusions: [{ word: 'nime', ipa: '/naɪm/', explanation: 'You used /aɪ/ instead of /eɪ/' }] },
                { word: 'game', ipa: '/ɡeɪm/', confusions: [{ word: 'gum', ipa: '/ɡʌm/', explanation: 'You used /ʌ/ instead of /eɪ/' }] },
                { word: 'same', ipa: '/seɪm/', confusions: [{ word: 'some', ipa: '/sʌm/', explanation: 'You used /ʌ/ instead of /eɪ/' }] },
                { word: 'late', ipa: '/leɪt/', confusions: [{ word: 'light', ipa: '/laɪt/', explanation: 'You used /aɪ/ instead of /eɪ/' }] },
                { word: 'gate', ipa: '/ɡeɪt/', confusions: [{ word: 'got', ipa: '/ɡɒt/', explanation: 'You used /ɒ/ instead of /eɪ/' }] },
                { word: 'date', ipa: '/deɪt/', confusions: [{ word: 'debt', ipa: '/det/', explanation: 'You used /e/ instead of /eɪ/' }] },
                { word: 'wait', ipa: '/weɪt/', confusions: [{ word: 'white', ipa: '/waɪt/', explanation: 'You used /aɪ/ instead of /eɪ/' }] },
                { word: 'rain', ipa: '/reɪn/', confusions: [{ word: 'Ryan', ipa: '/ˈraɪən/', explanation: 'You used /aɪ/ instead of /eɪ/' }] },
                { word: 'train', ipa: '/treɪn/', confusions: [{ word: 'try', ipa: '/traɪ/', explanation: 'You used /aɪ/ instead of /eɪ/' }] },
                { word: 'pain', ipa: '/peɪn/', confusions: [{ word: 'pine', ipa: '/paɪn/', explanation: 'You used /aɪ/ instead of /eɪ/' }] },
                { word: 'main', ipa: '/meɪn/', confusions: [{ word: 'mine', ipa: '/maɪn/', explanation: 'You used /aɪ/ instead of /eɪ/' }] },
                { word: 'away', ipa: '/əˈweɪ/', confusions: [{ word: 'awry', ipa: '/əˈraɪ/', explanation: 'You used /aɪ/ instead of /eɪ/' }] },
                { word: 'today', ipa: '/təˈdeɪ/', confusions: [{ word: 'toddy', ipa: '/ˈtɒdi/', explanation: 'You used /ɒ/ instead of /eɪ/' }] },
                { word: 'great', ipa: '/ɡreɪt/', confusions: [{ word: 'grit', ipa: '/ɡrɪt/', explanation: 'You used /ɪ/ instead of /eɪ/' }] },
                { word: 'break', ipa: '/breɪk/', confusions: [{ word: 'brick', ipa: '/brɪk/', explanation: 'You used /ɪ/ instead of /eɪ/' }] },
                { word: 'eight', ipa: '/eɪt/', confusions: [{ word: 'eat', ipa: '/iːt/', explanation: 'You used /iː/ instead of /eɪ/' }] },
                { word: 'weight', ipa: '/weɪt/', confusions: [{ word: 'wheat', ipa: '/wiːt/', explanation: 'You used /iː/ instead of /eɪ/' }] }
            ]
        },
        // /aɪ/ - Long I (diphthong, as in "my")
        {
            symbol: 'aɪ',
            level: 1,
            name: 'Long I',
            description: 'Glide from /a/ to /ɪ/. Start with mouth open, then close to /ɪ/. As in "my" or "ice".',
            minimalPairs: ['die–day', 'time–tame', 'high–hay'],
            exampleWord: 'my',
            words: [
                { word: 'my', ipa: '/maɪ/', confusions: [{ word: 'may', ipa: '/meɪ/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'I', ipa: '/aɪ/', confusions: [{ word: 'eye', ipa: '/aɪ/', explanation: 'Same pronunciation!' }] },
                { word: 'eye', ipa: '/aɪ/', confusions: [{ word: 'ay', ipa: '/eɪ/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'why', ipa: '/waɪ/', confusions: [{ word: 'way', ipa: '/weɪ/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'high', ipa: '/haɪ/', confusions: [{ word: 'hey', ipa: '/heɪ/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'time', ipa: '/taɪm/', confusions: [{ word: 'tame', ipa: '/teɪm/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'line', ipa: '/laɪn/', confusions: [{ word: 'lane', ipa: '/leɪn/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'nine', ipa: '/naɪn/', confusions: [{ word: 'nein', ipa: '/naɪn/', explanation: 'Correct!' }] },
                { word: 'fine', ipa: '/faɪn/', confusions: [{ word: 'feign', ipa: '/feɪn/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'mine', ipa: '/maɪn/', confusions: [{ word: 'main', ipa: '/meɪn/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'like', ipa: '/laɪk/', confusions: [{ word: 'lake', ipa: '/leɪk/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'bike', ipa: '/baɪk/', confusions: [{ word: 'bake', ipa: '/beɪk/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'ice', ipa: '/aɪs/', confusions: [{ word: 'ace', ipa: '/eɪs/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'nice', ipa: '/naɪs/', confusions: [{ word: 'neigh', ipa: '/neɪ/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'price', ipa: '/praɪs/', confusions: [{ word: 'praise', ipa: '/preɪz/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'white', ipa: '/waɪt/', confusions: [{ word: 'wait', ipa: '/weɪt/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'quite', ipa: '/kwaɪt/', confusions: [{ word: 'quit', ipa: '/kwɪt/', explanation: 'You used /ɪ/ instead of /aɪ/' }] },
                { word: 'write', ipa: '/raɪt/', confusions: [{ word: 'rate', ipa: '/reɪt/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'five', ipa: '/faɪv/', confusions: [{ word: 'fave', ipa: '/feɪv/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'drive', ipa: '/draɪv/', confusions: [{ word: 'drove', ipa: '/drəʊv/', explanation: 'You used /əʊ/ instead of /aɪ/' }] },
                { word: 'life', ipa: '/laɪf/', confusions: [{ word: 'leaf', ipa: '/liːf/', explanation: 'You used /iː/ instead of /aɪ/' }] },
                { word: 'wife', ipa: '/waɪf/', confusions: [{ word: 'waif', ipa: '/weɪf/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'knife', ipa: '/naɪf/', confusions: [{ word: 'nave', ipa: '/neɪv/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'night', ipa: '/naɪt/', confusions: [{ word: 'neigh', ipa: '/neɪ/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'light', ipa: '/laɪt/', confusions: [{ word: 'late', ipa: '/leɪt/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'right', ipa: '/raɪt/', confusions: [{ word: 'rate', ipa: '/reɪt/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'fight', ipa: '/faɪt/', confusions: [{ word: 'fate', ipa: '/feɪt/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'try', ipa: '/traɪ/', confusions: [{ word: 'tray', ipa: '/treɪ/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'cry', ipa: '/kraɪ/', confusions: [{ word: 'cray', ipa: '/kreɪ/', explanation: 'You used /eɪ/ instead of /aɪ/' }] },
                { word: 'fly', ipa: '/flaɪ/', confusions: [{ word: 'flay', ipa: '/fleɪ/', explanation: 'You used /eɪ/ instead of /aɪ/' }] }
            ]
        }
    ];

    // User progress tracking
    private progressSubject = new BehaviorSubject<Map<string, UserIpaProgress>>(new Map());
    progress$ = this.progressSubject.asObservable();

    constructor() {
        this.loadProgress();
    }

    // Get all IPAs for a specific level
    getIPAsForLevel(level: 1 | 2 | 3): IpaSound[] {
        return this.ipaSounds.filter(ipa => ipa.level === level);
    }

    // Get specific IPA sound
    getIPASound(symbol: string, level: number): IpaSound | undefined {
        return this.ipaSounds.find(ipa => ipa.symbol === symbol && ipa.level === level);
    }

    // Get user progress for a specific IPA
    getProgress(symbol: string, level: number): UserIpaProgress {
        const key = `${symbol}_${level}`;
        const current = this.progressSubject.value.get(key);
        if (current) return current;

        // Default progress
        return {
            symbol,
            level,
            wordsAttempted: 0,
            wordsCorrect: 0,
            accuracy: 0,
            status: 'not_learned'
        };
    }

    // Record a word attempt
    recordWordAttempt(symbol: string, level: number, correct: boolean) {
        const key = `${symbol}_${level}`;
        const progress = this.getProgress(symbol, level);

        progress.wordsAttempted++;
        if (correct) progress.wordsCorrect++;

        progress.accuracy = Math.round((progress.wordsCorrect / progress.wordsAttempted) * 100);
        progress.lastPracticed = new Date();

        // Update status based on words completed and accuracy
        const totalWords = 30;
        if (progress.wordsAttempted >= totalWords && progress.accuracy >= 80) {
            progress.status = 'mastered';
        } else if (progress.wordsAttempted > 0) {
            progress.status = 'in_progress';
        }

        const currentMap = this.progressSubject.value;
        currentMap.set(key, progress);
        this.progressSubject.next(new Map(currentMap));
        this.saveProgress();
    }

    // Check if level is unlocked (80% mastery of previous level)
    isLevelUnlocked(level: 1 | 2 | 3): boolean {
        if (level === 1) return true;

        const previousLevel = (level - 1) as 1 | 2;
        const previousIPAs = this.getIPAsForLevel(previousLevel);

        if (previousIPAs.length === 0) return false;

        const masteredCount = previousIPAs.filter(ipa => {
            const progress = this.getProgress(ipa.symbol, previousLevel);
            return progress.status === 'mastered';
        }).length;

        return (masteredCount / previousIPAs.length) >= 0.8;
    }

    private saveProgress() {
        const progressArray = Array.from(this.progressSubject.value.entries());
        localStorage.setItem('ipa_progress_v2', JSON.stringify(progressArray));
    }

    private loadProgress() {
        const saved = localStorage.getItem('ipa_progress_v2');
        if (saved) {
            try {
                const progressArray = JSON.parse(saved);
                this.progressSubject.next(new Map(progressArray));
            } catch (e) {
                console.error('Failed to load IPA progress', e);
            }
        }
    }
}
