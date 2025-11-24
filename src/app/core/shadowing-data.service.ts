import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
    Article,
    Sentence,
    UserShadowingProgress,
    LevelProgress,
    ShadowingSessionResult,
    SentencePack
} from './models/shadowing.models';
import { IpaPhonemeService } from './ipa-phoneme.service';

@Injectable({
    providedIn: 'root'
})
export class ShadowingDataService {
    // Sample articles with different levels
    private sentencePacks: SentencePack[] = [];

    private progressMap = new Map<string, UserShadowingProgress>();
    private progressSubject = new BehaviorSubject<Map<string, UserShadowingProgress>>(this.progressMap);
    public progress$ = this.progressSubject.asObservable();

    constructor(private ipaService: IpaPhonemeService) {
        this.initializeSentencePacks();
        this.loadProgress();
    }

    private initializeSentencePacks() {
        // Level 1 - Short Easy Sentences (30 sentences)
        this.createPack('1', 'Level 1: Basic Pronunciation', 1, 'Beginner', [
            "The sheep is eating grass.",
            "He is sitting on the seat.",
            "I see a green tree.",
            "Please eat your meat.",
            "She likes to drink tea.",
            "The ship is big.",
            "It is a little bit hot.",
            "Sit down on the chair.",
            "The cat is on the mat.",
            "My dad has a black hat.",
            "The man ran to the van.",
            "I have a map in my bag.",
            "The cup is full of water.",
            "The sun is up in the sky.",
            "Run for fun in the sun.",
            "I love my mother so much.",
            "Today is a good day.",
            "May I play with you?",
            "Say hello to my friend.",
            "I like to ride my bike.",
            "My eyes are wide open.",
            "The time is nine o'clock.",
            "I am fine, thank you.",
            "Look at the good book.",
            "The cook took a look.",
            "The moon is cool and blue.",
            "Two plus two is four.",
            "The boy has a new toy.",
            "Go slow in the snow.",
            "I know where to go."
        ]);

        // Level 2 - Medium Sentences (30 sentences)
        this.createPack('2', 'Level 2: Stress & Rhythm', 2, 'Intermediate', [
            "The weather is getting better today.",
            "I am happy to meet you here.",
            "Can you tell me the time please?",
            "I would like a cup of coffee.",
            "She is waiting for the bus now.",
            "He is working in the garden.",
            "We are going to the cinema.",
            "They are playing football outside.",
            "My sister lives in New York.",
            "I usually wake up at seven.",
            "Breakfast is the most important meal.",
            "I enjoy reading interesting books.",
            "Music helps me to relax.",
            "Learning English is very fun.",
            "Practice makes perfect every day.",
            "The teacher is writing on the board.",
            "Students are listening carefully.",
            "Please open your books to page ten.",
            "Do you have any questions for me?",
            "I understand what you are saying.",
            "Could you repeat that again please?",
            "Excuse me, where is the station?",
            "Turn left at the traffic lights.",
            "Go straight ahead for two blocks.",
            "The bank is on the right side.",
            "Thank you very much for your help.",
            "You are welcome, have a nice day.",
            "See you later in the afternoon.",
            "Good night and sweet dreams.",
            "I am looking forward to it."
        ]);

        // Level 3 - Long Fluent Sentences (30 sentences)
        this.createPack('3', 'Level 3: Fluency & Intonation', 3, 'Advanced', [
            "I need to figure out how to manage my schedule more effectively.",
            "Learning a new language opens up many opportunities for your future.",
            "It is important to practice speaking every day to improve your fluency.",
            "Climate change is one of the most pressing issues of our time.",
            "We must take action to reduce our carbon footprint immediately.",
            "Renewable energy sources are becoming more popular around the world.",
            "Technology has changed the way we communicate with each other.",
            "Social media allows us to stay connected with friends and family.",
            "However, it is also important to spend time offline sometimes.",
            "Reading books is a great way to expand your vocabulary and knowledge.",
            "I have been studying English for three years and I love it.",
            "My goal is to become fluent and travel to many countries.",
            "Understanding different cultures helps us to be more open-minded.",
            "Travel broadens the mind and gives us new perspectives on life.",
            "Healthy eating and regular exercise are essential for a long life.",
            "We should try to eat more fruits and vegetables every day.",
            "Getting enough sleep is also very important for our health.",
            "Stress management is a key skill in the modern workplace.",
            "Effective communication is the key to success in any career.",
            "Teamwork allows us to achieve more than we could alone.",
            "Problem-solving skills are highly valued by employers today.",
            "Creativity and innovation are driving forces of the economy.",
            "Education is the most powerful weapon which you can use to change the world.",
            "Never give up on your dreams, no matter how hard it gets.",
            "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            "The only way to do great work is to love what you do.",
            "Believe you can and you're halfway there.",
            "Your time is limited, so don't waste it living someone else's life.",
            "The best way to predict the future is to create it.",
            "Life is what happens when you're busy making other plans."
        ]);
    }

    private createPack(id: string, title: string, level: 1 | 2 | 3, category: string, sentences: string[]) {
        const pack: SentencePack = {
            id,
            title,
            content: sentences.join(' '),
            level,
            category,
            sentences: sentences.map((text, index) => ({
                id: `${id}_s${index}`,
                text,
                articleId: id,
                order: index,
                ipa: this.ipaService.getIpaForText(text),
                ipaSoundsCovered: this.ipaService.getIpaSoundsInSentence(text)
            })),
            createdAt: new Date()
        };
        this.sentencePacks.push(pack);
    }

