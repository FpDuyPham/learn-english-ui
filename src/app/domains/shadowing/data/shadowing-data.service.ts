import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
    UserShadowingProgress,
    LevelProgress,
    SentencePack
} from '../models/shadowing.models';
import { IpaPhonemeService } from '../../ipa/ipa.api';

@Injectable({
    providedIn: 'root'
})
export class ShadowingDataService {
    private sentencePacks: SentencePack[] = [];
    private progressMap = new Map<string, UserShadowingProgress>();
    private progressSubject = new BehaviorSubject<Map<string, UserShadowingProgress>>(this.progressMap);
    public progress$ = this.progressSubject.asObservable();

    constructor(private ipaService: IpaPhonemeService) {
        this.initializeSentencePacks();
        this.loadProgress();
    }

    private initializeSentencePacks() {
        // Create sample sentence packs for each level
        this.createPack('1', 'Level 1: Basic Pronunciation', 1, 'Beginner', [
            "The sheep is eating grass.",
            "He is sitting on the seat.",
            "I see a green tree."
        ]);

        this.createPack('2', 'Level 2: Stress & Rhythm', 2, 'Intermediate', [
            "The weather is getting better today.",
            "I am happy to meet you here."
        ]);

        this.createPack('3', 'Level 3: Fluency & Intonation', 3, 'Advanced', [
            "I need to figure out how to manage my schedule more effectively."
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

    getAllArticles(): SentencePack[] {
        return [...this.sentencePacks];
    }

    getArticlesByLevel(level: 1 | 2 | 3): SentencePack[] {
        return this.sentencePacks.filter(a => a.level === level);
    }

    getArticle(id: string): SentencePack | undefined {
        return this.sentencePacks.find(a => a.id === id);
    }

    getProgress(articleId: string): UserShadowingProgress {
        const existing = this.progressMap.get(articleId);
        if (existing) return existing;

        const article = this.getArticle(articleId);
        if (!article) {
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

        return {
            articleId,
            completedSentences: 0,
            totalSentences: article.sentences.length,
            averageAccuracy: 0,
            xpEarned: 0,
            lastPracticed: new Date(),
            status: 'not_started',
            sentenceAccuracies: {}
        };
    }

    recordSentenceAttempt(articleId: string, sentenceId: string, accuracy: number) {
        const article = this.getArticle(articleId);
        if (!article) return;

        let progress = this.progressMap.get(articleId) || this.getProgress(articleId);
        progress.sentenceAccuracies[sentenceId] = accuracy;
        progress.completedSentences = Object.keys(progress.sentenceAccuracies).length;

        const accuracies = Object.values(progress.sentenceAccuracies);
        progress.averageAccuracy = accuracies.length > 0
            ? Math.round(accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length)
            : 0;

        const sentenceXP = accuracy >= 90 ? 15 : accuracy >= 70 ? 10 : 5;
        progress.xpEarned += sentenceXP;

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

        return {
            level,
            articlesCompleted: completedArticles.length,
            totalArticles: articles.length,
            totalXP,
            averageAccuracy: 0,
            xpEarned: totalXP
        };
    }

    isLevelUnlocked(level: 1 | 2 | 3): boolean {
        if (level === 1) return true;
        const previousLevel = (level - 1) as 1 | 2;
        const prevProgress = this.getLevelProgress(previousLevel);
        if (prevProgress.totalArticles === 0) return false;
        return (prevProgress.articlesCompleted / prevProgress.totalArticles) >= 0.8;
    }

    private saveProgress() {
        try {
            const progressArray = Array.from(this.progressMap.entries());
            localStorage.setItem('shadowing_progress', JSON.stringify(progressArray));
        } catch (e) {
            console.error('Failed to save progress:', e);
        }
    }

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

    getTotalXP(): number {
        return Array.from(this.progressMap.values())
            .reduce((sum, p) => sum + p.xpEarned, 0);
    }
}