    /**
     * Get all articles (sentence packs)
     */
    getAllArticles(): SentencePack[] {
        return [...this.sentencePacks];
    }

    /**
     * Get articles by level
     */
    getArticlesByLevel(level: 1 | 2 | 3): SentencePack[] {
        return this.sentencePacks.filter(a => a.level === level);
    }

    /**
     * Get article by ID
     */
    getArticle(id: string): SentencePack | undefined {
        return this.sentencePacks.find(a => a.id === id);
    }

    /**
     * Get user progress for a specific article
     */
    getProgress(articleId: string): UserShadowingProgress {
        const existing = this.progressMap.get(articleId);
        if (existing) return existing;

        const article = this.getArticle(articleId);
        if (!article) {
            // Return a dummy progress if article not found (shouldn't happen)
            return {
                articleId,
                completedSentences: 0,
                totalSentences: 0,
                averageAccuracy: 0,
                xpEarned: 0,
                lastPracticed: new Date(),
                status: 'not_started',
                sentenceAccuracies: {}
            };
        }

        // Create default progress
        const progress: UserShadowingProgress = {
            articleId,
            completedSentences: 0,
            totalSentences: article.sentences.length,
            averageAccuracy: 0,
            xpEarned: 0,
            lastPracticed: new Date(),
            status: 'not_started',
            sentenceAccuracies: {}
        };

        return progress;
    }

    /**
     * Record sentence attempt
     */
    recordSentenceAttempt(articleId: string, sentenceId: string, accuracy: number) {
        const article = this.getArticle(articleId);
        if (!article) return;

        let progress = this.progressMap.get(articleId) || this.getProgress(articleId);

        // Update sentence accuracy
        progress.sentenceAccuracies[sentenceId] = accuracy;
        progress.completedSentences = Object.keys(progress.sentenceAccuracies).length;

        // Calculate average accuracy
        const accuracies = Object.values(progress.sentenceAccuracies);
        progress.averageAccuracy = accuracies.length > 0
            ? Math.round(accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length)
            : 0;

        // Calculate XP: base 10 points per sentence, bonus for high accuracy
        // Only award XP if this is a new completion or improved score
        // For simplicity, we just accumulate XP for now, but in a real app we'd track max XP per sentence
        const sentenceXP = accuracy >= 90 ? 15 : accuracy >= 70 ? 10 : 5;
        progress.xpEarned += sentenceXP;

        // Update status
        if (progress.completedSentences >= progress.totalSentences) {
            progress.status = 'completed';
        } else if (progress.completedSentences > 0) {
            progress.status = 'in_progress';
        }

        progress.lastPracticed = new Date();

        this.progressMap.set(articleId, progress);
        this.progressSubject.next(new Map(this.progressMap));
        this.saveProgress();
    }

    /**
     * Get level progress summary
     */
    getLevelProgress(level: 1 | 2 | 3): LevelProgress {
        const articles = this.getArticlesByLevel(level);
        const completedArticles = articles.filter(a => {
            const progress = this.progressMap.get(a.id);
            return progress && progress.status === 'completed';
        });

        const totalXP = articles.reduce((sum, a) => {
            const progress = this.progressMap.get(a.id);
            return sum + (progress?.xpEarned || 0);
        }, 0);

        const accuracies = articles
            .map(a => this.progressMap.get(a.id)?.averageAccuracy || 0)
            .filter(acc => acc > 0);

        const averageAccuracy = accuracies.length > 0
            ? Math.round(accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length)
            : 0;

        return {
            level,
            articlesCompleted: completedArticles.length,
            totalArticles: articles.length,
            totalXP,
            averageAccuracy,
            xpEarned: totalXP // Added to satisfy interface
        };
    }

    /**
     * Check if level is unlocked (80% completion of previous level)
     */
    isLevelUnlocked(level: 1 | 2 | 3): boolean {
        if (level === 1) return true;

        const previousLevel = (level - 1) as 1 | 2;
        const prevProgress = this.getLevelProgress(previousLevel);

        if (prevProgress.totalArticles === 0) return false;

        const completionRate = prevProgress.articlesCompleted / prevProgress.totalArticles;
        return completionRate >= 0.8;
    }

    /**
     * Save progress to localStorage
     */
    private saveProgress() {
        try {
            const progressArray = Array.from(this.progressMap.entries());
            localStorage.setItem('shadowing_progress', JSON.stringify(progressArray));
        } catch (e) {
            console.error('Failed to save progress:', e);
        }
    }

    /**
     * Load progress from localStorage
     */
    private loadProgress() {
        try {
            const saved = localStorage.getItem('shadowing_progress');
            if (saved) {
                const progressArray = JSON.parse(saved);
                this.progressMap = new Map(progressArray);
                this.progressSubject.next(this.progressMap);
            }
        } catch (e) {
            console.error('Failed to load progress:', e);
        }
    }

    /**
     * Get total XP across all levels
     */
    getTotalXP(): number {
        return Array.from(this.progressMap.values())
            .reduce((sum, p) => sum + p.xpEarned, 0);
    }
}
